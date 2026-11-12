"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { PRODUCTS, Product } from "@/data/products";
import {
  AdminDatabase,
  AdminOrderRecord,
  AdminTabId,
  ProductAdminExtended,
} from "@/types/admin";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminOverviewTab } from "@/components/admin/AdminOverviewTab";
import { AdminCatalogModule } from "@/components/admin/AdminCatalogModule";
import { AdminSalesModule } from "@/components/admin/AdminSalesModule";
import { AdminInventoryModule } from "@/components/admin/AdminInventoryModule";
import { AdminAccountsModule } from "@/components/admin/AdminAccountsModule";
import { AdminMarketingModule } from "@/components/admin/AdminMarketingModule";
import { AdminSupportWebsiteSystemModule } from "@/components/admin/AdminSupportWebsiteSystemModule";
import { AdminLandingBuilderModule } from "@/components/admin/AdminLandingBuilderModule";

export type UnifiedAdminOrder = AdminOrderRecord;
export type { ProductAdminExtended };

type ExtendedAdminDbPayload = AdminDatabase & {
  liveOrders?: AdminOrderRecord[];
  isCompactPayload?: boolean;
  reviewsTotalCount?: number;
  qnaTotalCount?: number;
};

function mergeCompactAdminResponse(
  prev: ExtendedAdminDbPayload | null,
  next: ExtendedAdminDbPayload
): ExtendedAdminDbPayload {
  if (!prev || !next?.isCompactPayload) return next;
  return {
    ...next,
    reviews:
      prev.reviews && prev.reviews.length > (next.reviews?.length || 0)
        ? prev.reviews
        : next.reviews,
    productQuestions:
      prev.productQuestions &&
      prev.productQuestions.length > (next.productQuestions?.length || 0)
        ? prev.productQuestions
        : next.productQuestions,
    isCompactPayload:
      prev.isCompactPayload === false ? false : next.isCompactPayload,
  };
}

const QUICK_JUMP_ITEMS: { label: string; category: string; tab: AdminTabId }[] = [
  { label: "Dashboard Overview & 17 KPIs", category: "Overview", tab: "overview" },
  { label: "Orders Management", category: "Sales", tab: "orders" },
  { label: "Payment Verification & History", category: "Sales", tab: "payments" },
  { label: "Auto & Manual Invoices", category: "Sales", tab: "invoices" },
  { label: "Courier Booking (Pathao / Steadfast / RedX)", category: "Sales", tab: "courier" },
  { label: "All Products", category: "Catalog", tab: "products" },
  { label: "Add New Product (12 Sections)", category: "Catalog", tab: "add-product" },
  { label: "Categories & Brands", category: "Catalog", tab: "categories" },
  { label: "Inventory Overview & Valuation", category: "Inventory", tab: "inv-overview" },
  { label: "Low Stock Alerts", category: "Inventory", tab: "inv-alerts" },
  { label: "Coupons & Vouchers", category: "Marketing", tab: "coupons" },
  { label: "Banners & Sliders", category: "Marketing", tab: "banners" },
  { label: "Promotional Popups", category: "Marketing", tab: "popups" },
  { label: "Meta Pixel & Conversions API", category: "Marketing", tab: "meta-pixel" },
  { label: "Google Tag Manager & GA4", category: "Marketing", tab: "gtm" },
  { label: "Customers Directory", category: "Support", tab: "customers" },
  { label: "Contact Inquiries Inbox", category: "Support", tab: "inquiries" },
  { label: "Chatbot Inbox & FAQs", category: "Support", tab: "chatbot" },
  { label: "Accounts Overview & Balances", category: "Finance", tab: "acc-overview" },
  { label: "Income & Expense Ledger", category: "Finance", tab: "acc-income" },
  { label: "Inter-Account Transfers", category: "Finance", tab: "acc-transfers" },
  { label: "P&L / Financial Reports (PDF/Excel/CSV)", category: "Finance", tab: "acc-reports" },
  { label: "Product Landing Pages Builder", category: "Website", tab: "landing-pages" },
  { label: "Website Pages (CMS)", category: "Website", tab: "cms" },
  { label: "EMI Banks & Rates", category: "Website", tab: "emi" },
  { label: "Admin Users & 6 Roles Matrix", category: "System", tab: "users" },
  { label: "Global Store Settings", category: "System", tab: "settings" },
];

export default function EnterpriseAdminDashboardPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [adminUser, setAdminUser] = useState<{
    email: string;
    role: string;
    name?: string;
  } | null>(null);
  const [adminDb, setAdminDb] = useState<ExtendedAdminDbPayload | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTabId>("overview");
  const [quickIntent, setQuickIntent] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleNavigate = useCallback((tab: AdminTabId, intent?: string) => {
    setActiveTab(tab);
    setQuickIntent(intent || null);
  }, []);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const notify = (text: string, type: "ok" | "err" = "ok") => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAdminStore = useCallback(async (forceRefresh = false) => {
    setSyncing(true);
    try {
      const url = forceRefresh ? "/api/admin/store?refresh=1" : "/api/admin/store";
      const res = await fetch(url, { cache: "no-store" });
      if (res.status === 401) {
        setAdminUser(null);
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as ExtendedAdminDbPayload;
        setAdminDb(data);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("rango-runtime-refresh"));
        }
        if (data.isCompactPayload) {
          void fetch("/api/admin/store?full=1", { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : null))
            .then((fullData: ExtendedAdminDbPayload | null) => {
              if (fullData) {
                setAdminDb((prev) =>
                  prev
                    ? {
                        ...prev,
                        reviews: fullData.reviews || prev.reviews,
                        productQuestions: fullData.productQuestions || prev.productQuestions,
                        isCompactPayload: false,
                      }
                    : fullData
                );
              }
            })
            .catch(() => {});
        }
      }
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/auth", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (active && json.authenticated) {
            setAdminUser({ email: json.email, role: json.role, name: json.name });
            await loadAdminStore();
          }
        }
      } finally {
        if (active) setAuthChecked(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [loadAdminStore]);

  const handlePersistPatch = async (
    section: string,
    permissionKey: string,
    actionDescription: string,
    patch: Partial<AdminDatabase>
  ): Promise<boolean> => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, permissionKey, actionDescription, patch }),
      });
      const json = await res.json();
      if (!res.ok) {
        notify(json.error || "Failed to save changes", "err");
        return false;
      }
      setAdminDb((prev) => mergeCompactAdminResponse(prev, json));
      window.dispatchEvent(new Event("rango-runtime-refresh"));
      notify(actionDescription || "Saved successfully");
      return true;
    } catch {
      notify("Network error while saving changes", "err");
      return false;
    } finally {
      setSyncing(false);
    }
  };

  const handleAction = async (
    action: string,
    payload: Record<string, unknown>,
    successMsg?: string,
    onSuccessMeta?: (meta: Record<string, any>) => void
  ): Promise<boolean> => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const json = await res.json();
      if (!res.ok) {
        notify(json.error || "Action failed", "err");
        return false;
      }
      setAdminDb((prev) => mergeCompactAdminResponse(prev, json));
      if (onSuccessMeta && json?.meta) {
        onSuccessMeta(json.meta);
      }
      window.dispatchEvent(new Event("rango-runtime-refresh"));
      const emailNotice = json?.meta?.message;
      notify(emailNotice || successMsg || "Updated successfully");
      return true;
    } catch {
      notify("Network error during action", "err");
      return false;
    } finally {
      setSyncing(false);
    }
  };

  const handleCourierAction = async (
    payload: Record<string, unknown>,
    successMsg?: string
  ): Promise<boolean> => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/courier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        notify(json.error || "Courier request failed", "err");
        return false;
      }
      setAdminDb((prev) => mergeCompactAdminResponse(prev, json));
      notify(json.notice || successMsg || "Courier booking updated");
      return true;
    } catch {
      notify("Courier API error", "err");
      return false;
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setAdminUser(null);
    setAdminDb(null);
  };

  const mergedProducts: (Product & ProductAdminExtended)[] = useMemo(() => {
    if (!adminDb) return PRODUCTS;
    const deleted = new Set(adminDb.deletedProductIds || []);
    const overrides = adminDb.productOverrides || {};
    const base = PRODUCTS.filter((p) => !deleted.has(p.id)).map((p) =>
      overrides[p.id] ? { ...p, ...overrides[p.id] } : p
    );
    const custom = (adminDb.customProducts || []).filter((p) => !deleted.has(p.id));
    return [...custom, ...base];
  }, [adminDb]);

  const unifiedOrders: AdminOrderRecord[] = useMemo(() => {
    const serverOrders = adminDb?.liveOrders || [];
    const map = new Map<string, AdminOrderRecord>();
    for (const o of serverOrders) {
      map.set(o.id, o);
    }
    // Also merge any customer browser localStorage orders if not yet on server
    if (typeof window !== "undefined") {
      try {
        const stored: any[] = JSON.parse(localStorage.getItem("rango_orders") || "[]");
        for (const o of stored) {
          if (!map.has(o.id)) {
            const ov = adminDb?.orderOverrides?.[o.id];
            map.set(o.id, {
              ...o,
              paymentStatus: ov?.paymentStatus || o.paymentStatus || "Unpaid",
              status: ov?.status || o.status || "Pending",
              courier: ov?.courier || o.courier,
              trackingNo: ov?.trackingNo || o.trackingNo,
              source: "local",
            });
          }
        }
      } catch {}
    }
    return Array.from(map.values());
  }, [adminDb]);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] text-slate-600 text-sm font-bold">
        Initializing Rango Electronics Enterprise Control...
      </div>
    );
  }

  if (!adminUser) {
    return (
      <AdminLogin
        onSuccess={async (u) => {
          setAdminUser(u);
          await loadAdminStore();
        }}
      />
    );
  }

  if (!adminDb) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] text-slate-600 text-sm font-bold">
        Loading Enterprise Storefront, Accounting &amp; Inventory Data...
      </div>
    );
  }

  const pendingOrdersCount = unifiedOrders.filter((o) => o.status === "Pending").length;
  const pendingVerifyCount = unifiedOrders.filter(
    (o) => o.paymentStatus === "Pending Verification"
  ).length;
  const lowStockCount = mergedProducts.filter((p) => {
    const s = typeof p.stock === "number" ? p.stock : 10;
    return s <= Number(adminDb.settings?.lowStockThreshold ?? 5);
  }).length;
  const pendingInqCount = (adminDb.contactInquiries || []).filter(
    (i) => i.status === "Pending"
  ).length;
  const openChatsCount = (adminDb.chatConversations || []).filter(
    (c) => c.status === "Open"
  ).length;
  const pendingReviewsCount = (adminDb.reviews || []).filter(
    (r) => r.status === "Pending"
  ).length;

  const isSalesTab = ["orders", "payments", "invoices", "courier", "tracking"].includes(activeTab);
  const isCatalogTab = [
    "products",
    "add-product",
    "categories",
    "brands",
    "reviews",
    "qna",
  ].includes(activeTab);
  const isInvTab = ["inv-overview", "inv-adjust", "inv-history", "inv-alerts"].includes(
    activeTab
  );
  const isFinanceTab = [
    "acc-overview",
    "acc-income",
    "acc-expenses",
    "acc-debit-credit",
    "acc-ledger",
    "acc-transfers",
    "acc-reports",
  ].includes(activeTab);
  const isMarketingTab = [
    "coupons",
    "offers",
    "banners",
    "popups",
    "meta-pixel",
    "gtm",
  ].includes(activeTab);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#EAF6FF] via-[#F2F7FB] to-[#FFF4E8] text-slate-900 flex print:bg-white print:bg-none print:block"
      style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
    >
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        userRole={adminUser.role}
        roles={adminDb.roles || []}
        badges={{
          orders: pendingOrdersCount,
          payments: pendingVerifyCount,
          "inv-alerts": lowStockCount,
          reviews: pendingReviewsCount,
          inquiries: pendingInqCount,
          chatbot: openChatsCount,
        }}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopbar
          onOpenMobileSidebar={() => setMobileMenuOpen(true)}
          activeTab={activeTab}
          onSelectTab={handleNavigate}
          user={adminUser}
          onLogout={handleLogout}
          onRefresh={() => loadAdminStore(true)}
          syncing={syncing}
          quickSearchItems={QUICK_JUMP_ITEMS}
          notifications={[
            {
              id: "n-ord",
              label: "Pending Orders",
              count: pendingOrdersCount,
              tab: "orders",
              color: "bg-amber-100 text-amber-800",
            },
            {
              id: "n-rev",
              label: "Pending Customer Reviews",
              count: pendingReviewsCount,
              tab: "reviews",
              color: "bg-amber-100 text-amber-800",
            },
            {
              id: "n-pay",
              label: "Payments Awaiting Verification",
              count: pendingVerifyCount,
              tab: "payments",
              color: "bg-orange-100 text-orange-800",
            },
            {
              id: "n-stk",
              label: "Low / Out-of-Stock Products",
              count: lowStockCount,
              tab: "inv-alerts",
              color: "bg-rose-100 text-rose-700",
            },
            {
              id: "n-inq",
              label: "Unread Customer Inquiries",
              count: pendingInqCount,
              tab: "inquiries",
              color: "bg-sky-100 text-[#0084C7]",
            },
            {
              id: "n-chat",
              label: "Open Chatbot Threads",
              count: openChatsCount,
              tab: "chatbot",
              color: "bg-indigo-100 text-indigo-700",
            },
          ]}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {activeTab === "overview" && (
            <AdminOverviewTab
              db={adminDb}
              orders={unifiedOrders}
              products={mergedProducts}
              onNavigate={handleNavigate}
              userName={adminUser.name}
            />
          )}

          {isSalesTab && (
            <AdminSalesModule
              activeTab={activeTab}
              db={adminDb}
              orders={unifiedOrders}
              products={mergedProducts}
              onAction={handleAction}
              onCourierAction={handleCourierAction}
              quickIntent={quickIntent}
              onConsumeQuickIntent={() => setQuickIntent(null)}
            />
          )}

          {isCatalogTab && (
            <AdminCatalogModule
              activeTab={activeTab}
              db={adminDb}
              products={mergedProducts}
              onNavigate={handleNavigate}
              onAction={handleAction}
              onPersistPatch={handlePersistPatch}
              quickIntent={quickIntent}
              onConsumeQuickIntent={() => setQuickIntent(null)}
            />
          )}

          {isInvTab && (
            <AdminInventoryModule
              activeTab={activeTab}
              db={adminDb}
              products={mergedProducts}
              onAction={handleAction}
              onPersistPatch={handlePersistPatch}
            />
          )}

          {isFinanceTab && (
            <AdminAccountsModule
              activeTab={activeTab}
              db={adminDb}
              onAction={handleAction}
            />
          )}

          {isMarketingTab && (
            <AdminMarketingModule
              activeTab={activeTab}
              db={adminDb}
              products={mergedProducts}
              onAction={handleAction}
              onPersistPatch={handlePersistPatch}
            />
          )}

          {activeTab === "landing-pages" && (
            <AdminLandingBuilderModule
              db={adminDb}
              products={mergedProducts}
              onPersistPatch={handlePersistPatch}
            />
          )}

          {!isSalesTab &&
            !isCatalogTab &&
            !isInvTab &&
            !isFinanceTab &&
            !isMarketingTab &&
            activeTab !== "overview" &&
            activeTab !== "landing-pages" && (
              <AdminSupportWebsiteSystemModule
                activeTab={activeTab}
                db={adminDb}
                orders={unifiedOrders}
                userRole={adminUser.role}
                onPersistPatch={handlePersistPatch}
                onSyncResponse={(nextPayload, text) => {
                  setAdminDb(nextPayload);
                  if (text) notify(text);
                }}
              />
            )}
        </main>
      </div>

      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-2xl border flex items-center gap-2.5 text-xs font-extrabold print:hidden ${
            toast.type === "err"
              ? "bg-rose-900 border-rose-700 text-white"
              : "bg-slate-900 border-slate-700 text-white"
          }`}
        >
          {toast.type === "err" ? (
            <AlertCircle className="size-4 text-rose-400" />
          ) : (
            <CheckCircle2 className="size-4 text-emerald-400" />
          )}
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  );
}
