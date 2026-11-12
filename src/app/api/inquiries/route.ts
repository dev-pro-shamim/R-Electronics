import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest, hasRolePermission } from "@/lib/adminAuth";
import { appendAuditLog, readAdminDb, writeAdminDb } from "@/lib/adminDb";
import { buildAuthenticatedAdminPayload } from "@/lib/adminServerHelpers";
import { dispatchNotification, wrapRangoEmailTemplate } from "@/lib/notifications";
import { ContactInquiryRecord } from "@/types/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();
    const subject = String(body.subject || "General Customer Query").trim();
    const message = String(body.message || "").trim();

    if (!name || (!email && !phone) || !message) {
      return NextResponse.json(
        { error: "Name, contact info (email or phone), and message are required." },
        { status: 400 }
      );
    }

    const db = readAdminDb();
    const inquiry: ContactInquiryRecord = {
      id: `INQ-${Date.now().toString().slice(-6)}`,
      name,
      email: email || "N/A",
      phone: phone || undefined,
      subject,
      message,
      status: "Pending",
      replies: [],
      createdAt: new Date().toISOString(),
    };

    const nextDb = {
      ...db,
      contactInquiries: [inquiry, ...(db.contactInquiries || [])].slice(0, 300),
    };

    await dispatchNotification({
      eventKey: `inq-${inquiry.id}`,
      eventType: "inquiry_received",
      subject: `[Contact Inquiry] ${subject} — ${name}`,
      html: wrapRangoEmailTemplate(
        "New Customer Contact Inquiry",
        "INQUIRY",
        `<p><strong>From:</strong> ${name}<br/>
        <strong>Email:</strong> ${email || "N/A"}<br/>
        <strong>Phone:</strong> ${phone || "N/A"}<br/>
        <strong>Subject:</strong> ${subject}</p>
        <blockquote style="background:#f8fafc;border-left:3px solid #0084C7;padding:12px;">${message}</blockquote>`
      ),
      db: nextDb,
    });

    writeAdminDb(nextDb);

    return NextResponse.json({ success: true, inquiryId: inquiry.id });
  } catch {
    return NextResponse.json({ error: "Failed to submit inquiry." }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const db = readAdminDb();
    if (!hasRolePermission(session.role, "inquiries", db.roles)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const id = String(body.id || "");
    const replyText = body.replyText ? String(body.replyText).trim() : "";
    const status = body.status as ContactInquiryRecord["status"] | undefined;
    const assignedAgent = body.assignedAgent ? String(body.assignedAgent) : undefined;
    const adminNotes = body.adminNotes !== undefined ? String(body.adminNotes) : undefined;

    const updated = (db.contactInquiries || []).map((inq) => {
      if (inq.id !== id) return inq;
      const nextReplies = replyText
        ? [
            ...(inq.replies || []),
            { sender: session.email, text: replyText, sentAt: new Date().toISOString() },
          ]
        : inq.replies || [];
      return {
        ...inq,
        status: status || (replyText ? "Replied" : inq.status),
        assignedAgent: assignedAgent ?? inq.assignedAgent,
        adminNotes: adminNotes ?? inq.adminNotes,
        replies: nextReplies,
      };
    });

    const logged = appendAuditLog(
      { ...db, contactInquiries: updated },
      session.email,
      "Customer Support",
      `Updated contact inquiry ${id}${replyText ? " with reply" : ""}`,
      session.role
    );
    writeAdminDb(logged);

    return NextResponse.json(await buildAuthenticatedAdminPayload(logged));
  } catch {
    return NextResponse.json({ error: "Failed to update inquiry." }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get("id");
  const db = readAdminDb();
  if (!hasRolePermission(session.role, "inquiries", db.roles)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const logged = appendAuditLog(
    {
      ...db,
      contactInquiries: (db.contactInquiries || []).filter((i) => i.id !== id),
    },
    session.email,
    "Customer Support",
    `Deleted contact inquiry ${id}`,
    session.role
  );
  writeAdminDb(logged);
  return NextResponse.json(await buildAuthenticatedAdminPayload(logged));
}
