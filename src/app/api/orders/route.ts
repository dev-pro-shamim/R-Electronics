import { NextRequest, NextResponse } from "next/server";
import { prependCachedOrder, readAdminDb, writeAdminDb } from "@/lib/adminDb";
import { dispatchNotification, wrapRangoEmailTemplate } from "@/lib/notifications";
import {
  validateBangladeshPhone,
  validateCustomerName,
  validateDeliveryAddress,
} from "@/lib/orderValidation";
import { supabase } from "@/lib/supabase";
import type { AdminOrderRecord, PaymentStatusType } from "@/types/admin";

// In-memory rate limiter for anti-bot / anti-spam order protection
const orderRateMap = new Map<string, number[]>();
const recentOrderFingerprints = new Map<string, number>();

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const stamps = (orderRateMap.get(key) || []).filter((t) => now - t < windowMs);
  if (stamps.length >= maxRequests) return false;
  stamps.push(now);
  orderRateMap.set(key, stamps);
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Bot / Honeypot & Minimum Human Fill Time checks
    if (String(body.website || body.company_url || "").trim().length > 0) {
      return NextResponse.json(
        { error: "Automated bot submission rejected." },
        { status: 400 }
      );
    }
    const formStartedAt = Number(body.formStartedAt || 0);
    if (formStartedAt > 0 && Date.now() - formStartedAt < 1200) {
      return NextResponse.json(
        { error: "Order submitted too quickly. Please review your details and try again." },
        { status: 400 }
      );
    }

    const orderId =
      String(body.id || body.orderId || "").trim() ||
      `RE-${Math.floor(100000 + Math.random() * 900000)}`;
    const customerName = String(
      body.shippingAddress?.fullName || body.customerName || ""
    ).trim();
    const rawPhone = String(
      body.shippingAddress?.phone || body.shippingAddress?.phoneNumber || body.phone || ""
    ).trim();
    const email = String(body.shippingAddress?.email || body.email || "").trim();
    const city = String(body.shippingAddress?.city || body.city || "Dhaka").trim();
    const address = String(body.shippingAddress?.address || body.address || "").trim();
    const items = Array.isArray(body.items) ? body.items : [];

    // 2. Strict Bangladesh 11-digit mobile & real customer validation
    const phoneCheck = validateBangladeshPhone(rawPhone);
    if (!phoneCheck.valid) {
      return NextResponse.json(
        { error: phoneCheck.error || "Valid 11-digit Bangladesh mobile number is required." },
        { status: 400 }
      );
    }
    const phone = phoneCheck.normalized;

    if (!validateCustomerName(customerName)) {
      return NextResponse.json(
        { error: "Please enter a valid customer full name." },
        { status: 400 }
      );
    }
    if (!validateDeliveryAddress(address)) {
      return NextResponse.json(
        { error: "Please enter a complete delivery address (minimum 6 characters)." },
        { status: 400 }
      );
    }
    if (items.length === 0) {
      return NextResponse.json(
        { error: "At least one product item is required to place an order." },
        { status: 400 }
      );
    }

    // Validate sender mobile if bKash or Nagad phone provided
    if (body.bkashPhone) {
      const bkCheck = validateBangladeshPhone(String(body.bkashPhone));
      if (!bkCheck.valid) {
        return NextResponse.json(
          { error: "bKash sender number must be a valid 11-digit Bangladesh mobile number." },
          { status: 400 }
        );
      }
    }
    if (body.nagadPhone) {
      const ngCheck = validateBangladeshPhone(String(body.nagadPhone));
      if (!ngCheck.valid) {
        return NextResponse.json(
          { error: "Nagad sender number must be a valid 11-digit Bangladesh mobile number." },
          { status: 400 }
        );
      }
    }

    // 3. Per-IP & Per-Phone rate limiting + duplicate rapid-submit protection
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "local";
    if (!checkRateLimit(`ip:${clientIp}`, 6, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many order attempts from this network. Please wait a few minutes." },
        { status: 429 }
      );
    }
    if (!checkRateLimit(`phone:${phone}`, 4, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many orders placed for this mobile number recently. Please call +88 01798-565001 for assistance." },
        { status: 429 }
      );
    }

    const subtotal = Number(body.subtotal || 0);
    const discount = Number(body.discount || 0);
    const shipping = Number(body.shipping || 0);
    const total = Number(body.total || Math.max(0, subtotal - discount + shipping));
    const fingerprint = `${phone}:${total}:${items.map((i: any) => i.id || i.title).join(",")}`;
    const lastSame = recentOrderFingerprints.get(fingerprint);
    if (lastSame && Date.now() - lastSame < 45000) {
      return NextResponse.json(
        { error: "Duplicate order detected. Your previous order was already received." },
        { status: 429 }
      );
    }
    recentOrderFingerprints.set(fingerprint, Date.now());
    const paymentMethod = String(body.paymentMethod || "Cash On Delivery");
    const allowedPaymentStatuses: PaymentStatusType[] = [
      "Paid",
      "Unpaid",
      "Partial Payment",
      "Pending Verification",
      "Failed",
      "Refunded",
    ];
    const requestedPayStatus = String(body.paymentStatus || "").trim() as PaymentStatusType;
    const paymentStatus: PaymentStatusType = allowedPaymentStatuses.includes(
      requestedPayStatus
    )
      ? requestedPayStatus
      : body.bkashTrxId || body.nagadTrxId
      ? "Pending Verification"
      : "Unpaid";
    const nowIso = new Date().toISOString();
    const dateLabel = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const newOrder: AdminOrderRecord = {
      id: orderId,
      date: dateLabel,
      createdAtIso: nowIso,
      status: String(body.status || "Processing"),
      paymentMethod,
      paymentStatus,
      subtotal,
      discount,
      shipping,
      total,
      sourceChannel: String(body.sourceChannel || "Landing Page"),
      adminNote: body.adminNote ? String(body.adminNote) : undefined,
      bkashPhone: body.bkashPhone ? String(body.bkashPhone) : undefined,
      bkashTrxId: body.bkashTrxId ? String(body.bkashTrxId) : undefined,
      nagadPhone: body.nagadPhone ? String(body.nagadPhone) : undefined,
      nagadTrxId: body.nagadTrxId ? String(body.nagadTrxId) : undefined,
      shippingAddress: {
        fullName: customerName,
        phone,
        phoneNumber: phone,
        email: email || undefined,
        city,
        address,
      },
      items,
      source: "local",
    };

    const db = readAdminDb();
    db.orderOverrides = db.orderOverrides || {};
    db.orderOverrides[orderId] = newOrder;
    writeAdminDb(db);
    prependCachedOrder(newOrder);

    // Non-blocking Supabase order insert
    void (async () => {
      try {
        await supabase.from("orders").upsert(
          {
            id: orderId,
            customer_name: customerName,
            phone,
            email: email || null,
            city,
            address,
            subtotal,
            shipping,
            discount,
            total,
            payment_method: paymentMethod,
            bkash_phone: newOrder.bkashPhone || null,
            bkash_trx_id: newOrder.bkashTrxId || null,
            nagad_phone: newOrder.nagadPhone || null,
            nagad_trx_id: newOrder.nagadTrxId || null,
            status: newOrder.status,
            items: items.map((it: any) => ({
              id: it.id || it.product?.id,
              title: it.title || it.product?.title || "Product",
              price: Number(it.price || it.product?.price || 0),
              quantity: Number(it.quantity || 1),
              thumbnail:
                it.thumbnail || it.image || it.product?.thumbnail || "/logo.png",
            })),
          },
          { onConflict: "id" }
        );
      } catch {
        // Fallback already persisted in local store
      }
    })();

    // Non-blocking order email notification
    void (async () => {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_SITE_URL || "https://rangoelectronics.com";
        const itemsHtml = items
          .map(
            (it: any) =>
              `<tr><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${
                it.title || it.product?.title || "Product"
              }</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center;">${
                it.quantity || 1
              }</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">৳${Number(
                it.price || it.product?.price || 0
              ).toLocaleString()}</td></tr>`
          )
          .join("");
        const html = wrapRangoEmailTemplate(
          `Order Confirmation #${orderId}`,
          "NEW ORDER RECEIVED",
          `<p><strong>Customer:</strong> ${customerName} (${phone})</p><p><strong>Address:</strong> ${address}, ${city}</p><p><strong>Payment:</strong> ${paymentMethod}</p><table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="background:#f1f5f9;"><th style="padding:6px 8px;text-align:left;">Product</th><th style="padding:6px 8px;text-align:center;">Qty</th><th style="padding:6px 8px;text-align:right;">Price</th></tr></thead><tbody>${itemsHtml}</tbody></table><p style="font-size:16px;font-weight:700;color:#0084C7;text-align:right;">Grand Total: ৳${total.toLocaleString()}</p><div style="text-align:center;margin-top:14px;"><a href="${baseUrl}/invoice/${encodeURIComponent(
            orderId
          )}" style="display:inline-block;background:#FF7A00;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700;">View Invoice</a></div>`
        );
        await dispatchNotification({
          eventKey: `order-created-${orderId}`,
          eventType: "order_created",
          subject: `[New Order #${orderId}] ৳${total.toLocaleString()} — ${customerName}`,
          html,
          notifyAdmin: true,
          customerEmail: email || undefined,
          customerSubject: `Order Confirmation #${orderId} — Rango Electronics`,
          customerHtml: html,
          db: readAdminDb(),
        });
      } catch {
        // Ignore email delivery failures during instant checkout
      }
    })();

    return NextResponse.json({ success: true, order: newOrder });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create order." },
      { status: 400 }
    );
  }
}
