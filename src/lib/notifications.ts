import nodemailer from "nodemailer";
import { readAdminDb, writeAdminDb } from "@/lib/adminDb";
import { readServerSecrets } from "@/lib/serverSecrets";
import { EmailDeliveryLog, AdminDatabase } from "@/types/admin";

export const DEFAULT_ADMIN_NOTIFICATION_EMAIL = "electronics.rango@gmail.com";

export type NotificationEventType =
  | "order_new"
  | "order_created"
  | "order_confirmed"
  | "order_processing"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled"
  | "order_returned"
  | "order_status_updated"
  | "payment_received"
  | "payment_confirmed"
  | "payment_verified"
  | "payment_failed"
  | "payment_refunded"
  | "payment_manual_verification"
  | "customer_registered"
  | "customer_review_submitted"
  | "review_submitted"
  | "customer_question_submitted"
  | "question_submitted"
  | "customer_contact_inquiry"
  | "inquiry_received"
  | "inventory_low_stock"
  | "low_stock_alert"
  | "inventory_out_of_stock"
  | "out_of_stock_alert"
  | "system_error"
  | "courier_integration_error"
  | "payment_webhook_error"
  | "invoice_dispatched"
  | "invoice_generated"
  | "test_email"
  | "system_test";

export interface DispatchNotificationParams {
  eventKey: string;
  eventType: NotificationEventType;
  subject: string;
  html: string;
  customerEmail?: string;
  customerSubject?: string;
  customerHtml?: string;
  notifyAdmin?: boolean;
  db?: AdminDatabase;
}

function resolveMailerConfig() {
  const db = readAdminDb();
  const secrets = readServerSecrets();
  const smtpCfg = db.settings?.smtpSettings;

  const adminEmail =
    smtpCfg?.adminNotificationEmail ||
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    DEFAULT_ADMIN_NOTIFICATION_EMAIL;

  const provider =
    smtpCfg?.provider || (process.env.RESEND_API_KEY || secrets.resendApiKey ? "resend" : "smtp");

  const host = smtpCfg?.host || process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(smtpCfg?.port || process.env.SMTP_PORT || 465);
  const user =
    smtpCfg?.username || process.env.SMTP_USER || DEFAULT_ADMIN_NOTIFICATION_EMAIL;
  const pass =
    secrets.smtpPassword || process.env.SMTP_PASS || process.env.EMAIL_APP_PASSWORD || "";
  const resendKey = secrets.resendApiKey || process.env.RESEND_API_KEY || "";
  const senderName = smtpCfg?.senderName || "Rango Electronics";
  const senderEmail = smtpCfg?.senderEmail || user || DEFAULT_ADMIN_NOTIFICATION_EMAIL;

  return {
    alertsEnabled: db.settings?.emailAlertsEnabled !== false,
    adminEmail,
    provider,
    host,
    port,
    user,
    pass,
    resendKey,
    senderName,
    senderEmail,
  };
}

async function sendViaTransport(
  to: string,
  subject: string,
  html: string,
  cfg: ReturnType<typeof resolveMailerConfig>
): Promise<{ status: "sent" | "failed" | "skipped"; attempts: number; provider: string; error?: string }> {
  if (cfg.provider === "resend" && cfg.resendKey) {
    let attempts = 0;
    let lastError = "";
    while (attempts < 3) {
      attempts++;
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cfg.resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${cfg.senderName} <${cfg.senderEmail}>`,
            to: [to],
            subject,
            html,
          }),
        });
        if (res.ok) {
          return { status: "sent", attempts, provider: "resend" };
        }
        const errBody = await res.text();
        lastError = `Resend HTTP ${res.status}: ${errBody.slice(0, 180)}`;
      } catch (err: any) {
        lastError = err?.message || "Resend request failed";
      }
    }
    return { status: "failed", attempts, provider: "resend", error: lastError };
  }

  if (!cfg.pass) {
    return {
      status: "skipped",
      attempts: 1,
      provider: "smtp",
      error: "SMTP password / EMAIL_APP_PASSWORD not configured yet.",
    };
  }

  let attempts = 0;
  let lastError = "";
  while (attempts < 3) {
    attempts++;
    try {
      const transporter = nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.port === 465,
        auth: { user: cfg.user, pass: cfg.pass },
      });
      await transporter.sendMail({
        from: `"${cfg.senderName}" <${cfg.senderEmail}>`,
        to,
        subject,
        html,
      });
      return { status: "sent", attempts, provider: "smtp" };
    } catch (err: any) {
      lastError = err?.message || "SMTP sendMail failed";
    }
  }
  return { status: "failed", attempts, provider: "smtp", error: lastError };
}

export function wrapRangoEmailTemplate(title: string, badge: string, bodyHtml: string) {
  return `
    <div style="font-family:'Poppins',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;padding:24px;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:linear-gradient(135deg,#0084C7,#006DA6);padding:20px 24px;color:#ffffff;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;opacity:0.9;">Rango Electronics • Customer Notification</div>
          <h1 style="margin:6px 0 0;font-size:20px;font-weight:800;">${title}</h1>
          <span style="display:inline-block;margin-top:8px;padding:3px 10px;border-radius:999px;background:rgba(255,255,255,0.2);font-size:11px;font-weight:700;">${badge}</span>
        </div>
        <div style="padding:24px;color:#334155;font-size:13px;line-height:1.6;">
          ${bodyHtml}
        </div>
        <div style="padding:14px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;">
          Rango Electronics · https://rango-electronics.vercel.app · Hotline: +88 01798-565001
        </div>
      </div>
    </div>
  `;
}

export function buildDeliveryReviewEmail(order: any, origin = "https://rango-electronics.vercel.app") {
  const customerName = order.shippingAddress?.fullName || "সম্মানিত গ্রাহক";
  const items = Array.isArray(order.items) ? order.items : [];

  const itemsHtml = items
    .map((it: any) => {
      const title = it.title || it.product?.title || "Electronics Product";
      const price = Number(it.price || it.unitPrice || it.product?.price || 0);
      const qty = Number(it.quantity || 1);
      const img =
        it.thumbnail ||
        it.image ||
        it.product?.thumbnail ||
        it.product?.image ||
        `${origin}/logo.png`;

      // Resolve slug for review URL
      const slug = it.product?.slug || it.slug || (it.id ? String(it.id).toLowerCase() : "");
      const reviewUrl = slug
        ? `${origin}/product/${slug}#reviews`
        : `${origin}/#reviews`;

      return `
        <div style="display:flex;align-items:center;padding:12px;margin-bottom:12px;border:1px solid #e2e8f0;border-radius:10px;background:#ffffff;">
          <img src="${img}" alt="${title}" style="width:70px;height:70px;object-fit:cover;border-radius:8px;border:1px solid #f1f5f9;margin-right:14px;background:#f8fafc;" />
          <div style="flex:1;min-width:0;">
            <h4 style="margin:0 0 4px;font-size:14px;font-weight:600;color:#0f172a;line-height:1.4;">${title}</h4>
            <p style="margin:0 0 8px;font-size:12px;color:#64748b;">পরিমাণ: ${qty} টি · মূল্য: ৳${price.toLocaleString()}</p>
            <a href="${reviewUrl}" style="display:inline-block;padding:6px 14px;background:linear-gradient(135deg,#0084C7,#006DA6);color:#ffffff;text-decoration:none;font-size:12px;font-weight:600;border-radius:6px;">⭐ রিভিউ লিখুন / Write Review</a>
          </div>
        </div>
      `;
    })
    .join("");

  const bodyHtml = `
    <div style="text-align:center;padding:10px 0 20px;">
      <div style="display:inline-block;padding:8px 16px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:50px;color:#047857;font-weight:700;font-size:13px;margin-bottom:12px;">
        🎉 ডেলিভারি সফলভাবে সম্পন্ন হয়েছে
      </div>
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#0f172a;">প্রিয় ${customerName}, আপনার পার্সেল ডেলিভারি সম্পন্ন হয়েছে!</h2>
      <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;">
        আপনার অর্ডার <strong>#${order.id}</strong> সফলভাবে পৌঁছে দেওয়া হয়েছে। রঙ্গ ইলেকট্রনিক্স-এ আস্থা রাখার জন্য আপনাকে আন্তরিক ধন্যবাদ।
      </p>
    </div>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px;margin-bottom:20px;font-size:12px;line-height:1.7;color:#334155;">
      <div style="display:flex;justify-content:space-between;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-bottom:6px;">
        <span><strong>অর্ডার নং:</strong> #${order.id}</span>
        <span><strong>মোট পরিশোধিত:</strong> ৳${Number(order.total || 0).toLocaleString()}</span>
      </div>
      <div><strong>ডেলিভারি ঠিকানা:</strong> ${order.shippingAddress?.address || "N/A"}, ${order.shippingAddress?.city || ""}</div>
      ${order.courier ? `<div><strong>কুরিয়ার:</strong> ${order.courier} ${order.trackingNo ? `(ট্র্যাকিং: ${order.trackingNo})` : ""}</div>` : ""}
    </div>

    <div style="margin-bottom:20px;">
      <h3 style="margin:0 0 10px;font-size:15px;font-weight:700;color:#0f172a;">
        ⭐ আপনার মূল্যবান মতামত (Review) আমাদের জানান
      </h3>
      <p style="margin:0 0 14px;font-size:12px;color:#64748b;line-height:1.5;">
        পণ্যটি আপনার কেমন লেগেছে? আপনার একটি ছোট রিভিউ অন্যান্য ক্রেতাদের সঠিক পণ্য বাছাই করতে এবং আমাদের সেবার মান উন্নত করতে অত্যন্ত সহায়তা করবে। অনুগ্রহ করে নিচের পণ্যে ক্লিক করে রিভিউ দিন:
      </p>
      ${itemsHtml}
    </div>

    <div style="background:#f1f5f9;border-radius:10px;padding:14px 18px;text-align:center;font-size:12px;color:#475569;margin-top:20px;">
      <p style="margin:0 0 4px;font-weight:700;color:#0f172a;">যেকোনো সহযোগিতা বা অফিসিয়াল ওয়ারেন্টির জন্য যোগাযোগ করুন:</p>
      <p style="margin:0;">হটলাইন: <strong>+88 01798-565001</strong> · ইমেইল: <strong>electronics.rango@gmail.com</strong></p>
    </div>
  `;

  return wrapRangoEmailTemplate(
    `Order #${order.id} Delivered`,
    "DELIVERED • ডেলিভারি সম্পন্ন",
    bodyHtml
  );
}

/**
 * Dispatch server-side notifications to Admin (electronics.rango@gmail.com) and/or Customer.
 * Strictly deduplicates by eventKey + audience + recipient.
 */
export async function dispatchNotification(params: DispatchNotificationParams): Promise<{
  adminResult?: { status: string; error?: string };
  customerResult?: { status: string; error?: string };
  adminLog?: { status: string; error?: string };
  customerLog?: { status: string; error?: string };
  deduplicated?: boolean;
}> {
  const cfg = resolveMailerConfig();
  const db = params.db || readAdminDb();
  const existingLogs = db.emailLogs || [];

  const shouldNotifyAdmin = params.notifyAdmin !== false && cfg.alertsEnabled;
  const targets: { audience: "admin" | "customer"; to: string; subject: string; html: string }[] = [];

  if (shouldNotifyAdmin) {
    targets.push({
      audience: "admin",
      to: cfg.adminEmail,
      subject: params.subject,
      html: params.html,
    });
  }

  if (params.customerEmail && params.customerEmail.includes("@") && params.customerEmail !== "N/A") {
    targets.push({
      audience: "customer",
      to: params.customerEmail,
      subject: params.customerSubject || params.subject,
      html: params.customerHtml || params.html,
    });
  }

  const newLogs: EmailDeliveryLog[] = [];
  let adminResult: { status: string; error?: string } | undefined;
  let customerResult: { status: string; error?: string } | undefined;

  for (const target of targets) {
    const dedupeHit =
      params.eventType !== "test_email" &&
      existingLogs.some(
        (l) =>
          l.eventKey === params.eventKey &&
          l.audience === target.audience &&
          l.recipient.toLowerCase() === target.to.toLowerCase() &&
          (l.status === "sent" || l.status === "skipped")
      );

    if (dedupeHit) {
      if (target.audience === "admin") adminResult = { status: "deduplicated" };
      else customerResult = { status: "deduplicated" };
      continue;
    }

    const res = await sendViaTransport(target.to, target.subject, target.html, cfg);
    const logEntry: EmailDeliveryLog = {
      id: `eml-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      eventKey: params.eventKey,
      eventType: params.eventType,
      recipient: target.to,
      audience: target.audience,
      subject: target.subject,
      status: res.status,
      attempts: res.attempts,
      provider: res.provider,
      error: res.error,
      createdAt: new Date().toISOString(),
    };
    newLogs.push(logEntry);

    if (target.audience === "admin") adminResult = { status: res.status, error: res.error };
    else customerResult = { status: res.status, error: res.error };
  }

  if (newLogs.length > 0) {
    if (params.db) {
      params.db.emailLogs = [...newLogs, ...(params.db.emailLogs || [])].slice(0, 400);
    } else {
      const latestDb = readAdminDb();
      writeAdminDb({
        ...latestDb,
        emailLogs: [...newLogs, ...(latestDb.emailLogs || [])].slice(0, 400),
      });
    }
  }

  return {
    adminResult,
    customerResult,
    adminLog: adminResult,
    customerLog: customerResult,
  };
}
