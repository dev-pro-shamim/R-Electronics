import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest, hasRolePermission } from "@/lib/adminAuth";
import {
  appendAuditLog,
  readAdminDb,
  syncOrderToSupabase,
  writeAdminDb,
} from "@/lib/adminDb";
import { buildAuthenticatedAdminPayload } from "@/lib/adminServerHelpers";
import {
  CourierProviderSecrets,
  getCourierSecretsForProvider,
  hasCourierCredentials,
  readServerSecrets,
  writeServerSecrets,
} from "@/lib/serverSecrets";
import {
  createCourierShipment,
  fetchCourierTracking,
  testCourierConnection,
} from "@/lib/courierAdapters";
import { dispatchNotification, wrapRangoEmailTemplate } from "@/lib/notifications";
import { AdminCourierBooking, AdminCourierProvider, AdminOrderRecord } from "@/types/admin";

function isUnchangedSecret(val: unknown): boolean {
  if (val === undefined || val === null) return true;
  const str = String(val).trim();
  return !str || str.includes("••");
}

export async function POST(req: NextRequest) {
  const session = getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const action = String(body.action || "");
    const db = readAdminDb();
    if (!hasRolePermission(session.role, "courier", db.roles)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (action === "save_config") {
      const providerId = String(body.providerId || "") as AdminCourierProvider["id"];
      const config = (body.config || {}) as Partial<AdminCourierProvider>;
      const incomingSecrets = (body.secrets || {}) as CourierProviderSecrets;

      const allSecrets = readServerSecrets();
      const prevSecrets = allSecrets.couriers?.[providerId] || {};
      const nextSecrets: CourierProviderSecrets = { ...prevSecrets };
      for (const key of [
        "apiKey",
        "secretKey",
        "clientId",
        "clientSecret",
        "apiToken",
        "username",
        "password",
        "storeId",
        "authHeaderName",
      ] as (keyof CourierProviderSecrets)[]) {
        const incoming = incomingSecrets[key];
        if (!isUnchangedSecret(incoming)) {
          nextSecrets[key] = String(incoming).trim();
        }
      }

      if (body.clearSecrets === true) {
        allSecrets.couriers[providerId] = {};
      } else {
        allSecrets.couriers[providerId] = nextSecrets;
      }
      writeServerSecrets(allSecrets);

      const exists = (db.couriers || []).some((c) => c.id === providerId);
      const updatedCouriers = exists
        ? db.couriers.map((c) =>
            c.id === providerId
              ? {
                  ...c,
                  name: config.name !== undefined ? String(config.name) : c.name,
                  enabled: config.enabled !== undefined ? Boolean(config.enabled) : c.enabled,
                  sandboxMode:
                    config.sandboxMode !== undefined ? Boolean(config.sandboxMode) : c.sandboxMode,
                  baseUrl: config.baseUrl !== undefined ? String(config.baseUrl) : c.baseUrl,
                  storeId: config.storeId !== undefined ? String(config.storeId) : c.storeId,
                  trackingUrlPattern:
                    config.trackingUrlPattern !== undefined
                      ? String(config.trackingUrlPattern)
                      : c.trackingUrlPattern,
                  defaultCharge:
                    config.defaultCharge !== undefined
                      ? Number(config.defaultCharge)
                      : c.defaultCharge,
                  hasCredentials: hasCourierCredentials(providerId),
                }
              : c
          )
        : [
            ...(db.couriers || []),
            {
              id: providerId,
              name: String(config.name || providerId),
              enabled: Boolean(config.enabled),
              sandboxMode: config.sandboxMode !== false,
              baseUrl: config.baseUrl,
              storeId: config.storeId,
              trackingUrlPattern: config.trackingUrlPattern,
              defaultCharge: Number(config.defaultCharge || 120),
              hasCredentials: hasCourierCredentials(providerId),
            },
          ];

      const logged = appendAuditLog(
        { ...db, couriers: updatedCouriers },
        session.email,
        "Courier",
        `Saved ${providerId} API configuration & server-side credentials`,
        session.role
      );
      writeAdminDb(logged);
      return NextResponse.json(
        await buildAuthenticatedAdminPayload(logged, { skipRemoteOrders: true, compact: true })
      );
    }

    if (action === "test_connection") {
      const providerId = String(body.providerId || "") as AdminCourierProvider["id"];
      const provider = (db.couriers || []).find((c) => c.id === providerId);
      if (!provider) {
        return NextResponse.json({ error: "Courier provider not found." }, { status: 404 });
      }
      const secrets = getCourierSecretsForProvider(providerId);
      const result = await testCourierConnection(provider, secrets);

      const updatedCouriers = (db.couriers || []).map((c) =>
        c.id === providerId
          ? {
              ...c,
              lastTestedAt: result.testedAt,
              lastTestStatus: result.ok ? ("ok" as const) : ("error" as const),
              lastTestMessage: result.message,
            }
          : c
      );

      const logged = appendAuditLog(
        { ...db, couriers: updatedCouriers },
        session.email,
        "Courier",
        `Tested ${provider.name} API connection (${result.ok ? "OK" : "Failed"})`,
        session.role,
        result.message
      );
      writeAdminDb(logged);
      const payload = await buildAuthenticatedAdminPayload(logged, {
        skipRemoteOrders: true,
        compact: true,
      });
      return NextResponse.json({ ...payload, testResult: result });
    }

    if (action === "update_providers") {
      const providers = (body.couriers || []) as AdminCourierProvider[];
      const sanitized = providers.map((p) => ({
        id: p.id,
        name: p.name,
        enabled: Boolean(p.enabled),
        sandboxMode: Boolean(p.sandboxMode),
        baseUrl: p.baseUrl,
        storeId: p.storeId,
        trackingUrlPattern: p.trackingUrlPattern,
        defaultCharge: Number(p.defaultCharge || 0),
        lastTestedAt: p.lastTestedAt,
        lastTestStatus: p.lastTestStatus,
        lastTestMessage: p.lastTestMessage,
        hasCredentials: hasCourierCredentials(p.id),
      }));
      const logged = appendAuditLog(
        { ...db, couriers: sanitized },
        session.email,
        "Courier",
        "Updated courier partner configuration",
        session.role
      );
      writeAdminDb(logged);
      return NextResponse.json(
        await buildAuthenticatedAdminPayload(logged, { skipRemoteOrders: true, compact: true })
      );
    }

    if (action === "book_courier") {
      const order = body.order as AdminOrderRecord;
      const courierId = String(body.courierId || "steadfast") as AdminCourierProvider["id"];
      const mode = (body.mode === "auto" ? "auto" : "manual") as "auto" | "manual";
      const provider = (db.couriers || []).find((c) => c.id === courierId) || {
        id: courierId,
        name: courierId,
        enabled: true,
        sandboxMode: true,
        defaultCharge: 120,
      };
      const courierName = provider.name || courierId;
      const deliveryCharge = Number(body.deliveryCharge ?? provider.defaultCharge ?? 120);
      const secrets = getCourierSecretsForProvider(courierId);

      const createRes = await createCourierShipment(provider, secrets, order, {
        mode,
        manualConsignmentId: body.consignmentId ? String(body.consignmentId) : undefined,
        manualTrackingId: body.trackingId ? String(body.trackingId) : undefined,
      });

      const booking: AdminCourierBooking = {
        id: `cb-${Date.now()}`,
        orderId: order.id,
        courierId,
        courierName,
        consignmentId: createRes.consignmentId,
        trackingId: createRes.trackingId,
        trackingUrl: createRes.trackingUrl,
        deliveryStatus: "Booked",
        deliveryCharge,
        recipientName: order.shippingAddress?.fullName || "Customer",
        recipientPhone:
          order.shippingAddress?.phone || order.shippingAddress?.phoneNumber || "N/A",
        recipientAddress: `${order.shippingAddress?.address || ""}, ${
          order.shippingAddress?.city || ""
        }`.replace(/^,\s*|,\s*$/g, ""),
        mode,
        apiResponseSummary: createRes.notice,
        lastApiError: createRes.error,
        lastSyncedAt: new Date().toISOString(),
        bookedAt: new Date().toISOString(),
      };

      const nextOverrides = {
        ...(db.orderOverrides || {}),
        [order.id]: {
          ...(db.orderOverrides?.[order.id] || {}),
          courier: courierName,
          trackingNo: createRes.trackingId,
          deliveryCharge,
          status:
            order.status === "Pending" || order.status === "Confirmed"
              ? "Ready to Ship"
              : order.status,
        },
      };

      await syncOrderToSupabase(order.id, {
        courier: courierName,
        tracking_no: createRes.trackingId,
        status: nextOverrides[order.id].status,
      });

      let nextDb: typeof db = {
        ...db,
        orderOverrides: nextOverrides,
        courierBookings: [booking, ...(db.courierBookings || [])],
      };

      if (mode === "auto" && !createRes.ok && createRes.error) {
        await dispatchNotification({
          eventKey: `courier-err-${order.id}-${Date.now()}`,
          eventType: "courier_integration_error",
          subject: `[COURIER ERROR] ${courierName} booking failed for Order #${order.id}`,
          html: wrapRangoEmailTemplate(
            "Courier API Integration Alert",
            "COURIER ERROR",
            `<p>Automated consignment creation with <strong>${courierName}</strong> failed for Order <strong>#${order.id}</strong>.</p><p><strong>Error:</strong> ${createRes.error}</p><p>Fallback local consignment <strong>${createRes.consignmentId}</strong> was created so dispatch is not blocked.</p>`
          ),
          db: nextDb,
        });
      }

      nextDb = appendAuditLog(
        nextDb,
        session.email,
        "Courier",
        `${mode === "auto" ? "Auto-booked" : "Manually assigned"} ${courierName} for Order #${order.id} (${createRes.trackingId})`,
        session.role,
        createRes.error || createRes.notice
      );
      writeAdminDb(nextDb);

      const payload = await buildAuthenticatedAdminPayload(nextDb, {
        skipRemoteOrders: true,
        compact: true,
      });
      return NextResponse.json({
        ...payload,
        booking,
        notice: createRes.notice,
        apiError: createRes.error,
      });
    }

    if (action === "book_courier_bulk") {
      const orders = Array.isArray(body.orders) ? (body.orders as AdminOrderRecord[]) : [];
      if (orders.length === 0) {
        return NextResponse.json({ error: "No orders selected for courier booking." }, { status: 400 });
      }
      const courierId = String(body.courierId || "steadfast") as AdminCourierProvider["id"];
      const provider = (db.couriers || []).find((c) => c.id === courierId) || {
        id: courierId,
        name: courierId,
        enabled: true,
        sandboxMode: true,
        defaultCharge: 120,
      };
      const courierName = provider.name || courierId;
      const deliveryCharge = Number(body.deliveryCharge ?? provider.defaultCharge ?? 120);
      const secrets = getCourierSecretsForProvider(courierId);

      const nextOverrides = { ...(db.orderOverrides || {}) };
      const newBookings: AdminCourierBooking[] = [];

      for (const order of orders) {
        const createRes = await createCourierShipment(provider, secrets, order, {
          mode: "auto",
        });
        newBookings.push({
          id: `cb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          orderId: order.id,
          courierId,
          courierName,
          consignmentId: createRes.consignmentId,
          trackingId: createRes.trackingId,
          trackingUrl: createRes.trackingUrl,
          deliveryStatus: "Booked",
          deliveryCharge,
          recipientName: order.shippingAddress?.fullName || "Customer",
          recipientPhone:
            order.shippingAddress?.phone || order.shippingAddress?.phoneNumber || "N/A",
          recipientAddress: `${order.shippingAddress?.address || ""}, ${
            order.shippingAddress?.city || ""
          }`.replace(/^,\s*|,\s*$/g, ""),
          mode: "auto",
          apiResponseSummary: createRes.notice,
          lastApiError: createRes.error,
          lastSyncedAt: new Date().toISOString(),
          bookedAt: new Date().toISOString(),
        });
        const nextStatus =
          order.status === "Pending" || order.status === "Confirmed"
            ? "Ready to Ship"
            : order.status;
        nextOverrides[order.id] = {
          ...(nextOverrides[order.id] || {}),
          courier: courierName,
          trackingNo: createRes.trackingId,
          deliveryCharge,
          status: nextStatus,
        };
        void syncOrderToSupabase(order.id, {
          courier: courierName,
          tracking_no: createRes.trackingId,
          status: nextStatus,
        });
      }

      const nextDb = appendAuditLog(
        {
          ...db,
          orderOverrides: nextOverrides,
          courierBookings: [...newBookings, ...(db.courierBookings || [])],
        },
        session.email,
        "Courier",
        `Bulk 1-click booked ${newBookings.length} orders via ${courierName}`,
        session.role
      );
      writeAdminDb(nextDb);

      const payload = await buildAuthenticatedAdminPayload(nextDb, {
        skipRemoteOrders: true,
        compact: true,
      });
      return NextResponse.json({
        ...payload,
        notice: `Booked ${newBookings.length} orders with ${courierName}`,
      });
    }

    if (action === "fetch_tracking") {
      const bookingId = String(body.bookingId || "");
      const booking = (db.courierBookings || []).find((b) => b.id === bookingId);
      if (!booking) {
        return NextResponse.json({ error: "Booking not found." }, { status: 404 });
      }
      const provider = (db.couriers || []).find((c) => c.id === booking.courierId);
      const secrets = getCourierSecretsForProvider(booking.courierId);
      const track = await fetchCourierTracking(provider, secrets, booking);

      const nextBookings = (db.courierBookings || []).map((b) =>
        b.id === bookingId
          ? {
              ...b,
              apiResponseSummary: track.message,
              lastSyncedAt: new Date().toISOString(),
            }
          : b
      );
      const logged = appendAuditLog(
        { ...db, courierBookings: nextBookings },
        session.email,
        "Courier",
        `Fetched tracking for ${booking.trackingId}: ${track.status}`,
        session.role
      );
      writeAdminDb(logged);
      const payload = await buildAuthenticatedAdminPayload(logged, {
        skipRemoteOrders: true,
        compact: true,
      });
      return NextResponse.json({ ...payload, tracking: track });
    }

    if (action === "update_booking_status") {
      const bookingId = String(body.bookingId || "");
      const deliveryStatus = String(
        body.deliveryStatus || "In Transit"
      ) as AdminCourierBooking["deliveryStatus"];
      const returnStatus = body.returnStatus ? String(body.returnStatus) : undefined;

      const targetBooking = (db.courierBookings || []).find((b) => b.id === bookingId);
      const nextBookings = (db.courierBookings || []).map((b) =>
        b.id === bookingId
          ? { ...b, deliveryStatus, returnStatus, lastSyncedAt: new Date().toISOString() }
          : b
      );

      const nextOverrides = { ...(db.orderOverrides || {}) };
      if (targetBooking) {
        const mappedOrderStatus =
          deliveryStatus === "Delivered"
            ? "Delivered"
            : deliveryStatus === "Returned"
            ? "Returned"
            : deliveryStatus === "Picked Up" || deliveryStatus === "In Transit"
            ? "Shipped"
            : undefined;
        if (mappedOrderStatus) {
          nextOverrides[targetBooking.orderId] = {
            ...(nextOverrides[targetBooking.orderId] || {}),
            status: mappedOrderStatus,
          };
          void syncOrderToSupabase(targetBooking.orderId, {
            status: mappedOrderStatus,
          });
        }
      }

      const logged = appendAuditLog(
        { ...db, courierBookings: nextBookings, orderOverrides: nextOverrides },
        session.email,
        "Courier",
        `Updated shipment ${bookingId} status -> ${deliveryStatus}`,
        session.role
      );
      writeAdminDb(logged);
      return NextResponse.json(
        await buildAuthenticatedAdminPayload(logged, { skipRemoteOrders: true, compact: true })
      );
    }

    return NextResponse.json({ error: "Invalid courier action" }, { status: 400 });
  } catch (err) {
    console.error("Courier API error:", err);
    return NextResponse.json({ error: "Courier request failed" }, { status: 400 });
  }
}
