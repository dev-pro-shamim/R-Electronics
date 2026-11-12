import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest, hasRolePermission } from "@/lib/adminAuth";
import { appendAuditLog, readAdminDb, writeAdminDb } from "@/lib/adminDb";
import { buildAuthenticatedAdminPayload } from "@/lib/adminServerHelpers";
import { ChatConversationRecord, ChatbotFaqItem } from "@/types/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const conversationId = String(body.conversationId || "");
    const customerName = String(body.customerName || "Website Visitor");
    const customerPhone = body.customerPhone ? String(body.customerPhone) : undefined;
    const customerEmail = body.customerEmail ? String(body.customerEmail) : undefined;
    const customerMessage = String(body.customerMessage || "").trim();
    const botReply = String(body.botReply || "").trim();
    const productLink = body.productLink ? String(body.productLink) : undefined;

    if (!customerMessage) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const db = readAdminDb();
    const nowTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const existing = (db.chatConversations || []).find((c) => c.id === conversationId);
    let nextConversations: ChatConversationRecord[];
    let usedId = conversationId;

    if (existing) {
      nextConversations = db.chatConversations.map((c) => {
        if (c.id !== existing.id) return c;
        const appended = [
          ...c.messages,
          {
            id: `cm-${Date.now()}`,
            sender: "customer" as const,
            text: customerMessage,
            time: nowTime,
          },
        ];
        if (botReply) {
          appended.push({
            id: `bm-${Date.now() + 1}`,
            sender: "bot" as const,
            text: botReply,
            productLink,
            time: nowTime,
          });
        }
        return { ...c, question: customerMessage, messages: appended };
      });
    } else {
      usedId = conversationId || `chat-${Date.now()}`;
      const newConv: ChatConversationRecord = {
        id: usedId,
        customerName,
        customerPhone,
        customerEmail,
        question: customerMessage,
        status: "Open",
        createdAt: new Date().toISOString(),
        messages: [
          {
            id: `cm-${Date.now()}`,
            sender: "customer",
            text: customerMessage,
            time: nowTime,
          },
          ...(botReply
            ? [
                {
                  id: `bm-${Date.now() + 1}`,
                  sender: "bot" as const,
                  text: botReply,
                  productLink,
                  time: nowTime,
                },
              ]
            : []),
        ],
      };
      nextConversations = [newConv, ...(db.chatConversations || [])].slice(0, 250);
    }

    writeAdminDb({ ...db, chatConversations: nextConversations });
    return NextResponse.json({ success: true, conversationId: usedId });
  } catch {
    return NextResponse.json({ error: "Failed to log chat message" }, { status: 400 });
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
    if (!hasRolePermission(session.role, "chatbot", db.roles)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (body.mode === "faqs") {
      const faqs = (body.chatbotFaqs || []) as ChatbotFaqItem[];
      const predefinedReplies = Array.isArray(body.predefinedReplies)
        ? body.predefinedReplies
        : db.predefinedReplies;
      const logged = appendAuditLog(
        { ...db, chatbotFaqs: faqs, predefinedReplies },
        session.email,
        "Chatbot",
        "Updated Rango Assistant FAQ & quick replies",
        session.role
      );
      writeAdminDb(logged);
      return NextResponse.json(await buildAuthenticatedAdminPayload(logged));
    }

    const conversationId = String(body.conversationId || "");
    const replyText = body.replyText ? String(body.replyText).trim() : "";
    const status = body.status as ChatConversationRecord["status"] | undefined;
    const assignedTo = body.assignedTo ? String(body.assignedTo) : undefined;
    const nowTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const nextConversations = (db.chatConversations || []).map((c) => {
      if (c.id !== conversationId) return c;
      const msgs = replyText
        ? [
            ...c.messages,
            {
              id: `ag-${Date.now()}`,
              sender: "agent" as const,
              text: replyText,
              time: nowTime,
            },
          ]
        : c.messages;
      return {
        ...c,
        status: status || (replyText ? "Assigned" : c.status),
        assignedTo: assignedTo ?? c.assignedTo ?? session.email,
        messages: msgs,
      };
    });

    const logged = appendAuditLog(
      { ...db, chatConversations: nextConversations },
      session.email,
      "Chatbot",
      `Handled chat ${conversationId}${replyText ? " (agent replied)" : ""}`,
      session.role
    );
    writeAdminDb(logged);
    return NextResponse.json(await buildAuthenticatedAdminPayload(logged));
  } catch {
    return NextResponse.json({ error: "Failed to update conversation" }, { status: 400 });
  }
}
