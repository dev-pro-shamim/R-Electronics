import { NextRequest, NextResponse } from "next/server";
import { readAdminDb, writeAdminDb } from "@/lib/adminDb";
import { dispatchNotification, wrapRangoEmailTemplate } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const {
      orderId,
      customerName,
      customerEmail,
      phone,
      address,
      city,
      items,
      subtotal,
      shipping,
      total,
      paymentMethod,
    } = data;

    if (!orderId || (!customerEmail && !phone)) {
      return NextResponse.json(
        { error: "Missing orderId or customer contact." },
        { status: 400 }
      );
    }

    const db = readAdminDb();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rangoelectronics.com";

    const itemsHtml = (items || [])
      .map(
        (it: any) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px 8px; font-weight: 600; color: #0f172a;">${
            it.title || it.product?.title || "Product"
          }</td>
          <td style="padding: 10px 8px; text-align: center; color: #475569;">${
            it.quantity
          }</td>
          <td style="padding: 10px 8px; text-align: right; color: #475569;">৳${Number(
            it.price || it.product?.price || 0
          ).toLocaleString()}</td>
          <td style="padding: 10px 8px; text-align: right; font-weight: 700; color: #0084C7;">৳${(
            Number(it.price || it.product?.price || 0) * Number(it.quantity || 1)
          ).toLocaleString()}</td>
        </tr>
      `
      )
      .join("");

    const orderHtml = wrapRangoEmailTemplate(
      `Order Confirmation #${orderId}`,
      "NEW ORDER RECEIVED",
      `
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:16px;">
          <strong>Customer:</strong> ${customerName || "Valued Customer"}<br/>
          <strong>Phone:</strong> ${phone || "N/A"}<br/>
          ${customerEmail ? `<strong>Email:</strong> ${customerEmail}<br/>` : ""}
          <strong>Address:</strong> ${address || ""}, ${city || "Dhaka"}<br/>
          <strong>Payment Method:</strong> ${paymentMethod || "Cash On Delivery"}
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <thead>
            <tr style="background:#f1f5f9;color:#475569;">
              <th style="padding:8px;text-align:left;">Product</th>
              <th style="padding:8px;text-align:center;">Qty</th>
              <th style="padding:8px;text-align:right;">Price</th>
              <th style="padding:8px;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="text-align:right;font-size:13px;line-height:1.8;">
          <div>Subtotal: ৳${Number(subtotal || total || 0).toLocaleString()}</div>
          <div>Delivery Fee: ৳${Number(shipping || 0).toLocaleString()}</div>
          <div style="font-size:18px;font-weight:700;color:#0084C7;">Grand Total: ৳${Number(
            total || 0
          ).toLocaleString()}</div>
        </div>
        <div style="text-align:center;margin-top:20px;">
          <a href="${baseUrl}/invoice/${encodeURIComponent(
        String(orderId)
      )}" style="display:inline-block;background:#FF7A00;color:#ffffff;padding:10px 22px;text-decoration:none;border-radius:8px;font-weight:600;font-size:13px;">View Official Invoice</a>
        </div>
      `
    );

    const dispatchRes = await dispatchNotification({
      eventKey: `order-created-${orderId}`,
      eventType: "order_created",
      subject: `[New Order #${orderId}] ৳${Number(total || 0).toLocaleString()} — ${
        customerName || phone
      }`,
      html: orderHtml,
      notifyAdmin: true,
      customerEmail: customerEmail || undefined,
      customerSubject: `Order Confirmation #${orderId} — Rango Electronics`,
      customerHtml: orderHtml,
      db,
    });

    writeAdminDb(db);

    const delivered =
      dispatchRes.adminLog?.status === "sent" ||
      dispatchRes.customerLog?.status === "sent";

    return NextResponse.json({
      success: true,
      delivered,
      deduplicated: dispatchRes.deduplicated,
      orderId,
      message: delivered
        ? "Order confirmation and admin email dispatched."
        : "Order notification logged (configure SMTP or Resend credentials in Admin Settings for live delivery).",
    });
  } catch (err) {
    console.error("Order email error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Email failed." },
      { status: 500 }
    );
  }
}
