import { NextRequest, NextResponse } from "next/server";
import {
  getAdminSessionFromRequest,
  hasRolePermission,
} from "@/lib/adminAuth";
import {
  appendAuditLog,
  getAdminDbStatKey,
  readAdminDb,
  readAdminDbCached,
  syncCategoryToSupabase,
  syncProductToSupabase,
  writeAdminDb,
} from "@/lib/adminDb";
import {
  buildAuthenticatedAdminPayload,
  getMergedCatalogProducts,
  toCardProduct,
} from "@/lib/adminServerHelpers";
import { recomputeAccountBalances } from "@/lib/accountingEngine";
import { readServerSecrets, writeServerSecrets } from "@/lib/serverSecrets";
import { dispatchNotification, wrapRangoEmailTemplate } from "@/lib/notifications";
import { AdminDatabase } from "@/types/admin";

function buildPublicRuntimePayload(db: AdminDatabase) {
  return {
    coupons: (db.coupons || [])
      .filter((c) => c.active)
      .map(({ usageByCustomer: _u, ...safeCoupon }) => safeCoupon),
    offers: (db.offers || []).filter((o) => o.active),
    landingPages: (db.landingPages || [])
      .filter((lp) => lp.published)
      .map((lp) => ({ id: lp.id, slug: lp.slug, title: lp.title, productId: lp.productId, seoTitle: lp.seoTitle })),
    banners: (db.banners || []).filter((b) => b.active),
    popups: (db.popups || []).filter((p) => p.active),
    tracking: {
      metaPixelId: db.trackingSettings?.metaPixelId || "",
      metaPixelEnabled: Boolean(db.trackingSettings?.metaPixelEnabled),
      metaCapiEnabled: Boolean(db.trackingSettings?.metaCapiEnabled),
      gtmContainerId: db.trackingSettings?.gtmContainerId || "",
      gtmEnabled: Boolean(db.trackingSettings?.gtmEnabled),
      ga4MeasurementId: db.trackingSettings?.ga4MeasurementId || "",
      consentRequired: Boolean(db.trackingSettings?.consentRequired),
      metaEvents: db.trackingSettings?.metaEvents || [],
    },
    emiBanks: (db.emiBanks || []).filter((b) => b.enabled),
    emiRates: db.emiRates || [],
    policies: Object.fromEntries(
      Object.entries(db.policies || {}).filter(([, p]) => p.published !== false)
    ),
    chatbotFaqs: (db.chatbotFaqs || []).filter((f) => f.active),
    paymentChannels: (db.paymentChannels || []).filter((ch) => ch.enabled),
    products: getMergedCatalogProducts(db, { includeReviews: false })
      .filter((p) => p.status !== "draft" && p.status !== "archived")
      .map(toCardProduct),
    categories: (db.categories || [])
      .filter((c) => c.active !== false)
      .sort((a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99))
      .map((c) => ({
        ...c,
        subcategories: (c.subcategories || [])
          .filter((s) => s.active !== false)
          .sort((a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99)),
      })),
    brands: (db.brands || []).filter((b) => b.active !== false),
    productModeration: db.productModeration || {},
    settings: {
      storeName: db.settings.storeName,
      logoUrl: db.settings.logoUrl,
      faviconUrl: db.settings.faviconUrl,
      hotlinePrimary: db.settings.hotlinePrimary,
      hotlineSecondary: db.settings.hotlineSecondary,
      whatsappNumber: db.settings.whatsappNumber,
      supportEmail: db.settings.supportEmail,
      officeAddress: db.settings.officeAddress,
      currencySymbol: db.settings.currencySymbol,
      insideDhakaShipping: db.settings.insideDhakaShipping,
      outsideDhakaShipping: db.settings.outsideDhakaShipping,
      freeDeliveryThreshold: db.settings.freeDeliveryThreshold,
      emiMinAmount: db.settings.emiMinAmount,
      defaultVatPercent: db.settings.defaultVatPercent,
      seoDefaultTitle: db.settings.seoDefaultTitle,
      seoDefaultDescription: db.settings.seoDefaultDescription,
      googleSiteVerification: db.settings.googleSiteVerification || "",
      socialLinks: db.settings.socialLinks,
      homepageSections: db.settings.homepageSections,
      chatbotGreeting: db.settings.chatbotGreeting,
    },
  };
}

let cachedPublicRuntime: { key: string; json: string } | null = null;

export async function GET(req: NextRequest) {
  const scope = req.nextUrl.searchParams.get("public");

  if (scope === "runtime" || scope === "coupons") {
    const statKey = getAdminDbStatKey();
    if (cachedPublicRuntime && cachedPublicRuntime.key === statKey) {
      return new NextResponse(cachedPublicRuntime.json, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "public, max-age=15, stale-while-revalidate=60",
        },
      });
    }
    const db = readAdminDbCached();
    const json = JSON.stringify(buildPublicRuntimePayload(db));
    cachedPublicRuntime = { key: getAdminDbStatKey(), json };
    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=15, stale-while-revalidate=60",
      },
    });
  }

  const session = getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const forceRemote = req.nextUrl.searchParams.get("refresh") === "1";
  const full = req.nextUrl.searchParams.get("full") === "1";
  const db = readAdminDbCached();
  const payload = await buildAuthenticatedAdminPayload(db, {
    forceRemote,
    compact: !full,
  });
  return NextResponse.json(payload);
}

export async function PATCH(req: NextRequest) {
  const session = getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const section = String(body.section || "General");
    const permissionKey = String(body.permissionKey || "settings");
    const actionDescription = String(
      body.actionDescription || `Updated ${section}`
    );
    const patch = (body.patch || {}) as Partial<AdminDatabase>;

    const current = readAdminDb();
    if (!hasRolePermission(session.role, permissionKey, current.roles)) {
      return NextResponse.json(
        { error: `Role '${session.role}' does not have permission to edit ${section}.` },
        { status: 403 }
      );
    }

    // Protect server-managed ledger, user hashes & audit trail from blind overwrites
    const {
      adminUsers: _users,
      recordedPaymentOrderIds: _recIds,
      stockDeductedOrderIds: _stkIds,
      auditLogs: _logs,
      ...allowedPatch
    } = patch;

    const merged: AdminDatabase = {
      ...current,
      ...allowedPatch,
      settings: allowedPatch.settings
        ? {
            ...current.settings,
            ...allowedPatch.settings,
            smtpSettings: allowedPatch.settings.smtpSettings
              ? {
                  ...current.settings.smtpSettings,
                  ...allowedPatch.settings.smtpSettings,
                }
              : current.settings.smtpSettings,
          }
        : current.settings,
      trackingSettings: allowedPatch.trackingSettings
        ? { ...current.trackingSettings, ...allowedPatch.trackingSettings }
        : current.trackingSettings,
    };

    if (body.secrets && typeof body.secrets === "object") {
      const secrets = readServerSecrets();
      const s = body.secrets as {
        smtpPassword?: string;
        resendApiKey?: string;
        googleClientId?: string;
        googleClientSecret?: string;
      };
      if (s.smtpPassword && !String(s.smtpPassword).includes("••")) {
        secrets.smtpPassword = String(s.smtpPassword).trim();
      }
      if (s.resendApiKey && !String(s.resendApiKey).includes("••")) {
        secrets.resendApiKey = String(s.resendApiKey).trim();
      }
      if (s.googleClientId !== undefined && !String(s.googleClientId).includes("••")) {
        secrets.googleClientId = String(s.googleClientId).trim() || undefined;
      }
      if (s.googleClientSecret !== undefined && !String(s.googleClientSecret).includes("••")) {
        secrets.googleClientSecret = String(s.googleClientSecret).trim() || undefined;
      }
      writeServerSecrets(secrets);
    }

    if (allowedPatch.accounts || allowedPatch.financialTransactions) {
      merged.accounts = recomputeAccountBalances(
        merged.accounts,
        merged.financialTransactions
      );
    }

    // If Super Admin edited roles matrix explicitly, keep Super Admin unrestricted
    if (allowedPatch.roles && session.role === "Super Admin") {
      merged.roles = allowedPatch.roles.map((r) =>
        r.name === "Super Admin" ? { ...r, permissions: ["*"] } : r
      );
    } else {
      merged.roles = current.roles;
    }

    const logged = appendAuditLog(
      merged,
      session.email,
      section,
      actionDescription,
      session.role
    );
    writeAdminDb(logged);
    cachedPublicRuntime = null;

    // Best-effort non-blocking sync to Supabase so admin UI saves stay super fast
    if (Array.isArray(allowedPatch.customProducts) && allowedPatch.customProducts[0]) {
      void syncProductToSupabase(
        allowedPatch.customProducts[0] as unknown as Record<string, unknown>
      );
    }
    if (Array.isArray(allowedPatch.categories)) {
      void Promise.allSettled(
        allowedPatch.categories.map((cat) => syncCategoryToSupabase(cat))
      );
    }

    const payload = await buildAuthenticatedAdminPayload(logged, {
      skipRemoteOrders: true,
      compact: true,
    });
    return NextResponse.json(payload);
  } catch (err) {
    console.error("Admin store PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to persist admin changes." },
      { status: 400 }
    );
  }
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
    if (!hasRolePermission(session.role, "settings", db.roles)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (action === "send_test_email") {
      const targetEmail = String(
        body.toEmail ||
          db.settings?.smtpSettings?.adminNotificationEmail ||
          "electronics.rango@gmail.com"
      ).trim();
      const res = await dispatchNotification({
        eventKey: `test-email-${Date.now()}`,
        eventType: "system_test",
        subject: "[Test Email] Rango Electronics Notification System Verified",
        html: wrapRangoEmailTemplate(
          "Email Notification System Test",
          "TEST VERIFICATION",
          `<p>This is a live test email from <strong>Rango Electronics Admin Dashboard</strong>.</p><p>Triggered by: ${session.email}<br/>Target: ${targetEmail}<br/>Timestamp: ${new Date().toLocaleString("en-GB")}</p>`
        ),
        notifyAdmin: true,
        customerEmail: targetEmail !== (db.settings?.smtpSettings?.adminNotificationEmail || "electronics.rango@gmail.com") ? targetEmail : undefined,
        customerSubject: "Test Email — Rango Electronics",
        db,
      });
      const logged = appendAuditLog(
        db,
        session.email,
        "Settings",
        `Triggered test email to ${targetEmail} (${res.adminLog?.status || "logged"})`,
        session.role
      );
      writeAdminDb(logged);
    cachedPublicRuntime = null;
      const payload = await buildAuthenticatedAdminPayload(logged);
      return NextResponse.json({ ...payload, emailResult: res });
    }

    return NextResponse.json({ error: "Unknown store POST action." }, { status: 400 });
  } catch (err) {
    console.error("Admin store POST error:", err);
    return NextResponse.json({ error: "Action failed." }, { status: 400 });
  }
}
