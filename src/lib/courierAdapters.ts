import {
  AdminCourierBooking,
  AdminCourierProvider,
  AdminOrderRecord,
} from "@/types/admin";
import { CourierProviderSecrets } from "@/lib/serverSecrets";

export interface CourierTestResult {
  ok: boolean;
  providerId: string;
  testedAt: string;
  mode: "live" | "sandbox";
  statusCode?: number;
  message: string;
  rawResponse?: unknown;
}

export interface CourierCreateResult {
  ok: boolean;
  consignmentId: string;
  trackingId: string;
  trackingUrl?: string;
  notice: string;
  error?: string;
  rawResponse?: unknown;
}

export interface CourierTrackingResult {
  ok: boolean;
  status: string;
  message: string;
  rawResponse?: unknown;
}

function normalizeBaseUrl(url: string | undefined, fallback: string): string {
  const clean = (url || fallback).trim().replace(/\/+$/, "");
  return clean || fallback;
}

function formatCustomTrackingUrl(
  pattern: string | undefined,
  trackingId: string,
  consignmentId: string
): string | undefined {
  if (!pattern) return undefined;
  return pattern
    .replace(/\{tracking_id\}/gi, encodeURIComponent(trackingId))
    .replace(/\{consignment_id\}/gi, encodeURIComponent(consignmentId));
}

async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = 8000
): Promise<{ status: number; ok: boolean; data: unknown }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const text = await res.text();
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      // non-JSON response preserved as text snippet
      parsed = text.slice(0, 500);
    }
    return { status: res.status, ok: res.ok, data: parsed };
  } finally {
    clearTimeout(timer);
  }
}

export async function testCourierConnection(
  provider: AdminCourierProvider,
  secrets: CourierProviderSecrets
): Promise<CourierTestResult> {
  const testedAt = new Date().toISOString();

  if (provider.id === "rango_express") {
    return {
      ok: true,
      providerId: provider.id,
      testedAt,
      mode: "live",
      statusCode: 200,
      message: "Rango Express internal fleet dispatch is active and operational.",
    };
  }

  try {
    if (provider.id === "steadfast") {
      const apiKey = secrets.apiKey || process.env.STEADFAST_API_KEY || "";
      const secretKey = secrets.secretKey || process.env.STEADFAST_SECRET_KEY || "";
      if (!apiKey || !secretKey) {
        return {
          ok: false,
          providerId: provider.id,
          testedAt,
          mode: provider.sandboxMode ? "sandbox" : "live",
          message: "Missing Steadfast Api-Key or Secret-Key. Enter both keys to verify live connection.",
        };
      }
      const base = normalizeBaseUrl(provider.baseUrl, "https://portal.packzy.com/api/v1");
      const res = await fetchJsonWithTimeout(`${base}/get_balance`, {
        method: "GET",
        headers: {
          "Api-Key": apiKey,
          "Secret-Key": secretKey,
          "Content-Type": "application/json",
        },
      });
      return {
        ok: res.ok,
        providerId: provider.id,
        testedAt,
        mode: provider.sandboxMode ? "sandbox" : "live",
        statusCode: res.status,
        message: res.ok
          ? "Steadfast Courier credentials verified successfully."
          : `Steadfast API returned HTTP ${res.status}. Check Api-Key / Secret-Key.`,
        rawResponse: res.data,
      };
    }

    if (provider.id === "pathao") {
      const clientId = secrets.clientId || process.env.PATHAO_CLIENT_ID || "";
      const clientSecret = secrets.clientSecret || process.env.PATHAO_CLIENT_SECRET || "";
      const username = secrets.username || process.env.PATHAO_USERNAME || "";
      const password = secrets.password || process.env.PATHAO_PASSWORD || "";
      if (!clientId || !clientSecret || !username || !password) {
        return {
          ok: false,
          providerId: provider.id,
          testedAt,
          mode: provider.sandboxMode ? "sandbox" : "live",
          message: "Missing Pathao Client ID, Client Secret, Username, or Password.",
        };
      }
      const base = normalizeBaseUrl(
        provider.baseUrl,
        provider.sandboxMode
          ? "https://courier-api-sandbox.pathao.com"
          : "https://api-hermes.pathao.com"
      );
      const res = await fetchJsonWithTimeout(`${base}/aladdin/api/v1/issue-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          username,
          password,
          grant_type: "password",
        }),
      });
      const tokenOk = res.ok && Boolean((res.data as { access_token?: string })?.access_token);
      return {
        ok: tokenOk,
        providerId: provider.id,
        testedAt,
        mode: provider.sandboxMode ? "sandbox" : "live",
        statusCode: res.status,
        message: tokenOk
          ? "Pathao OAuth token issued successfully."
          : `Pathao authentication failed (HTTP ${res.status}).`,
        rawResponse: tokenOk ? { token_issued: true } : res.data,
      };
    }

    if (provider.id === "redx") {
      const token = secrets.apiToken || secrets.apiKey || process.env.REDX_API_TOKEN || "";
      if (!token) {
        return {
          ok: false,
          providerId: provider.id,
          testedAt,
          mode: provider.sandboxMode ? "sandbox" : "live",
          message: "Missing RedX API Access Token.",
        };
      }
      const base = normalizeBaseUrl(provider.baseUrl, "https://openapi.redx.com.bd/v1.0.0-beta");
      const res = await fetchJsonWithTimeout(`${base}/areas`, {
        method: "GET",
        headers: {
          "API-ACCESS-TOKEN": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return {
        ok: res.ok,
        providerId: provider.id,
        testedAt,
        mode: provider.sandboxMode ? "sandbox" : "live",
        statusCode: res.status,
        message: res.ok
          ? "RedX Logistics API token verified successfully."
          : `RedX API returned HTTP ${res.status}. Verify access token.`,
        rawResponse: res.data,
      };
    }

    if (provider.id === "paperfly") {
      const username = secrets.username || "";
      const password = secrets.password || "";
      const apiKey = secrets.apiKey || process.env.PAPERFLY_API_KEY || "";
      if (!apiKey && (!username || !password)) {
        return {
          ok: false,
          providerId: provider.id,
          testedAt,
          mode: provider.sandboxMode ? "sandbox" : "live",
          message: "Missing Paperfly API Key or Merchant Username/Password.",
        };
      }
      const base = normalizeBaseUrl(provider.baseUrl, "https://api.paperfly.com.bd");
      const basicAuth =
        username && password
          ? `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`
          : "";
      const res = await fetchJsonWithTimeout(`${base}/merchant/api/service/new_order.php`, {
        method: "OPTIONS",
        headers: {
          ...(basicAuth ? { Authorization: basicAuth } : {}),
          ...(apiKey ? { "Paperflykey": apiKey } : {}),
        },
      });
      return {
        ok: res.status < 500 && res.status !== 401 && res.status !== 403,
        providerId: provider.id,
        testedAt,
        mode: provider.sandboxMode ? "sandbox" : "live",
        statusCode: res.status,
        message:
          res.status === 401 || res.status === 403
            ? "Paperfly rejected credentials (HTTP 401/403)."
            : `Paperfly endpoint reachable (HTTP ${res.status}).`,
        rawResponse: res.data,
      };
    }

    // custom courier adapter
    const base = normalizeBaseUrl(provider.baseUrl, "");
    if (!base) {
      return {
        ok: false,
        providerId: provider.id,
        testedAt,
        mode: provider.sandboxMode ? "sandbox" : "live",
        message: "Custom Courier API Base URL is required.",
      };
    }
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const headerName = secrets.authHeaderName || "Authorization";
    if (secrets.apiKey) {
      headers[headerName] =
        headerName.toLowerCase() === "authorization" && !secrets.apiKey.startsWith("Bearer ")
          ? `Bearer ${secrets.apiKey}`
          : secrets.apiKey;
    }
    const res = await fetchJsonWithTimeout(base, { method: "GET", headers });
    return {
      ok: res.status < 500 && res.status !== 401 && res.status !== 403,
      providerId: provider.id,
      testedAt,
      mode: provider.sandboxMode ? "sandbox" : "live",
      statusCode: res.status,
      message: `Custom Courier responded with HTTP ${res.status}.`,
      rawResponse: res.data,
    };
  } catch (err) {
    return {
      ok: false,
      providerId: provider.id,
      testedAt,
      mode: provider.sandboxMode ? "sandbox" : "live",
      message: `Connection test failed: ${err instanceof Error ? err.message : "Network error"}`,
    };
  }
}

export async function createCourierShipment(
  provider: AdminCourierProvider,
  secrets: CourierProviderSecrets,
  order: AdminOrderRecord,
  options: {
    mode: "auto" | "manual";
    manualConsignmentId?: string;
    manualTrackingId?: string;
  }
): Promise<CourierCreateResult> {
  const prefixMap: Record<string, string> = {
    pathao: "PTH",
    steadfast: "SF",
    redx: "RDX",
    paperfly: "PFL",
    rango_express: "RNG",
    custom: "CST",
  };
  const fallbackCode = `${prefixMap[provider.id] || "CR"}-${Date.now().toString().slice(-6)}${Math.floor(
    100 + Math.random() * 900
  )}`;

  if (options.mode === "manual") {
    const trackingId = options.manualTrackingId?.trim() || `MAN-${Date.now().toString().slice(-6)}`;
    const consignmentId = options.manualConsignmentId?.trim() || trackingId;
    return {
      ok: true,
      consignmentId,
      trackingId,
      trackingUrl: formatCustomTrackingUrl(provider.trackingUrlPattern, trackingId, consignmentId),
      notice: `Manual courier consignment assigned (${provider.name}).`,
    };
  }

  const recipientName = order.shippingAddress?.fullName || "Customer";
  const recipientPhone =
    order.shippingAddress?.phone || order.shippingAddress?.phoneNumber || "";
  const recipientAddress = `${order.shippingAddress?.address || ""}, ${
    order.shippingAddress?.city || ""
  }`.replace(/^,\s*|,\s*$/g, "");
  const codAmount = order.paymentStatus === "Paid" ? 0 : Number(order.total || 0);

  try {
    if (provider.id === "steadfast") {
      const apiKey = secrets.apiKey || process.env.STEADFAST_API_KEY;
      const secretKey = secrets.secretKey || process.env.STEADFAST_SECRET_KEY;
      if (apiKey && secretKey) {
        const base = normalizeBaseUrl(provider.baseUrl, "https://portal.packzy.com/api/v1");
        const res = await fetchJsonWithTimeout(`${base}/create_order`, {
          method: "POST",
          headers: {
            "Api-Key": apiKey,
            "Secret-Key": secretKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            invoice: order.id,
            recipient_name: recipientName,
            recipient_phone: recipientPhone,
            recipient_address: recipientAddress || "Dhaka, Bangladesh",
            cod_amount: codAmount,
            note: order.adminNote || "Rango Electronics Order",
          }),
        });
        const data = res.data as {
          consignment?: { consignment_id?: string | number; tracking_code?: string };
          message?: string;
        };
        if (res.ok && data?.consignment?.consignment_id) {
          const cid = String(data.consignment.consignment_id);
          const tid = String(data.consignment.tracking_code || cid);
          return {
            ok: true,
            consignmentId: cid,
            trackingId: tid,
            trackingUrl: `https://steadfast.com.bd/t/${encodeURIComponent(tid)}`,
            notice: "Live shipment created via Steadfast API.",
            rawResponse: res.data,
          };
        }
        return {
          ok: false,
          consignmentId: fallbackCode,
          trackingId: `TRK-${fallbackCode}`,
          notice: "Steadfast API rejected live creation; fallback consignment assigned.",
          error: `Steadfast HTTP ${res.status}: ${data?.message || JSON.stringify(res.data)}`,
          rawResponse: res.data,
        };
      }
    }

    if (provider.id === "pathao") {
      const clientId = secrets.clientId || process.env.PATHAO_CLIENT_ID;
      const clientSecret = secrets.clientSecret || process.env.PATHAO_CLIENT_SECRET;
      const username = secrets.username || process.env.PATHAO_USERNAME;
      const password = secrets.password || process.env.PATHAO_PASSWORD;
      const storeId = secrets.storeId || provider.storeId;
      if (clientId && clientSecret && username && password) {
        const base = normalizeBaseUrl(
          provider.baseUrl,
          provider.sandboxMode
            ? "https://courier-api-sandbox.pathao.com"
            : "https://api-hermes.pathao.com"
        );
        const tokenRes = await fetchJsonWithTimeout(`${base}/aladdin/api/v1/issue-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            username,
            password,
            grant_type: "password",
          }),
        });
        const accessToken = (tokenRes.data as { access_token?: string })?.access_token;
        if (!accessToken) {
          return {
            ok: false,
            consignmentId: fallbackCode,
            trackingId: `TRK-${fallbackCode}`,
            notice: "Pathao token request failed; sandbox consignment assigned.",
            error: `Pathao OAuth HTTP ${tokenRes.status}`,
            rawResponse: tokenRes.data,
          };
        }
        const orderRes = await fetchJsonWithTimeout(`${base}/aladdin/api/v1/orders`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            store_id: Number(storeId || 0) || undefined,
            merchant_order_id: order.id,
            recipient_name: recipientName,
            recipient_phone: recipientPhone,
            recipient_address: recipientAddress || "Dhaka, Bangladesh",
            delivery_type: 48,
            item_type: 2,
            item_quantity: Math.max(1, order.items?.length || 1),
            item_weight: 1.5,
            amount_to_collect: codAmount,
            item_description: "Rango Electronics Parcel",
          }),
        });
        const cid = (orderRes.data as { data?: { consignment_id?: string } })?.data?.consignment_id;
        if (orderRes.ok && cid) {
          return {
            ok: true,
            consignmentId: cid,
            trackingId: cid,
            trackingUrl: `https://merchant.pathao.com/tracking?consignment_id=${encodeURIComponent(cid)}`,
            notice: "Live shipment created via Pathao Courier API.",
            rawResponse: orderRes.data,
          };
        }
        return {
          ok: false,
          consignmentId: fallbackCode,
          trackingId: `TRK-${fallbackCode}`,
          notice: "Pathao order creation failed; fallback consignment assigned.",
          error: `Pathao HTTP ${orderRes.status}`,
          rawResponse: orderRes.data,
        };
      }
    }

    if (provider.id === "redx") {
      const token = secrets.apiToken || secrets.apiKey || process.env.REDX_API_TOKEN;
      if (token) {
        const base = normalizeBaseUrl(provider.baseUrl, "https://openapi.redx.com.bd/v1.0.0-beta");
        const res = await fetchJsonWithTimeout(`${base}/parcel`, {
          method: "POST",
          headers: {
            "API-ACCESS-TOKEN": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer_name: recipientName,
            customer_phone: recipientPhone,
            delivery_area: order.shippingAddress?.city || "Dhaka",
            delivery_area_id: 1,
            customer_address: recipientAddress || "Dhaka, Bangladesh",
            merchant_invoice_id: order.id,
            cash_collection_amount: String(codAmount),
            parcel_weight: 1000,
          }),
        });
        const tid = (res.data as { tracking_id?: string })?.tracking_id;
        if (res.ok && tid) {
          return {
            ok: true,
            consignmentId: tid,
            trackingId: tid,
            trackingUrl: `https://redx.com.bd/track-global-parcel/?trackingId=${encodeURIComponent(tid)}`,
            notice: "Live parcel created via RedX API.",
            rawResponse: res.data,
          };
        }
        return {
          ok: false,
          consignmentId: fallbackCode,
          trackingId: `TRK-${fallbackCode}`,
          notice: "RedX API rejected parcel; fallback consignment assigned.",
          error: `RedX HTTP ${res.status}`,
          rawResponse: res.data,
        };
      }
    }

    if (provider.id === "custom" && provider.baseUrl && secrets.apiKey) {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const headerName = secrets.authHeaderName || "Authorization";
      headers[headerName] =
        headerName.toLowerCase() === "authorization" && !secrets.apiKey.startsWith("Bearer ")
          ? `Bearer ${secrets.apiKey}`
          : secrets.apiKey;
      const endpoint = `${normalizeBaseUrl(provider.baseUrl, "")}/shipments`;
      const res = await fetchJsonWithTimeout(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          orderId: order.id,
          recipientName,
          recipientPhone,
          recipientAddress,
          codAmount,
        }),
      });
      const data = res.data as { consignmentId?: string; trackingId?: string };
      if (res.ok && (data?.consignmentId || data?.trackingId)) {
        const cid = data.consignmentId || data.trackingId || fallbackCode;
        const tid = data.trackingId || cid;
        return {
          ok: true,
          consignmentId: cid,
          trackingId: tid,
          trackingUrl: formatCustomTrackingUrl(provider.trackingUrlPattern, tid, cid),
          notice: `Live shipment created via ${provider.name}.`,
          rawResponse: res.data,
        };
      }
      return {
        ok: false,
        consignmentId: fallbackCode,
        trackingId: `TRK-${fallbackCode}`,
        notice: "Custom courier endpoint returned an error; fallback consignment generated.",
        error: `Custom Courier HTTP ${res.status}`,
        rawResponse: res.data,
      };
    }

    return {
      ok: true,
      consignmentId: fallbackCode,
      trackingId: `TRK-${fallbackCode}`,
      trackingUrl: formatCustomTrackingUrl(provider.trackingUrlPattern, `TRK-${fallbackCode}`, fallbackCode),
      notice:
        provider.id === "rango_express"
          ? "Assigned to Rango Express fleet dispatch."
          : `Sandbox consignment assigned for ${provider.name} (enter live API credentials to dispatch externally).`,
    };
  } catch (err) {
    return {
      ok: false,
      consignmentId: fallbackCode,
      trackingId: `TRK-${fallbackCode}`,
      notice: "Courier API network failure; fallback consignment assigned locally.",
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

export async function fetchCourierTracking(
  provider: AdminCourierProvider | undefined,
  secrets: CourierProviderSecrets,
  booking: AdminCourierBooking
): Promise<CourierTrackingResult> {
  if (!provider || provider.id === "rango_express") {
    return {
      ok: true,
      status: booking.deliveryStatus,
      message: `Local tracking status for ${booking.trackingId}: ${booking.deliveryStatus}`,
    };
  }

  try {
    if (provider.id === "steadfast") {
      const apiKey = secrets.apiKey || process.env.STEADFAST_API_KEY;
      const secretKey = secrets.secretKey || process.env.STEADFAST_SECRET_KEY;
      if (apiKey && secretKey) {
        const base = normalizeBaseUrl(provider.baseUrl, "https://portal.packzy.com/api/v1");
        const res = await fetchJsonWithTimeout(
          `${base}/status_by_trackingcode/${encodeURIComponent(booking.trackingId)}`,
          {
            method: "GET",
            headers: {
              "Api-Key": apiKey,
              "Secret-Key": secretKey,
            },
          }
        );
        const deliveryStatus = (res.data as { delivery_status?: string })?.delivery_status;
        if (res.ok && deliveryStatus) {
          return {
            ok: true,
            status: deliveryStatus,
            message: `Steadfast live status: ${deliveryStatus}`,
            rawResponse: res.data,
          };
        }
      }
    }

    if (provider.id === "redx") {
      const token = secrets.apiToken || secrets.apiKey || process.env.REDX_API_TOKEN;
      if (token) {
        const base = normalizeBaseUrl(provider.baseUrl, "https://openapi.redx.com.bd/v1.0.0-beta");
        const res = await fetchJsonWithTimeout(
          `${base}/parcel/info/${encodeURIComponent(booking.trackingId)}`,
          {
            method: "GET",
            headers: { "API-ACCESS-TOKEN": `Bearer ${token}` },
          }
        );
        const parcelStatus = (res.data as { parcel?: { status?: string } })?.parcel?.status;
        if (res.ok && parcelStatus) {
          return {
            ok: true,
            status: parcelStatus,
            message: `RedX live status: ${parcelStatus}`,
            rawResponse: res.data,
          };
        }
      }
    }

    return {
      ok: true,
      status: booking.deliveryStatus,
      message: `Current consignment ${booking.consignmentId} status: ${booking.deliveryStatus} (sandbox/local).`,
    };
  } catch (err) {
    return {
      ok: false,
      status: booking.deliveryStatus,
      message: `Tracking lookup failed: ${err instanceof Error ? err.message : "Network error"}`,
    };
  }
}
