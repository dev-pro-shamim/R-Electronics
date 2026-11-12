import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { readAdminDb } from "@/lib/adminDb";

function sha256Lower(val?: string) {
  if (!val) return undefined;
  return crypto.createHash("sha256").update(val.trim().toLowerCase()).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventName = String(body.eventName || "PageView");
    const eventId = String(body.eventId || `evt-${Date.now()}`);
    const eventSourceUrl = String(body.eventSourceUrl || "");
    const value = body.value !== undefined ? Number(body.value) : undefined;
    const currency = String(body.currency || "BDT");
    const userData = body.userData || {};

    const db = readAdminDb();
    const tracking = db.trackingSettings;

    if (!tracking?.metaCapiEnabled || !tracking?.metaPixelId) {
      return NextResponse.json({ forwarded: false, reason: "CAPI disabled or Pixel ID missing" });
    }

    const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({
        forwarded: false,
        dedupEventId: eventId,
        reason: "META_CAPI_ACCESS_TOKEN not configured in .env.local",
      });
    }

    const payload: Record<string, unknown> = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: "website",
          event_source_url: eventSourceUrl,
          user_data: {
            em: userData.email ? [sha256Lower(userData.email)] : undefined,
            ph: userData.phone ? [sha256Lower(userData.phone)] : undefined,
            client_ip_address: req.headers.get("x-forwarded-for") || undefined,
            client_user_agent: req.headers.get("user-agent") || undefined,
          },
          custom_data:
            value !== undefined
              ? {
                  currency,
                  value,
                  content_ids: body.contentIds || undefined,
                  order_id: body.orderId || undefined,
                }
              : undefined,
        },
      ],
    };

    if (tracking.metaTestEventCode) {
      payload.test_event_code = tracking.metaTestEventCode;
    }

    const res = await fetch(
      `https://graph.facebook.com/v20.0/${encodeURIComponent(
        tracking.metaPixelId
      )}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();
    return NextResponse.json({ forwarded: res.ok, dedupEventId: eventId, result: data });
  } catch {
    return NextResponse.json({ forwarded: false }, { status: 200 });
  }
}
