import { PRODUCTS, Product } from "@/data/products";
import {
  AdminDatabase,
  AdminInvoiceRecord,
  AdminOrderRecord,
  OrderStatus,
  ProductAdminExtended,
  StockMovementRecord,
} from "@/types/admin";
import {
  appendAuditLog,
  fetchAllOrdersUnified,
  syncProductToSupabase,
} from "@/lib/adminDb";
import {
  getGoogleOAuthConfig,
  getMaskedCourierSummary,
  hasCourierCredentials,
  maskSecret,
  readServerSecrets,
} from "@/lib/serverSecrets";
import {
  dispatchNotification,
  wrapRangoEmailTemplate,
} from "@/lib/notifications";

export function toCardProduct(
  p: Product & ProductAdminExtended
): Product & ProductAdminExtended {
  const firstImage = p.thumbnail || p.images?.[0] || "/logo.png";
  return {
    ...p,
    description: "",
    specifications: [],
    emiPlans: [],
    qna: [],
    reviews: [],
    images: firstImage ? [firstImage] : [],
  };
}

export function sanitizeAdminDbForClient(
  db: AdminDatabase,
  options: { compact?: boolean } = {}
) {
  const secrets = readServerSecrets();
  const googleCfg = getGoogleOAuthConfig();
  const allReviews = db.reviews || [];
  const allQuestions = db.productQuestions || [];

  const compactReviews = options.compact
    ? [
        ...allReviews.filter((r) => r.status === "Pending"),
        ...allReviews.filter((r) => r.status !== "Pending"),
      ].slice(0, 150)
    : allReviews;

  const compactQuestions = options.compact
    ? [
        ...allQuestions.filter((q) => q.status === "Pending"),
        ...allQuestions.filter((q) => q.status !== "Pending"),
      ].slice(0, 100)
    : allQuestions;

  return {
    ...db,
    reviews: compactReviews,
    productQuestions: compactQuestions,
    ...(options.compact
      ? {
          isCompactPayload: true,
          reviewsTotalCount: allReviews.length,
          qnaTotalCount: allQuestions.length,
        }
      : {
          isCompactPayload: false,
          reviewsTotalCount: allReviews.length,
          qnaTotalCount: allQuestions.length,
        }),
    adminUsers: (db.adminUsers || []).map(({ passwordHash: _pw, ...safeUser }) => safeUser),
    customerUsers: (db.customerUsers || []).map(({ passwordHash: _cpw, ...safeCust }) => safeCust),
    couriers: (db.couriers || []).map((c) => ({
      ...c,
      hasCredentials: hasCourierCredentials(c.id),
      maskedSummary: getMaskedCourierSummary(c.id),
    })),
    settings: {
      ...db.settings,
      googleOAuthStatus: {
        configured: Boolean(googleCfg.clientId && googleCfg.clientSecret),
        maskedClientId: googleCfg.clientId ? maskSecret(googleCfg.clientId) : "",
        hasSecret: Boolean(googleCfg.clientSecret),
      },
      smtpSettings: {
        ...(db.settings?.smtpSettings || {}),
        hasSmtpPassword: Boolean(secrets.smtpPassword || process.env.SMTP_PASS || process.env.EMAIL_APP_PASSWORD),
        hasResendKey: Boolean(secrets.resendApiKey || process.env.RESEND_API_KEY),
      },
    },
  };
}

export async function buildAuthenticatedAdminPayload(
  db: AdminDatabase,
  options: { forceRemote?: boolean; skipRemoteOrders?: boolean; compact?: boolean } = {}
) {
  const liveOrders = await fetchAllOrdersUnified(db, options);
  return {
    ...sanitizeAdminDbForClient(db, { compact: options.compact }),
    liveOrders,
  };
}

export function getMergedCatalogProducts(
  db: AdminDatabase,
  options: { includeReviews?: boolean } = {}
): (Product & ProductAdminExtended)[] {
  const includeReviews = options.includeReviews !== false;
  const deleted = new Set(db.deletedProductIds || []);
  const overrides = db.productOverrides || {};
  const reviewStatsByProduct = new Map<string, { count: number; sum: number }>();
  const reviewsByProduct = new Map<string, AdminDatabase["reviews"]>();

  for (const rev of db.reviews || []) {
    if (rev.status === "Approved" && !rev.isTestData) {
      const prev = reviewStatsByProduct.get(rev.productId) || { count: 0, sum: 0 };
      prev.count += 1;
      prev.sum += Number(rev.rating || 5);
      reviewStatsByProduct.set(rev.productId, prev);
      if (includeReviews) {
        const list = reviewsByProduct.get(rev.productId) || [];
        list.push(rev);
        reviewsByProduct.set(rev.productId, list);
      }
    }
  }

  const enrichWithDynamicReviews = (
    p: Product & ProductAdminExtended
  ): Product & ProductAdminExtended => {
    const stats = reviewStatsByProduct.get(p.id);
    const count = stats?.count || 0;
    const avgRating =
      count > 0 ? Number(((stats!.sum || 0) / count).toFixed(1)) : 0;
    if (!includeReviews) {
      return {
        ...p,
        reviewsCount: count,
        rating: avgRating,
        reviews: [],
      };
    }
    const approved = reviewsByProduct.get(p.id) || [];
    return {
      ...p,
      reviewsCount: count,
      rating: avgRating,
      reviews: approved.map((r) => ({
        id: r.id,
        userName: r.userName || r.customerName || "Verified Buyer",
        userLocation: r.customerLocation || "Bangladesh",
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        images: r.images,
        adminReply: r.adminReply,
        date: new Date(r.createdAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        verified: Boolean(r.verifiedPurchase),
      })),
    };
  };

  const base = PRODUCTS.filter((p) => !deleted.has(p.id)).map((p) => {
    const ov = overrides[p.id];
    if (!ov) return enrichWithDynamicReviews(p);
    return enrichWithDynamicReviews({
      ...p,
      ...ov,
      thumbnail: ov.thumbnail || p.thumbnail,
      images: ov.images && ov.images.length > 0 ? ov.images : p.images,
      specifications:
        ov.specifications && ov.specifications.length > 0
          ? ov.specifications
          : p.specifications,
    });
  });

  const custom = (db.customProducts || [])
    .filter((p) => !deleted.has(p.id))
    .map((p) => {
      const ov = overrides[p.id];
      return enrichWithDynamicReviews(ov ? { ...p, ...ov } : p);
    });

  return [...custom, ...base];
}

export function resolveSingleProductFast(
  db: AdminDatabase,
  slugParam: string
): {
  product: Product & ProductAdminExtended;
  initialReviews: NonNullable<Product["reviews"]>;
  initialQuestions: Array<{
    id: string;
    userName: string;
    date: string;
    question: string;
    answer: string;
    answeredBy: string;
  }>;
} | null {
  const slug = decodeURIComponent(slugParam).toLowerCase();
  const deleted = new Set(db.deletedProductIds || []);

  let rawProd: (Product & ProductAdminExtended) | undefined = (
    db.customProducts || []
  ).find(
    (p) =>
      !deleted.has(p.id) &&
      (p.slug.toLowerCase() === slug || p.id.toLowerCase() === slug)
  );

  let isCustom = Boolean(rawProd);
  if (!rawProd) {
    rawProd = PRODUCTS.find(
      (p) =>
        !deleted.has(p.id) &&
        (p.slug.toLowerCase() === slug || p.id.toLowerCase() === slug)
    );
    isCustom = false;
  }

  if (!rawProd) return null;

  const ov = (db.productOverrides || {})[rawProd.id];
  const mergedBase: Product & ProductAdminExtended = ov
    ? {
        ...rawProd,
        ...ov,
        thumbnail: ov.thumbnail || rawProd.thumbnail,
        images: ov.images && ov.images.length > 0 ? ov.images : rawProd.images,
        specifications:
          ov.specifications && ov.specifications.length > 0
            ? ov.specifications
            : rawProd.specifications,
      }
    : rawProd;

  if (!isCustom && mergedBase.status && mergedBase.status !== "published") {
    // Only filter explicitly unpublished/draft if flagged on override, preserve default published state
  }

  const approvedRevs = (db.reviews || [])
    .filter(
      (r) =>
        r.productId === mergedBase.id &&
        r.status === "Approved" &&
        !r.isTestData
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

  const avgRating =
    approvedRevs.length > 0
      ? Number(
          (
            approvedRevs.reduce((sum, r) => sum + Number(r.rating || 5), 0) /
            approvedRevs.length
          ).toFixed(1)
        )
      : 0;

  const initialReviews: NonNullable<Product["reviews"]> = approvedRevs.map((r) => ({
    id: r.id,
    userName: r.userName || r.customerName || "Verified Buyer",
    userLocation: r.customerLocation || "Bangladesh",
    rating: Number(r.rating || 5),
    title: r.title,
    comment: r.comment,
    images: r.images || [],
    adminReply: r.adminReply,
    date: new Date(r.createdAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    verified: Boolean(r.verifiedPurchase),
  }));

  const initialQuestions = (db.productQuestions || [])
    .filter(
      (q) =>
        q.productId === mergedBase.id &&
        (q.status === "Approved" || q.status === "Answered") &&
        !q.isTestData
    )
    .map((q) => ({
      id: q.id,
      userName: q.userName,
      date: new Date(q.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      question: q.question,
      answer: q.answer || "Our technical team is verifying your question.",
      answeredBy: "Rango Electronics Specialist",
    }));

  return {
    product: {
      ...mergedBase,
      reviewsCount: approvedRevs.length,
      rating: avgRating,
      reviews: initialReviews.slice(0, 10),
    },
    initialReviews,
    initialQuestions,
  };
}

export function getProductCurrentStock(
  db: AdminDatabase,
  productId: string
): { product: (Product & ProductAdminExtended) | undefined; currentStock: number } {
  const catalog = getMergedCatalogProducts(db);
  const product = catalog.find((p) => p.id === productId);
  if (!product) return { product: undefined, currentStock: 0 };
  const stock =
    typeof product.stock === "number"
      ? product.stock
      : product.isStockOut
      ? 0
      : 10;
  return { product, currentStock: stock };
}

export function applyProductStockDelta(
  db: AdminDatabase,
  productId: string,
  delta: number,
  type: StockMovementRecord["type"],
  reason: string,
  actor: string,
  referenceId?: string
): { db: AdminDatabase; syncedProduct?: Product & ProductAdminExtended } {
  const { product, currentStock } = getProductCurrentStock(db, productId);
  if (!product) return { db };

  const newStock = Math.max(0, currentStock + delta);
  const isCustom = (db.customProducts || []).some((c) => c.id === productId);

  let nextDb: AdminDatabase = { ...db };
  if (isCustom) {
    nextDb.customProducts = db.customProducts.map((c) =>
      c.id === productId
        ? { ...c, stock: newStock, isStockOut: newStock <= 0 }
        : c
    );
  } else {
    nextDb.productOverrides = {
      ...(db.productOverrides || {}),
      [productId]: {
        ...(db.productOverrides?.[productId] || {}),
        stock: newStock,
        isStockOut: newStock <= 0,
      },
    };
  }

  const movement: StockMovementRecord = {
    id: `stk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    productId,
    productTitle: product.title,
    sku: product.sku || product.model || productId,
    type,
    quantity: Math.abs(delta),
    previousStock: currentStock,
    newStock,
    referenceId,
    reason,
    actor,
    createdAt: new Date().toISOString(),
  };

  nextDb.stockMovements = [movement, ...(db.stockMovements || [])].slice(0, 500);
  const updatedProduct: Product & ProductAdminExtended = {
    ...product,
    stock: newStock,
    isStockOut: newStock <= 0,
  };

  return { db: nextDb, syncedProduct: updatedProduct };
}

const STOCK_COMMITMENT_STATUSES: OrderStatus[] = [
  "Confirmed",
  "Processing",
  "Ready to Ship",
  "Shipped",
  "Dispatched",
  "Out for Delivery",
  "Delivered",
];

const STOCK_RESTORE_STATUSES: OrderStatus[] = ["Cancelled", "Returned"];

/**
 * Idempotently deducts or restores order items' inventory based on configured stockDeductOnStatus.
 */
export async function applyOrderInventoryRules(
  db: AdminDatabase,
  order: AdminOrderRecord,
  newStatus: string,
  actor: string
): Promise<AdminDatabase> {
  let nextDb = { ...db };
  const deductedIds = new Set(nextDb.stockDeductedOrderIds || []);
  const targetStatus = (nextDb.settings?.stockDeductOnStatus || "Confirmed") as OrderStatus;
  const triggerIndex = STOCK_COMMITMENT_STATUSES.indexOf(targetStatus);
  const currentIndex = STOCK_COMMITMENT_STATUSES.indexOf(newStatus as OrderStatus);

  const shouldDeduct =
    currentIndex >= 0 &&
    (triggerIndex === -1 ? true : currentIndex >= triggerIndex);

  const itemsToSync: (Product & ProductAdminExtended)[] = [];

  if (shouldDeduct && !deductedIds.has(order.id)) {
    for (const item of order.items || []) {
      const pid = item.product?.id || item.id;
      const qty = Math.max(1, Number(item.quantity || 1));
      if (!pid) continue;
      const res = applyProductStockDelta(
        nextDb,
        pid,
        -qty,
        "order_deduction",
        `Auto stock deduction for Order #${order.id} (${newStatus})`,
        actor,
        order.id
      );
      nextDb = res.db;
      if (res.syncedProduct) itemsToSync.push(res.syncedProduct);
    }
    deductedIds.add(order.id);
    nextDb.stockDeductedOrderIds = Array.from(deductedIds);
  } else if (
    STOCK_RESTORE_STATUSES.includes(newStatus as OrderStatus) &&
    deductedIds.has(order.id)
  ) {
    for (const item of order.items || []) {
      const pid = item.product?.id || item.id;
      const qty = Math.max(1, Number(item.quantity || 1));
      if (!pid) continue;
      const res = applyProductStockDelta(
        nextDb,
        pid,
        qty,
        "order_restore",
        `Auto stock restored on Order #${order.id} (${newStatus})`,
        actor,
        order.id
      );
      nextDb = res.db;
      if (res.syncedProduct) itemsToSync.push(res.syncedProduct);
    }
    deductedIds.delete(order.id);
    nextDb.stockDeductedOrderIds = Array.from(deductedIds);
  }

  for (const prod of itemsToSync) {
    await syncProductToSupabase(prod as unknown as Record<string, unknown>);
    const lowThresh = Number(nextDb.settings?.lowStockThreshold ?? 5);
    const currentStk = Number(prod.stock ?? 0);
    if (currentStk <= 0) {
      await dispatchNotification({
        eventKey: `stock-out-${prod.id}-${new Date().toISOString().slice(0, 10)}`,
        eventType: "out_of_stock_alert",
        subject: `[OUT OF STOCK] ${prod.title}`,
        html: wrapRangoEmailTemplate(
          "Out of Stock Alert",
          "INVENTORY CRITICAL",
          `<p>Product <strong>${prod.title}</strong> (${prod.sku || prod.id}) has reached <strong>0 units</strong>.</p><p>Please restock or update availability in Rango Electronics Admin.</p>`
        ),
        db: nextDb,
      });
    } else if (currentStk <= lowThresh) {
      await dispatchNotification({
        eventKey: `stock-low-${prod.id}-${new Date().toISOString().slice(0, 10)}`,
        eventType: "low_stock_alert",
        subject: `[LOW STOCK: ${currentStk} left] ${prod.title}`,
        html: wrapRangoEmailTemplate(
          "Low Stock Warning",
          "INVENTORY ALERT",
          `<p>Product <strong>${prod.title}</strong> (${prod.sku || prod.id}) is running low with <strong>${currentStk} units</strong> remaining (threshold: ${lowThresh}).</p>`
        ),
        db: nextDb,
      });
    }
  }

  return nextDb;
}

export function buildInvoiceFromOrder(
  db: AdminDatabase,
  order: AdminOrderRecord
): AdminInvoiceRecord {
  const prefix = db.settings?.invoicePrefix || "INV-RE-";
  const vatPercent = Number(db.settings?.defaultVatPercent || 0);
  const subtotal = Number(order.subtotal || order.total || 0);
  const discount = Number(order.discount || 0);
  const deliveryCharge = Number(order.shipping || 0);
  const taxable = Math.max(0, subtotal - discount);
  const vatAmount = Math.round((taxable * vatPercent) / 100);
  const total = Number(order.total || taxable + vatAmount + deliveryCharge);

  return {
    id: `inv-${order.id}`,
    invoiceNumber: `${prefix}${order.id.replace(/[^A-Z0-9-]/gi, "")}`,
    orderId: order.id,
    invoiceType: "auto",
    sourceChannel: "Website",
    customerName: order.shippingAddress?.fullName || "Customer",
    customerPhone:
      order.shippingAddress?.phone ||
      order.shippingAddress?.phoneNumber ||
      "N/A",
    customerEmail: order.shippingAddress?.email,
    customerAddress: `${order.shippingAddress?.address || ""}, ${
      order.shippingAddress?.city || ""
    }`.replace(/^,\s*|,\s*$/g, ""),
    items: (order.items || []).map((it) => {
      const unitPrice = Number(it.price || it.product?.price || 0);
      const quantity = Math.max(1, Number(it.quantity || 1));
      return {
        productId: it.product?.id || it.id,
        title: it.title || it.product?.title || "Product",
        quantity,
        unitPrice,
        total: unitPrice * quantity,
      };
    }),
    subtotal,
    discount,
    vatPercent,
    vatAmount,
    deliveryCharge,
    total,
    paymentMethod: order.paymentMethod || "Cash On Delivery",
    paymentStatus: order.paymentStatus || "Unpaid",
    createdAt: order.createdAtIso || new Date().toISOString(),
  };
}

export async function dispatchInvoiceEmail(
  invoice: AdminInvoiceRecord,
  storeName: string,
  footerNote?: string,
  db?: AdminDatabase
): Promise<{ sent: boolean; message: string }> {
  if (!invoice.customerEmail) {
    return { sent: false, message: "Customer email address is missing on this invoice." };
  }

  const rowsHtml = invoice.items
    .map(
      (it) => `
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:10px 8px;color:#0f172a;font-weight:600;">${it.title}</td>
        <td style="padding:10px 8px;text-align:center;">${it.quantity}</td>
        <td style="padding:10px 8px;text-align:right;">৳${it.unitPrice.toLocaleString()}</td>
        <td style="padding:10px 8px;text-align:right;font-weight:700;color:#0084C7;">৳${it.total.toLocaleString()}</td>
      </tr>`
    )
    .join("");

  const html = wrapRangoEmailTemplate(
    `${storeName} — Invoice ${invoice.invoiceNumber}`,
    "OFFICIAL TAX & SALES INVOICE",
    `
      <p><strong>Billed To:</strong> ${invoice.customerName} (${invoice.customerPhone})<br/>
      <strong>Address:</strong> ${invoice.customerAddress}<br/>
      <strong>Payment:</strong> ${invoice.paymentMethod} — <strong>${invoice.paymentStatus}</strong></p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px;">
        <thead>
          <tr style="background:#f8fafc;color:#475569;">
            <th style="padding:8px;text-align:left;">Item</th>
            <th style="padding:8px;text-align:center;">Qty</th>
            <th style="padding:8px;text-align:right;">Unit</th>
            <th style="padding:8px;text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div style="text-align:right;font-size:13px;line-height:1.8;">
        <div>Subtotal: ৳${invoice.subtotal.toLocaleString()}</div>
        ${invoice.discount > 0 ? `<div>Discount: -৳${invoice.discount.toLocaleString()}</div>` : ""}
        ${invoice.vatAmount > 0 ? `<div>VAT (${invoice.vatPercent}%): ৳${invoice.vatAmount.toLocaleString()}</div>` : ""}
        <div>Delivery: ৳${invoice.deliveryCharge.toLocaleString()}</div>
        <div style="font-size:18px;font-weight:700;color:#0084C7;">Grand Total: ৳${invoice.total.toLocaleString()}</div>
      </div>
      <p style="margin-top:20px;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:12px;">
        ${footerNote || "Thank you for shopping genuine electronics at Rango Electronics!"}
      </p>
    `
  );

  const result = await dispatchNotification({
    eventKey: `invoice-email-${invoice.invoiceNumber}-${invoice.customerEmail}`,
    eventType: "invoice_generated",
    subject: `[Invoice ${invoice.invoiceNumber}] Dispatched to ${invoice.customerName}`,
    html,
    notifyAdmin: true,
    customerEmail: invoice.customerEmail,
    customerSubject: `Invoice ${invoice.invoiceNumber} — ${storeName}`,
    customerHtml: html,
    db,
  });

  if (result.customerLog?.status === "sent") {
    return { sent: true, message: `Invoice emailed to ${invoice.customerEmail}.` };
  }
  return {
    sent: false,
    message:
      result.customerLog?.error ||
      "Email provider credentials are not configured yet; invoice notification was recorded in Email Logs and PDF/Print remains available.",
  };
}

export function withAudit(
  db: AdminDatabase,
  session: { email: string; role: string },
  section: string,
  action: string,
  details?: string
): AdminDatabase {
  return appendAuditLog(db, session.email, section, action, session.role, details);
}
