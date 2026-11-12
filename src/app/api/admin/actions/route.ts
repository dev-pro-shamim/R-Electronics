import { NextRequest, NextResponse } from "next/server";
import {
  getAdminSessionFromRequest,
  hasRolePermission,
} from "@/lib/adminAuth";
import {
  readAdminDb,
  syncOrderToSupabase,
  syncProductToSupabase,
  syncReviewToSupabase,
  writeAdminDb,
} from "@/lib/adminDb";
import { dispatchNotification, wrapRangoEmailTemplate } from "@/lib/notifications";
import {
  applyOrderInventoryRules,
  applyProductStockDelta,
  buildAuthenticatedAdminPayload,
  buildInvoiceFromOrder,
  dispatchInvoiceEmail,
  getMergedCatalogProducts,
  withAudit,
} from "@/lib/adminServerHelpers";
import {
  recomputeAccountBalances,
  recordBalancedTransfer,
  recordOrderCollectionIdempotent,
  recordOrderRefundReversal,
} from "@/lib/accountingEngine";
import {
  AdminInvoiceRecord,
  AdminOrderRecord,
  AdminPaymentRecord,
  FinancialAccount,
  FinancialTransaction,
  OrderStatus,
  PaymentStatusType,
  ProductAdminExtended,
} from "@/types/admin";
import { Product } from "@/data/products";

export async function POST(req: NextRequest) {
  const session = getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const action = String(body.action || "");
    let db = readAdminDb();
    let meta: Record<string, unknown> = {};

    switch (action) {
      case "update_order": {
        if (!hasRolePermission(session.role, "orders", db.roles)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const order = body.order as AdminOrderRecord;
        const nextStatus = String(body.status || order.status) as OrderStatus;
        const nextPaymentStatus = String(
          body.paymentStatus || order.paymentStatus
        ) as PaymentStatusType;
        const courier = body.courier !== undefined ? String(body.courier) : order.courier;
        const trackingNo =
          body.trackingNo !== undefined ? String(body.trackingNo) : order.trackingNo;
        const deliveryCharge =
          body.deliveryCharge !== undefined
            ? Number(body.deliveryCharge)
            : undefined;
        const adminNote =
          body.adminNote !== undefined ? String(body.adminNote) : order.adminNote;

        db.orderOverrides = {
          ...(db.orderOverrides || {}),
          [order.id]: {
            ...(db.orderOverrides?.[order.id] || {}),
            status: nextStatus,
            paymentStatus: nextPaymentStatus,
            courier,
            trackingNo,
            deliveryCharge,
            adminNote,
          },
        };

        void syncOrderToSupabase(order.id, {
          status: nextStatus,
          payment_status: nextPaymentStatus,
          courier,
          tracking_no: trackingNo,
        });

        // 1. Idempotent Inventory Adjustment
        db = await applyOrderInventoryRules(db, order, nextStatus, session.email);

        // 2. Idempotent Accounting Entry for Paid / Refunded
        if (nextPaymentStatus === "Paid") {
          db = recordOrderCollectionIdempotent(
            db,
            {
              id: order.id,
              total: order.total,
              paymentMethod: order.paymentMethod,
              shippingAddress: order.shippingAddress,
            },
            session.email
          );
        } else if (nextPaymentStatus === "Refunded") {
          db = recordOrderRefundReversal(
            db,
            order.id,
            order.total,
            order.paymentMethod,
            session.email
          );
        }

        // 3. Upsert payment log row if missing or changed
        const existingPayIdx = (db.payments || []).findIndex(
          (p) => p.orderId === order.id
        );
        const nowIso = new Date().toISOString();
        const paymentRow: AdminPaymentRecord = {
          id: existingPayIdx >= 0 ? db.payments[existingPayIdx].id : `pay-${order.id}`,
          orderId: order.id,
          customerName: order.shippingAddress?.fullName || "Customer",
          phone:
            order.shippingAddress?.phone ||
            order.shippingAddress?.phoneNumber ||
            "N/A",
          method: order.paymentMethod,
          amount: Number(order.total || 0),
          status: nextPaymentStatus,
          transactionId: order.bkashTrxId || order.nagadTrxId,
          senderNumber: order.bkashPhone || order.nagadPhone,
          verifiedBy: nextPaymentStatus === "Paid" ? session.email : undefined,
          verifiedAt: nextPaymentStatus === "Paid" ? nowIso : undefined,
          notes: adminNote,
          createdAt:
            existingPayIdx >= 0
              ? db.payments[existingPayIdx].createdAt
              : order.createdAtIso || nowIso,
        };
        if (existingPayIdx >= 0) {
          db.payments[existingPayIdx] = paymentRow;
        } else {
          db.payments = [paymentRow, ...(db.payments || [])];
        }

        // 4. Auto-generate invoice if configured & not created yet
        if (
          db.settings?.autoInvoiceOnOrder &&
          !(db.invoices || []).some((inv) => inv.orderId === order.id)
        ) {
          const autoInv = buildInvoiceFromOrder(db, {
            ...order,
            status: nextStatus,
            paymentStatus: nextPaymentStatus,
          });
          db.invoices = [autoInv, ...(db.invoices || [])];
        } else {
          db.invoices = (db.invoices || []).map((inv) =>
            inv.orderId === order.id ? { ...inv, paymentStatus: nextPaymentStatus } : inv
          );
        }

        db = withAudit(
          db,
          session,
          "Orders",
          `Updated Order #${order.id} → Status: ${nextStatus}, Payment: ${nextPaymentStatus}`
        );

        const custEmail = order.shippingAddress?.email;
        void dispatchNotification({
          eventKey: `order-status-${order.id}-${nextStatus}-${nextPaymentStatus}`,
          eventType:
            nextStatus === "Delivered"
              ? "order_delivered"
              : nextStatus === "Cancelled"
              ? "order_cancelled"
              : "order_status_updated",
          subject: `[Order #${order.id}] Status updated to ${nextStatus} (${nextPaymentStatus})`,
          html: wrapRangoEmailTemplate(
            `Order #${order.id} Update`,
            nextStatus.toUpperCase(),
            `<p><strong>Customer:</strong> ${order.shippingAddress?.fullName || "Customer"} (${order.shippingAddress?.phone || "N/A"})<br/>
            <strong>Order Status:</strong> ${nextStatus}<br/>
            <strong>Payment Status:</strong> ${nextPaymentStatus}<br/>
            ${courier ? `<strong>Courier:</strong> ${courier} ${trackingNo ? `(${trackingNo})` : ""}<br/>` : ""}
            <strong>Total:</strong> ৳${Number(order.total || 0).toLocaleString()}</p>`
          ),
          notifyAdmin: true,
          customerEmail: custEmail,
          customerSubject: `Your Order #${order.id} is now ${nextStatus} — Rango Electronics`,
          customerHtml: wrapRangoEmailTemplate(
            `Order #${order.id} Update`,
            nextStatus.toUpperCase(),
            `<p>Dear ${order.shippingAddress?.fullName || "Customer"},</p>
            <p>Your Rango Electronics order <strong>#${order.id}</strong> status is now <strong>${nextStatus}</strong> (Payment: <strong>${nextPaymentStatus}</strong>).</p>
            ${courier && trackingNo ? `<p><strong>Courier Tracking:</strong> ${courier} — <strong>${trackingNo}</strong></p>` : ""}
            <p>Thank you for shopping with Rango Electronics!</p>`
          ),
          db,
        });
        break;
      }

      case "verify_payment": {
        if (!hasRolePermission(session.role, "payments", db.roles)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const order = body.order as AdminOrderRecord;
        const decision = String(body.paymentStatus || "Paid") as PaymentStatusType;
        const notes = String(body.notes || "");
        const gatewayReference = String(body.gatewayReference || "");
        const nowIso = new Date().toISOString();

        db.orderOverrides = {
          ...(db.orderOverrides || {}),
          [order.id]: {
            ...(db.orderOverrides?.[order.id] || {}),
            paymentStatus: decision,
            status:
              decision === "Paid" && order.status === "Pending"
                ? "Confirmed"
                : db.orderOverrides?.[order.id]?.status || order.status,
          },
        };

        void syncOrderToSupabase(order.id, {
          payment_status: decision,
          status: db.orderOverrides[order.id].status,
        });

        const existingIdx = (db.payments || []).findIndex(
          (p) => p.orderId === order.id
        );
        const rec: AdminPaymentRecord = {
          id: existingIdx >= 0 ? db.payments[existingIdx].id : `pay-${order.id}`,
          orderId: order.id,
          customerName: order.shippingAddress?.fullName || "Customer",
          phone:
            order.shippingAddress?.phone ||
            order.shippingAddress?.phoneNumber ||
            "N/A",
          method: order.paymentMethod,
          amount: Number(order.total || 0),
          status: decision,
          transactionId: order.bkashTrxId || order.nagadTrxId,
          senderNumber: order.bkashPhone || order.nagadPhone,
          gatewayReference: gatewayReference || undefined,
          verifiedBy: session.email,
          verifiedAt: nowIso,
          notes,
          createdAt:
            existingIdx >= 0
              ? db.payments[existingIdx].createdAt
              : order.createdAtIso || nowIso,
        };
        if (existingIdx >= 0) db.payments[existingIdx] = rec;
        else db.payments = [rec, ...(db.payments || [])];

        if (decision === "Paid") {
          db = recordOrderCollectionIdempotent(db, order, session.email);
          db = await applyOrderInventoryRules(
            db,
            order,
            db.orderOverrides[order.id].status || "Confirmed",
            session.email
          );
        } else if (decision === "Refunded") {
          db = recordOrderRefundReversal(
            db,
            order.id,
            order.total,
            order.paymentMethod,
            session.email
          );
        }

        db.invoices = (db.invoices || []).map((inv) =>
          inv.orderId === order.id ? { ...inv, paymentStatus: decision } : inv
        );

        db = withAudit(
          db,
          session,
          "Payments",
          `Verified Order #${order.id} payment as ${decision}`,
          notes
        );

        void dispatchNotification({
          eventKey: `payment-${order.id}-${decision}`,
          eventType: decision === "Failed" ? "payment_failed" : "payment_verified",
          subject: `[Payment ${decision}] Order #${order.id} — ৳${Number(order.total || 0).toLocaleString()}`,
          html: wrapRangoEmailTemplate(
            `Payment ${decision} for Order #${order.id}`,
            decision.toUpperCase(),
            `<p><strong>Customer:</strong> ${order.shippingAddress?.fullName || "Customer"}<br/>
            <strong>Method:</strong> ${order.paymentMethod}<br/>
            <strong>Amount:</strong> ৳${Number(order.total || 0).toLocaleString()}<br/>
            ${notes ? `<strong>Notes:</strong> ${notes}` : ""}</p>`
          ),
          notifyAdmin: true,
          customerEmail: order.shippingAddress?.email,
          customerSubject: `Payment ${decision} for Order #${order.id} — Rango Electronics`,
          db,
        });
        break;
      }

      case "bulk_update_orders": {
        if (!hasRolePermission(session.role, "orders", db.roles)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const bulkOrders = Array.isArray(body.orders)
          ? (body.orders as AdminOrderRecord[])
          : [];
        const nextStatus = body.status ? (String(body.status) as OrderStatus) : undefined;
        const nextPaymentStatus = body.paymentStatus
          ? (String(body.paymentStatus) as PaymentStatusType)
          : undefined;
        const nowIso = new Date().toISOString();

        for (const order of bulkOrders) {
          const resolvedStatus = nextStatus || order.status;
          const resolvedPayStatus = nextPaymentStatus || order.paymentStatus;
          db.orderOverrides = {
            ...(db.orderOverrides || {}),
            [order.id]: {
              ...(db.orderOverrides?.[order.id] || {}),
              status: resolvedStatus,
              paymentStatus: resolvedPayStatus,
            },
          };
          void syncOrderToSupabase(order.id, {
            status: resolvedStatus,
            payment_status: resolvedPayStatus,
          });
          db = await applyOrderInventoryRules(db, order, resolvedStatus, session.email);
          if (resolvedPayStatus === "Paid") {
            db = recordOrderCollectionIdempotent(db, order, session.email);
          } else if (resolvedPayStatus === "Refunded") {
            db = recordOrderRefundReversal(db, order.id, order.total, order.paymentMethod, session.email);
          }

          const existingPayIdx = (db.payments || []).findIndex((p) => p.orderId === order.id);
          const payRow: AdminPaymentRecord = {
            id: existingPayIdx >= 0 ? db.payments[existingPayIdx].id : `pay-${order.id}`,
            orderId: order.id,
            customerName: order.shippingAddress?.fullName || "Customer",
            phone: order.shippingAddress?.phone || order.shippingAddress?.phoneNumber || "N/A",
            method: order.paymentMethod,
            amount: Number(order.total || 0),
            status: resolvedPayStatus,
            transactionId: order.bkashTrxId || order.nagadTrxId,
            senderNumber: order.bkashPhone || order.nagadPhone,
            verifiedBy: resolvedPayStatus === "Paid" ? session.email : undefined,
            verifiedAt: resolvedPayStatus === "Paid" ? nowIso : undefined,
            createdAt: existingPayIdx >= 0 ? db.payments[existingPayIdx].createdAt : order.createdAtIso || nowIso,
          };
          if (existingPayIdx >= 0) db.payments[existingPayIdx] = payRow;
          else db.payments = [payRow, ...(db.payments || [])];

          db.invoices = (db.invoices || []).map((inv) =>
            inv.orderId === order.id ? { ...inv, paymentStatus: resolvedPayStatus } : inv
          );
        }

        db = withAudit(
          db,
          session,
          "Orders",
          `Bulk updated ${bulkOrders.length} orders${nextStatus ? ` -> Status: ${nextStatus}` : ""}${
            nextPaymentStatus ? `, Payment: ${nextPaymentStatus}` : ""
          }`
        );
        break;
      }

      case "create_invoice": {
        if (!hasRolePermission(session.role, "invoices", db.roles)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const invoiceInput = body.invoice as Partial<AdminInvoiceRecord>;
        const orderInput = body.order as AdminOrderRecord | undefined;

        let newInv: AdminInvoiceRecord;
        if (orderInput) {
          newInv = buildInvoiceFromOrder(db, orderInput);
        } else {
          const items = Array.isArray(invoiceInput.items) ? invoiceInput.items : [];
          const subtotal = items.reduce(
            (s, it) => s + Number(it.unitPrice || 0) * Number(it.quantity || 1),
            0
          );
          const discount = Number(invoiceInput.discount || 0);
          const vatPercent = Number(
            invoiceInput.vatPercent ?? db.settings?.defaultVatPercent ?? 0
          );
          const deliveryCharge = Number(invoiceInput.deliveryCharge || 0);
          const vatAmount = Math.round((Math.max(0, subtotal - discount) * vatPercent) / 100);
          const total = Math.max(0, subtotal - discount + vatAmount + deliveryCharge);
          const prefix = db.settings?.invoicePrefix || "INV-RE-";

          newInv = {
            id: `inv-${Date.now()}`,
            invoiceNumber: `${prefix}${Date.now().toString().slice(-6)}`,
            invoiceType: "manual",
            sourceChannel: invoiceInput.sourceChannel || "Walk-in",
            customerName: String(invoiceInput.customerName || "Walk-in Customer"),
            customerPhone: String(invoiceInput.customerPhone || "N/A"),
            customerEmail: invoiceInput.customerEmail,
            customerAddress: String(invoiceInput.customerAddress || "Showroom Pickup"),
            items: items.map((it) => ({
              productId: it.productId,
              title: it.title,
              quantity: Math.max(1, Number(it.quantity || 1)),
              unitPrice: Number(it.unitPrice || 0),
              total: Number(it.unitPrice || 0) * Math.max(1, Number(it.quantity || 1)),
            })),
            subtotal,
            discount,
            vatPercent,
            vatAmount,
            deliveryCharge,
            total,
            paymentMethod: String(invoiceInput.paymentMethod || "Cash"),
            paymentStatus: (invoiceInput.paymentStatus || "Paid") as PaymentStatusType,
            createdAt: new Date().toISOString(),
          };
        }

        const existingIdx = (db.invoices || []).findIndex(
          (i) => i.id === newInv.id || (newInv.orderId && i.orderId === newInv.orderId)
        );
        if (existingIdx >= 0) db.invoices[existingIdx] = newInv;
        else db.invoices = [newInv, ...(db.invoices || [])];

        // If manual paid invoice & user opts to record sales income
        if (
          newInv.invoiceType === "manual" &&
          newInv.paymentStatus === "Paid" &&
          body.recordIncome !== false
        ) {
          db = recordOrderCollectionIdempotent(
            db,
            {
              id: newInv.invoiceNumber,
              total: newInv.total,
              paymentMethod: newInv.paymentMethod,
              shippingAddress: {
                fullName: newInv.customerName,
                city: "Dhaka",
                address: newInv.customerAddress,
              },
            },
            session.email
          );
        }

        db = withAudit(
          db,
          session,
          "Invoices",
          `Generated ${newInv.invoiceType} invoice ${newInv.invoiceNumber} (${newInv.sourceChannel})`
        );
        meta = { invoice: newInv };
        break;
      }

      case "email_invoice": {
        if (!hasRolePermission(session.role, "invoices", db.roles)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const invoiceId = String(body.invoiceId || "");
        const inv = (db.invoices || []).find((i) => i.id === invoiceId);
        if (!inv) {
          return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
        }
        const emailResult = await dispatchInvoiceEmail(
          inv,
          db.settings?.storeName || "Rango Electronics",
          db.settings?.invoiceFooterNote,
          db
        );
        db = withAudit(
          db,
          session,
          "Invoices",
          `Email dispatch attempt for ${inv.invoiceNumber}`,
          emailResult.message
        );
        meta = emailResult;
        break;
      }

      case "stock_adjustment": {
        if (!hasRolePermission(session.role, "inv-adjust", db.roles)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const productId = String(body.productId || "");
        const adjustType = String(body.type || "stock_in") as
          | "stock_in"
          | "stock_out"
          | "adjustment";
        const quantity = Math.max(0, Number(body.quantity || 0));
        const reason = String(body.reason || "Manual admin inventory update");

        let delta = quantity;
        if (adjustType === "stock_out") delta = -quantity;
        if (adjustType === "adjustment") {
          const targetStock = Number(body.targetStock ?? quantity);
          const current =
            getMergedCatalogProducts(db).find((p) => p.id === productId)?.stock ?? 10;
          delta = targetStock - current;
        }

        const res = applyProductStockDelta(
          db,
          productId,
          delta,
          adjustType,
          reason,
          session.email
        );
        db = res.db;
        if (res.syncedProduct) {
          await syncProductToSupabase(
            res.syncedProduct as unknown as Record<string, unknown>
          );
          const lowThresh = Number(db.settings?.lowStockThreshold ?? 5);
          const currentStk = Number(res.syncedProduct.stock ?? 0);
          if (currentStk <= 0) {
            await dispatchNotification({
              eventKey: `stock-out-${res.syncedProduct.id}-${new Date().toISOString().slice(0, 10)}`,
              eventType: "out_of_stock_alert",
              subject: `[OUT OF STOCK] ${res.syncedProduct.title}`,
              html: wrapRangoEmailTemplate(
                "Out of Stock Alert",
                "INVENTORY CRITICAL",
                `<p>Product <strong>${res.syncedProduct.title}</strong> now has <strong>0 units</strong> remaining.</p>`
              ),
              db,
            });
          } else if (currentStk <= lowThresh) {
            await dispatchNotification({
              eventKey: `stock-low-${res.syncedProduct.id}-${new Date().toISOString().slice(0, 10)}`,
              eventType: "low_stock_alert",
              subject: `[LOW STOCK: ${currentStk} left] ${res.syncedProduct.title}`,
              html: wrapRangoEmailTemplate(
                "Low Stock Alert",
                "INVENTORY WARNING",
                `<p>Product <strong>${res.syncedProduct.title}</strong> is low on stock (${currentStk} remaining, threshold: ${lowThresh}).</p>`
              ),
              db,
            });
          }
        }

        db = withAudit(
          db,
          session,
          "Inventory",
          `Stock ${adjustType} (${delta >= 0 ? "+" : ""}${delta}) for ${productId}`,
          reason
        );
        break;
      }

      case "upsert_product": {
        if (!hasRolePermission(session.role, "products", db.roles)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const prod = body.product as Product & ProductAdminExtended;
        const isExistingBase = getMergedCatalogProducts({
          ...db,
          customProducts: [],
        }).some((p) => p.id === prod.id);

        if (isExistingBase) {
          db.productOverrides = {
            ...(db.productOverrides || {}),
            [prod.id]: prod,
          };
        } else {
          const existsCustom = (db.customProducts || []).some(
            (p) => p.id === prod.id
          );
          if (existsCustom) {
            db.customProducts = db.customProducts.map((p) =>
              p.id === prod.id ? prod : p
            );
          } else {
            db.customProducts = [prod, ...(db.customProducts || [])];
          }
        }
        void syncProductToSupabase(prod as unknown as Record<string, unknown>);
        db = withAudit(
          db,
          session,
          "Products",
          `${isExistingBase ? "Updated" : "Saved"} product "${prod.title}" (${prod.id})`
        );
        break;
      }

      case "bulk_products": {
        if (!hasRolePermission(session.role, "products", db.roles)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const ids = (body.productIds || []) as string[];
        const op = String(body.operation || "");
        const value = Number(body.value || 0);
        const catalog = getMergedCatalogProducts(db);

        if (op === "delete") {
          const delSet = new Set([...(db.deletedProductIds || []), ...ids]);
          db.deletedProductIds = Array.from(delSet);
          db.customProducts = (db.customProducts || []).filter(
            (p) => !delSet.has(p.id)
          );
        } else {
          for (const id of ids) {
            const p = catalog.find((item) => item.id === id);
            if (!p) continue;
            let nextPrice = p.price;
            let nextOriginal = p.originalPrice || p.price;
            let nextDiscount = p.discount || 0;
            let nextStock = typeof p.stock === "number" ? p.stock : 10;

            if (op === "price_percent") {
              nextPrice = Math.max(1, Math.round(p.price * (1 + value / 100)));
              nextOriginal = Math.max(nextPrice, nextOriginal);
              nextDiscount =
                nextOriginal > nextPrice
                  ? Math.round(((nextOriginal - nextPrice) / nextOriginal) * 100)
                  : 0;
            } else if (op === "discount_percent") {
              nextDiscount = Math.min(90, Math.max(0, value));
              nextPrice = Math.max(
                1,
                Math.round(nextOriginal * (1 - nextDiscount / 100))
              );
            } else if (op === "set_stock") {
              nextStock = Math.max(0, value);
            }

            const updatedFields = {
              price: nextPrice,
              originalPrice: nextOriginal,
              discount: nextDiscount,
              stock: nextStock,
              isStockOut: nextStock <= 0,
            };

            const isCustom = (db.customProducts || []).some((c) => c.id === id);
            if (isCustom) {
              db.customProducts = db.customProducts.map((c) =>
                c.id === id ? { ...c, ...updatedFields } : c
              );
            } else {
              db.productOverrides = {
                ...(db.productOverrides || {}),
                [id]: { ...(db.productOverrides?.[id] || {}), ...updatedFields },
              };
            }
          }
        }
        db = withAudit(
          db,
          session,
          "Products",
          `Bulk action '${op}' applied to ${ids.length} products`
        );
        break;
      }

      case "record_financial_entry": {
        if (!hasRolePermission(session.role, "acc-overview", db.roles)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const entry = body.entry as Omit<
          FinancialTransaction,
          "id" | "actor" | "createdAt"
        >;
        const tx: FinancialTransaction = {
          id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          date: entry.date || new Date().toISOString().slice(0, 10),
          type: entry.type,
          entryKind: entry.entryKind,
          accountId: entry.accountId,
          category: entry.category,
          amount: Math.max(0, Number(entry.amount || 0)),
          referenceNo: entry.referenceNo,
          orderId: entry.orderId,
          counterparty: entry.counterparty,
          description: entry.description,
          attachmentUrl: entry.attachmentUrl,
          actor: session.email,
          createdAt: new Date().toISOString(),
        };
        const nextTxs = [tx, ...(db.financialTransactions || [])];
        db.financialTransactions = nextTxs;
        db.accounts = recomputeAccountBalances(db.accounts, nextTxs);
        db = withAudit(
          db,
          session,
          "Accounts",
          `Recorded ${tx.entryKind} (${tx.type.toUpperCase()}) ৳${tx.amount.toLocaleString()} — ${tx.category}`
        );
        meta = { transaction: tx };
        break;
      }

      case "record_transfer": {
        if (!hasRolePermission(session.role, "acc-transfers", db.roles)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        db = recordBalancedTransfer(db, {
          fromAccountId: String(body.fromAccountId),
          toAccountId: String(body.toAccountId),
          amount: Number(body.amount || 0),
          date: String(body.date || new Date().toISOString().slice(0, 10)),
          referenceNo: body.referenceNo ? String(body.referenceNo) : undefined,
          description: String(body.description || "Inter-account balance transfer"),
          actor: session.email,
        });
        db = withAudit(
          db,
          session,
          "Accounts",
          `Transferred ৳${Number(body.amount || 0).toLocaleString()} from ${body.fromAccountId} to ${body.toAccountId}`
        );
        break;
      }

      case "upsert_account": {
        if (!hasRolePermission(session.role, "acc-overview", db.roles)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const acc = body.account as FinancialAccount;
        const exists = (db.accounts || []).some((a) => a.id === acc.id);
        const nextAccounts = exists
          ? db.accounts.map((a) => (a.id === acc.id ? acc : a))
          : [...(db.accounts || []), acc];
        db.accounts = recomputeAccountBalances(
          nextAccounts,
          db.financialTransactions || []
        );
        db = withAudit(
          db,
          session,
          "Accounts",
          `${exists ? "Updated" : "Added"} financial account ${acc.name} (${acc.accountType})`
        );
        break;
      }

      case "add_expense_category": {
        if (!hasRolePermission(session.role, "acc-expenses", db.roles)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const catName = String(body.category || "").trim();
        if (catName && !(db.customExpenseCategories || []).includes(catName)) {
          db.customExpenseCategories = [...(db.customExpenseCategories || []), catName];
        }
        db = withAudit(db, session, "Accounts", `Added expense category '${catName}'`);
        break;
      }

      case "update_ap_ar": {
        if (!hasRolePermission(session.role, "acc-overview", db.roles)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        db.accountsPayable = Math.max(0, Number(body.accountsPayable ?? db.accountsPayable));
        db.accountsReceivable = Math.max(
          0,
          Number(body.accountsReceivable ?? db.accountsReceivable)
        );
        db = withAudit(
          db,
          session,
          "Accounts",
          `Updated AP (৳${db.accountsPayable}) / AR (৳${db.accountsReceivable})`
        );
        break;
      }

      case "moderate_review": {
        if (!hasRolePermission(session.role, "reviews", db.roles)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const reviewId = String(body.reviewId || body.id || "");
        const shouldDelete = Boolean(body.delete);
        const existing = (db.reviews || []).find((r) => r.id === reviewId);
        if (!existing) {
          return NextResponse.json({ error: "Review not found." }, { status: 404 });
        }

        if (shouldDelete) {
          db.reviews = (db.reviews || []).filter((r) => r.id !== reviewId);
          db = withAudit(
            db,
            session,
            "Reviews",
            `Deleted customer review ${reviewId} (${existing.userName || existing.customerName || "Customer"})`
          );
        } else {
          const nextStatus = (body.status || existing.status) as "Pending" | "Approved" | "Rejected";
          const updatedReview = {
            ...existing,
            status: nextStatus,
            rating:
              body.rating !== undefined
                ? Math.min(5, Math.max(1, Number(body.rating)))
                : existing.rating,
            title: body.title !== undefined ? String(body.title) : existing.title,
            comment: body.comment !== undefined ? String(body.comment) : existing.comment,
            adminReply:
              body.adminReply !== undefined ? String(body.adminReply) : existing.adminReply,
            isTestData:
              body.isTestData !== undefined ? Boolean(body.isTestData) : existing.isTestData,
            moderatedAt: new Date().toISOString(),
            moderatedBy: session.email,
          };
          db.reviews = (db.reviews || []).map((r) =>
            r.id === reviewId ? updatedReview : r
          );
          void syncReviewToSupabase({
            ...updatedReview,
            userName: updatedReview.userName || updatedReview.customerName || "Customer",
          });
          const refreshedProd = getMergedCatalogProducts(db, { includeReviews: false }).find(
            (p) => p.id === existing.productId
          );
          if (refreshedProd) {
            void syncProductToSupabase(
              refreshedProd as unknown as Record<string, unknown>
            );
          }
          db = withAudit(
            db,
            session,
            "Reviews",
            `Moderated review ${reviewId} on ${existing.productTitle || existing.productId} -> ${nextStatus}`
          );
        }
        break;
      }

      case "add_question": {
        if (!hasRolePermission(session.role, "reviews", db.roles)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const productId = String(body.productId || "");
        const productTitle = String(body.productTitle || "Product");
        const productSlug = String(body.productSlug || "");
        const questionText = String(body.question || "").trim();
        const answerText = String(body.answer || "").trim();
        if (!productId || !questionText) {
          return NextResponse.json({ error: "Product and question are required." }, { status: 400 });
        }
        const newQ = {
          id: `qa-adm-${Date.now()}`,
          productId,
          productSlug,
          productTitle,
          customerName: String(body.customerName || "Rango Customer"),
          userName: String(body.customerName || "Rango Customer"),
          question: questionText,
          answer: answerText || undefined,
          answeredBy: answerText ? "Rango Electronics Specialist" : undefined,
          status: (answerText ? "Answered" : "Pending") as "Answered" | "Pending",
          isTestData: false,
          createdAt: new Date().toISOString(),
          answeredAt: answerText ? new Date().toISOString() : undefined,
        };
        db.productQuestions = [newQ, ...(db.productQuestions || [])];
        db = withAudit(db, session, "Reviews", `Added Q&A for ${productTitle}`);
        break;
      }

      case "moderate_question": {
        if (!hasRolePermission(session.role, "reviews", db.roles)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const questionId = String(body.questionId || body.id || "");
        const shouldDelete = Boolean(body.delete);
        const existing = (db.productQuestions || []).find((q) => q.id === questionId);
        if (!existing) {
          return NextResponse.json({ error: "Question not found." }, { status: 404 });
        }

        if (shouldDelete) {
          db.productQuestions = (db.productQuestions || []).filter(
            (q) => q.id !== questionId
          );
          db = withAudit(
            db,
            session,
            "Reviews",
            `Deleted product Q&A ${questionId}`
          );
        } else {
          const nextStatus = (body.status || existing.status) as "Pending" | "Answered" | "Approved" | "Rejected" | "Hidden";
          const updatedQ = {
            ...existing,
            status: nextStatus,
            isTestData: false,
            question: body.question !== undefined ? String(body.question) : existing.question,
            answer: body.answer !== undefined ? String(body.answer) : existing.answer,
            answeredBy: body.answer ? "Rango Electronics Specialist" : existing.answeredBy,
            answeredAt: body.answer ? new Date().toISOString() : existing.answeredAt,
          };
          db.productQuestions = (db.productQuestions || []).map((q) =>
            q.id === questionId ? updatedQ : q
          );
          db = withAudit(
            db,
            session,
            "Reviews",
            `Updated product Q&A ${questionId} -> ${nextStatus}`
          );
        }
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    writeAdminDb(db);
    const touchesFullCatalogMeta = /review|qna|question/i.test(String(action || ""));
    const payload = await buildAuthenticatedAdminPayload(db, {
      skipRemoteOrders: true,
      compact: !touchesFullCatalogMeta,
    });
    return NextResponse.json({ ...payload, meta });
  } catch (err) {
    console.error("Admin actions POST error:", err);
    return NextResponse.json(
      { error: "Failed to execute administrative action." },
      { status: 400 }
    );
  }
}
