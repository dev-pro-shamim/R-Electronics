import { NextRequest, NextResponse } from "next/server";
import { readAdminDb, readAdminDbCached, syncReviewToSupabase, writeAdminDb } from "@/lib/adminDb";
import { getMergedCatalogProducts } from "@/lib/adminServerHelpers";
import { dispatchNotification, wrapRangoEmailTemplate } from "@/lib/notifications";
import { ProductReviewRecord } from "@/types/admin";

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId") || "";
  const userEmail = (req.nextUrl.searchParams.get("userEmail") || "").trim().toLowerCase();
  const userName = (req.nextUrl.searchParams.get("userName") || "").trim().toLowerCase();
  const db = readAdminDbCached();

  if (userEmail || userName) {
    const mine = (db.reviews || [])
      .filter((r) => {
        if (r.isTestData || String(r.id || "").startsWith("rev-seed-")) return false;
        const rEmail = (r.customerEmail || r.userEmail || "").trim().toLowerCase();
        const rName = (r.customerName || r.userName || "").trim().toLowerCase();
        if (userEmail && rEmail && rEmail === userEmail) return true;
        if (userName && rName && rName === userName) return true;
        return false;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    return NextResponse.json({
      reviews: mine,
      totalReviews: mine.length,
    });
  }

  const approved = (db.reviews || [])
    .filter(
      (r) =>
        r.status === "Approved" &&
        !r.isTestData &&
        (!productId || r.productId === productId)
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  const avgRating =
    approved.length > 0
      ? Number(
          (
            approved.reduce((sum, r) => sum + Number(r.rating || 5), 0) /
            approved.length
          ).toFixed(1)
        )
      : 0;

  return NextResponse.json({
    reviews: approved,
    totalReviews: approved.length,
    averageRating: avgRating,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const productId = String(body.productId || "").trim();
    const userName = String(body.userName || "").trim();
    const userEmail = body.userEmail ? String(body.userEmail).trim() : undefined;
    const rating = Math.min(5, Math.max(1, Math.round(Number(body.rating || 5))));
    const title = body.title ? String(body.title).trim().slice(0, 120) : undefined;
    const comment = String(body.comment || "").trim();
    const images = Array.isArray(body.images)
      ? body.images.map((x: unknown) => String(x)).filter(Boolean).slice(0, 5)
      : [];

    if (!productId || !userName || comment.length < 3) {
      return NextResponse.json(
        { error: "Product ID, reviewer name, and review comment are required." },
        { status: 400 }
      );
    }

    const db = readAdminDb();
    const product = getMergedCatalogProducts(db).find((p) => p.id === productId);
    const productTitle = product?.title || String(body.productTitle || productId);

    const review: ProductReviewRecord = {
      id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId,
      productTitle,
      customerName: userName,
      userName,
      customerEmail: userEmail,
      userEmail,
      customerLocation: String(body.userLocation || "Bangladesh"),
      rating,
      title,
      comment,
      images,
      status: "Pending",
      verifiedPurchase: Boolean(body.verifiedPurchase),
      isTestData: false,
      createdAt: new Date().toISOString(),
    };

    const nextDb = {
      ...db,
      reviews: [review, ...(db.reviews || [])],
    };

    await syncReviewToSupabase({
      ...review,
      userName: review.userName || review.customerName || "Customer",
    });

    await dispatchNotification({
      eventKey: `review-submit-${review.id}`,
      eventType: "review_submitted",
      subject: `[Review Moderation] ${rating}★ on ${productTitle}`,
      html: wrapRangoEmailTemplate(
        "New Product Review Pending Approval",
        "REVIEW SUBMITTED",
        `<p><strong>Product:</strong> ${productTitle}<br/>
        <strong>Customer:</strong> ${userName}${userEmail ? ` (${userEmail})` : ""}<br/>
        <strong>Rating:</strong> ${rating} / 5</p>
        ${title ? `<p><strong>Title:</strong> ${title}</p>` : ""}
        <blockquote style="background:#f8fafc;border-left:3px solid #0084C7;padding:12px;margin:12px 0;">${comment}</blockquote>
        <p style="font-size:12px;color:#64748b;">This review is held in Pending moderation and will not appear publicly until approved in Admin Dashboard.</p>`
      ),
      db: nextDb,
    });

    writeAdminDb(nextDb);

    return NextResponse.json({
      success: true,
      reviewId: review.id,
      status: "Pending",
      message: "Review submitted for moderation and will appear after admin approval.",
    });
  } catch (err) {
    console.error("Review POST error:", err);
    return NextResponse.json({ error: "Failed to submit review." }, { status: 400 });
  }
}
