import { NextRequest, NextResponse } from "next/server";
import { readAdminDb, readAdminDbCached, writeAdminDb } from "@/lib/adminDb";
import { getMergedCatalogProducts } from "@/lib/adminServerHelpers";
import { dispatchNotification, wrapRangoEmailTemplate } from "@/lib/notifications";
import { ProductQuestionRecord } from "@/types/admin";

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId") || "";
  const db = readAdminDbCached();
  const approved = (db.productQuestions || []).filter(
    (q) =>
      (q.status === "Approved" || q.status === "Answered") &&
      !q.isTestData &&
      (!productId || q.productId === productId)
  );
  return NextResponse.json({ questions: approved });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const productId = String(body.productId || "").trim();
    const userName = String(body.userName || "").trim();
    const userEmail = body.userEmail ? String(body.userEmail).trim() : undefined;
    const question = String(body.question || "").trim();

    if (!productId || !userName || question.length < 4) {
      return NextResponse.json(
        { error: "Product ID, name, and question are required." },
        { status: 400 }
      );
    }

    const db = readAdminDb();
    const product = getMergedCatalogProducts(db).find((p) => p.id === productId);
    const productTitle = product?.title || String(body.productTitle || productId);

    const record: ProductQuestionRecord = {
      id: `qa-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId,
      productTitle,
      customerName: userName,
      userName,
      customerEmail: userEmail,
      question,
      status: "Pending",
      isTestData: false,
      createdAt: new Date().toISOString(),
    };

    const nextDb = {
      ...db,
      productQuestions: [record, ...(db.productQuestions || [])],
    };

    await dispatchNotification({
      eventKey: `qa-submit-${record.id}`,
      eventType: "question_submitted",
      subject: `[Product Q&A] Question on ${productTitle}`,
      html: wrapRangoEmailTemplate(
        "New Product Question Pending Answer",
        "PRODUCT Q&A",
        `<p><strong>Product:</strong> ${productTitle}<br/>
        <strong>Asked by:</strong> ${userName}${userEmail ? ` (${userEmail})` : ""}</p>
        <blockquote style="background:#f8fafc;border-left:3px solid #FF7A00;padding:12px;margin:12px 0;">${question}</blockquote>
        <p style="font-size:12px;color:#64748b;">Approve and reply inside Admin Dashboard &rarr; Product Q&amp;A.</p>`
      ),
      db: nextDb,
    });

    writeAdminDb(nextDb);

    return NextResponse.json({
      success: true,
      questionId: record.id,
      status: "Pending",
      message: "Question submitted for moderation and will be published once answered & approved.",
    });
  } catch (err) {
    console.error("Question POST error:", err);
    return NextResponse.json({ error: "Failed to submit question." }, { status: 400 });
  }
}
