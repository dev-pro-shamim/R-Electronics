"use client";

import React, { useMemo, useState } from "react";
import {
  TrendingUp,
  ShoppingCart,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  Users,
  Wallet,
  AlertTriangle,
  PackageX,
  TrendingDown,
  DollarSign,
  Plus,
  FileText,
  ArrowRight,
  Calendar,
  Layers,
  FolderTree,
  Award,
  Tag,
  MessageSquare,
  Boxes,
} from "lucide-react";
import { Product } from "@/data/products";
import {
  AdminDatabase,
  AdminOrderRecord,
  AdminTabId,
} from "@/types/admin";
import { computeFinancialMetrics } from "@/lib/accountingEngine";

interface AdminOverviewTabProps {
  db: AdminDatabase;
  orders: AdminOrderRecord[];
  products: Product[];
  onNavigate: (tab: AdminTabId, intent?: string) => void;
  userName?: string;
}

type DatePreset =
  | "all"
  | "today"
  | "yesterday"
  | "7d"
  | "30d"
  | "this_month"
  | "last_month"
  | "custom";

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  db,
  orders,
  products,
  onNavigate,
  userName,
}) => {
  const [preset, setPreset] = useState<DatePreset>("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const { startKey, endKey } = useMemo(() => {
    const now = new Date();
    const today = toDateKey(now);
    if (preset === "today") return { startKey: today, endKey: today };
    if (preset === "yesterday") {
      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      const yk = toDateKey(y);
      return { startKey: yk, endKey: yk };
    }
    if (preset === "7d") {
      const s = new Date(now);
      s.setDate(now.getDate() - 6);
      return { startKey: toDateKey(s), endKey: today };
    }
    if (preset === "30d") {
      const s = new Date(now);
      s.setDate(now.getDate() - 29);
      return { startKey: toDateKey(s), endKey: today };
    }
    if (preset === "this_month") {
      return { startKey: `${today.slice(0, 7)}-01`, endKey: today };
    }
    if (preset === "last_month") {
      const firstThis = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastPrev = new Date(firstThis.getTime() - 86400000);
      const firstPrev = new Date(lastPrev.getFullYear(), lastPrev.getMonth(), 1);
      return { startKey: toDateKey(firstPrev), endKey: toDateKey(lastPrev) };
    }
    if (preset === "custom") {
      return { startKey: customStart || undefined, endKey: customEnd || undefined };
    }
    return { startKey: undefined, endKey: undefined };
  }, [preset, customStart, customEnd]);

  const todayStr = toDateKey(new Date());
  const thisMonthPrefix = todayStr.slice(0, 7);

  // Filter orders by selected date range
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const d = (o.createdAtIso || todayStr).slice(0, 10);
      if (startKey && d < startKey) return false;
      if (endKey && d > endKey) return false;
      return true;
    });
  }, [orders, startKey, endKey, todayStr]);

  // All 17 KPI metrics
  const kpis = useMemo(() => {
    const validOrders = orders.filter(
      (o) => !["Cancelled", "Returned", "Refunded"].includes(String(o.status))
    );
    const todayOrdersList = orders.filter(
      (o) => (o.createdAtIso || todayStr).slice(0, 10) === todayStr
    );
    const monthOrdersList = validOrders.filter((o) =>
      (o.createdAtIso || todayStr).startsWith(thisMonthPrefix)
    );

    const todaysSales = todayOrdersList.reduce((s, o) => s + Number(o.total || 0), 0);
    const monthlySales = monthOrdersList.reduce((s, o) => s + Number(o.total || 0), 0);
    const finAll = computeFinancialMetrics(db.accounts, db.financialTransactions);
    const finMonth = computeFinancialMetrics(
      db.accounts,
      db.financialTransactions,
      `${thisMonthPrefix}-01`,
      todayStr
    );

    const totalRevenue =
      finAll.totalIncome > 0
        ? finAll.totalIncome
        : validOrders.reduce((s, o) => s + Number(o.total || 0), 0);
    const monthlyRevenue =
      finMonth.totalIncome > 0 ? finMonth.totalIncome : monthlySales;

    const pendingCount = orders.filter((o) => o.status === "Pending").length;
    const processingCount = orders.filter((o) =>
      ["Confirmed", "Processing", "Ready to Ship", "Shipped", "Dispatched", "Out for Delivery"].includes(
        String(o.status)
      )
    ).length;
    const deliveredCount = orders.filter((o) => o.status === "Delivered").length;
    const cancelledCount = orders.filter((o) =>
      ["Cancelled", "Returned"].includes(String(o.status))
    ).length;

    const threshold = Number(db.settings?.lowStockThreshold ?? 5);
    const inventoryValuation = products.reduce((sum, p) => {
      const stk = typeof p.stock === "number" ? p.stock : p.isStockOut ? 0 : 10;
      return sum + stk * Number(p.price || 0);
    }, 0);
    const lowStockCount = products.filter((p) => {
      const stk = typeof p.stock === "number" ? p.stock : p.isStockOut ? 0 : 10;
      return stk > 0 && stk <= threshold;
    }).length;
    const outOfStockCount = products.filter((p) => {
      const stk = typeof p.stock === "number" ? p.stock : p.isStockOut ? 0 : 10;
      return stk <= 0 || p.isStockOut;
    }).length;

    const custKeys = new Set(
      orders.map((o) => o.shippingAddress?.phone || o.shippingAddress?.fullName || o.id)
    );

    return {
      todaysSales,
      todaysOrders: todayOrdersList.length,
      monthlySales,
      monthlyRevenue,
      totalRevenue,
      totalOrders: orders.length,
      pendingCount,
      processingCount,
      deliveredCount,
      cancelledCount,
      totalProducts: products.length,
      totalCustomers: Math.max(custKeys.size, Object.keys(db.customerOverrides || {}).length),
      inventoryValuation,
      lowStockCount,
      outOfStockCount,
      totalExpenses: finAll.totalExpenses,
      netProfit: finAll.netProfit,
    };
  }, [orders, products, db, todayStr, thisMonthPrefix]);

  // Analytics datasets from real orders & transactions
  const analytics = useMemo(() => {
    const byDay = new Map<string, { sales: number; count: number }>();
    const byPayment = new Map<string, number>();
    const byCategory = new Map<string, number>();
    const byBrand = new Map<string, number>();
    const topProductsMap = new Map<
      string,
      { title: string; qty: number; revenue: number }
    >();

    for (const o of filteredOrders) {
      const day = (o.createdAtIso || todayStr).slice(0, 10);
      const prev = byDay.get(day) || { sales: 0, count: 0 };
      byDay.set(day, { sales: prev.sales + Number(o.total || 0), count: prev.count + 1 });

      const pm = (o.paymentMethod || "COD").split("(")[0].trim();
      byPayment.set(pm, (byPayment.get(pm) || 0) + Number(o.total || 0));

      for (const it of o.items || []) {
        const pid = it.product?.id || it.id || it.title || "item";
        const matchedProd = products.find((p) => p.id === pid);
        const cat = matchedProd?.category || "appliances";
        const brand = matchedProd?.brand || "Rango Partner";
        const lineRev =
          Number(it.price || it.product?.price || matchedProd?.price || 0) *
          Math.max(1, Number(it.quantity || 1));

        byCategory.set(cat, (byCategory.get(cat) || 0) + lineRev);
        byBrand.set(brand, (byBrand.get(brand) || 0) + lineRev);

        const prevProd = topProductsMap.get(pid) || {
          title: it.title || it.product?.title || matchedProd?.title || pid,
          qty: 0,
          revenue: 0,
        };
        topProductsMap.set(pid, {
          title: prevProd.title,
          qty: prevProd.qty + Math.max(1, Number(it.quantity || 1)),
          revenue: prevProd.revenue + lineRev,
        });
      }
    }

    const dailySeries = Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-10)
      .map(([date, val]) => ({ label: date.slice(5), ...val }));

    const paymentBreakdown = Array.from(byPayment.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const categorySales = Array.from(byCategory.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const brandSales = Array.from(byBrand.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const topProducts = Array.from(topProductsMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      dailySeries,
      paymentBreakdown,
      categorySales,
      brandSales,
      topProducts,
    };
  }, [filteredOrders, products, todayStr]);

  const maxDailySales = Math.max(
    1,
    ...analytics.dailySeries.map((d) => d.sales)
  );
  const maxCategorySales = Math.max(
    1,
    ...analytics.categorySales.map((c) => c.value)
  );
  const maxBrandSales = Math.max(
    1,
    ...analytics.brandSales.map((b) => b.value)
  );

  const kpiCards = [
    { label: "Today's Sales", value: `৳${kpis.todaysSales.toLocaleString()}`, icon: TrendingUp, accent: "from-sky-500 to-cyan-600", tab: "orders" as AdminTabId },
    { label: "Today's Orders", value: `${kpis.todaysOrders}`, icon: ShoppingCart, accent: "from-indigo-500 to-blue-600", tab: "orders" as AdminTabId },
    { label: "Monthly Sales", value: `৳${kpis.monthlySales.toLocaleString()}`, icon: TrendingUp, accent: "from-cyan-500 to-sky-700", tab: "acc-reports" as AdminTabId },
    { label: "Monthly Revenue", value: `৳${kpis.monthlyRevenue.toLocaleString()}`, icon: Wallet, accent: "from-emerald-500 to-teal-600", tab: "acc-income" as AdminTabId },
    { label: "Total Revenue", value: `৳${kpis.totalRevenue.toLocaleString()}`, icon: DollarSign, accent: "from-emerald-600 to-green-700", tab: "acc-overview" as AdminTabId },
    { label: "Total Orders", value: `${kpis.totalOrders}`, icon: ShoppingCart, accent: "from-blue-600 to-indigo-700", tab: "orders" as AdminTabId },
    { label: "Pending Orders", value: `${kpis.pendingCount}`, icon: Clock, accent: "from-amber-500 to-orange-600", tab: "orders" as AdminTabId },
    { label: "Processing Orders", value: `${kpis.processingCount}`, icon: Package, accent: "from-sky-500 to-blue-600", tab: "orders" as AdminTabId },
    { label: "Delivered Orders", value: `${kpis.deliveredCount}`, icon: CheckCircle2, accent: "from-emerald-500 to-emerald-700", tab: "orders" as AdminTabId },
    { label: "Cancelled Orders", value: `${kpis.cancelledCount}`, icon: XCircle, accent: "from-rose-500 to-red-600", tab: "orders" as AdminTabId },
    { label: "Total Products", value: `${kpis.totalProducts}`, icon: Package, accent: "from-violet-500 to-purple-700", tab: "products" as AdminTabId },
    { label: "Total Customers", value: `${kpis.totalCustomers}`, icon: Users, accent: "from-cyan-600 to-teal-700", tab: "customers" as AdminTabId },
    { label: "Inventory Value", value: `৳${(kpis.inventoryValuation / 100000).toFixed(1)}L`, icon: Wallet, accent: "from-slate-700 to-slate-900", tab: "inv-overview" as AdminTabId },
    { label: "Low Stock Items", value: `${kpis.lowStockCount}`, icon: AlertTriangle, accent: "from-orange-500 to-amber-600", tab: "inv-alerts" as AdminTabId },
    { label: "Out of Stock", value: `${kpis.outOfStockCount}`, icon: PackageX, accent: "from-red-500 to-rose-700", tab: "inv-alerts" as AdminTabId },
    { label: "Total Expenses", value: `৳${kpis.totalExpenses.toLocaleString()}`, icon: TrendingDown, accent: "from-rose-500 to-pink-600", tab: "acc-expenses" as AdminTabId },
    { label: "Net Profit", value: `৳${kpis.netProfit.toLocaleString()}`, icon: DollarSign, accent: kpis.netProfit >= 0 ? "from-emerald-600 to-cyan-700" : "from-rose-600 to-red-700", tab: "acc-reports" as AdminTabId },
  ];

  const recentExpenses = (db.financialTransactions || [])
    .filter((t) => t.entryKind === "expense")
    .slice(0, 4);

  return (
    <div className="space-y-7">
      {/* Large Prominent Welcome Hero Section */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0084C7] via-[#006DA6] to-[#FF7A00] text-white p-6 sm:p-8 shadow-md border border-white/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-bold tracking-wide">
              <span className="size-2 rounded-full bg-emerald-300" />
              <span>RANGO ELECTRONICS · ENTERPRISE COMMAND CENTER</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome to Rango Electronics{userName ? `, ${userName}` : ""}
            </h1>
            <p className="text-sm text-white/90 leading-relaxed">
              Manage your entire business from one place — Orders, Products, Landing Pages, Accounts, Inventory, Couriers, Invoices, Popups, Pixel &amp; GTM.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate("add-product", "add_product")}
              className="px-4 py-2.5 rounded-lg bg-white text-[#0084C7] text-xs font-bold shadow-xs hover:bg-sky-50 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="size-4" />
              <span>Add Product</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate("invoices", "create_invoice")}
              className="px-4 py-2.5 rounded-lg bg-[#FF7A00] text-white text-xs font-bold shadow-xs hover:opacity-95 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="size-4" />
              <span>Manual Invoice</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate("acc-overview")}
              className="px-4 py-2.5 rounded-lg bg-white/15 border border-white/25 text-white text-xs font-bold hover:bg-white/25 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Accounts &amp; P&amp;L</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 11 Quick Action Operational Shortcuts */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">Quick Actions</h2>
          <span className="text-[11px] text-slate-400">Direct module shortcuts</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {[
            { label: "Add Product", tab: "add-product" as AdminTabId, intent: "add_product", icon: Plus },
            { label: "Add Category", tab: "categories" as AdminTabId, intent: "add_category", icon: Layers },
            { label: "Add Subcategory", tab: "categories" as AdminTabId, intent: "add_subcategory", icon: FolderTree },
            { label: "Add Brand", tab: "brands" as AdminTabId, intent: "add_brand", icon: Award },
            { label: "Create Coupon", tab: "coupons" as AdminTabId, icon: Tag },
            { label: "Create Popup", tab: "popups" as AdminTabId, icon: MessageSquare },
            { label: "Manual Invoice", tab: "invoices" as AdminTabId, intent: "create_invoice", icon: FileText },
            { label: "Add Expense", tab: "acc-expenses" as AdminTabId, icon: TrendingDown },
            { label: "Add Income", tab: "acc-income" as AdminTabId, icon: TrendingUp },
            { label: "Update Stock", tab: "inv-adjust" as AdminTabId, icon: Boxes },
            { label: "View Orders", tab: "orders" as AdminTabId, icon: ShoppingCart },
          ].map((qa) => {
            const Icon = qa.icon;
            return (
              <button
                key={qa.label}
                type="button"
                onClick={() => onNavigate(qa.tab, qa.intent)}
                className="px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-[#E0F2FE]/60 hover:border-[#0084C7]/40 text-left flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Icon className="size-4 text-[#0084C7] shrink-0" />
                <span className="text-xs font-semibold text-slate-800 truncate">{qa.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Calendar className="size-4 text-[#0084C7]" />
          <span>Analytics Date Range Filter</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "today", label: "Today" },
            { id: "yesterday", label: "Yesterday" },
            { id: "7d", label: "Last 7 Days" },
            { id: "30d", label: "Last 30 Days" },
            { id: "this_month", label: "This Month" },
            { id: "last_month", label: "Last Month" },
            { id: "all", label: "All Time" },
            { id: "custom", label: "Custom" },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPreset(opt.id as DatePreset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                preset === opt.id
                  ? "bg-[#0084C7] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
          {preset === "custom" && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* 17 KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => onNavigate(card.tab)}
              className="group bg-white rounded-2xl border border-slate-200 p-4 text-left shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  {card.label}
                </span>
                <div
                  className={`size-9 rounded-xl bg-gradient-to-br ${card.accent} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}
                >
                  <Icon className="size-4" />
                </div>
              </div>
              <p className="text-lg sm:text-xl font-black text-slate-900 truncate">
                {card.value}
              </p>
            </button>
          );
        })}
      </div>

      {/* Charts Row 1: Daily Sales Trend + Payment Method Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Daily Sales &amp; Order Statistics
              </h2>
              <p className="text-xs text-slate-500">
                {filteredOrders.length} orders within selected filter
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[#E0F2FE] text-[#0084C7] text-xs font-bold">
              ৳{filteredOrders.reduce((s, o) => s + Number(o.total || 0), 0).toLocaleString()}
            </span>
          </div>

          {analytics.dailySeries.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">
              No sales records found for this date window.
            </div>
          ) : (
            <div className="h-52 flex items-end gap-2 sm:gap-3 pt-4 border-b border-slate-100 pb-2">
              {analytics.dailySeries.map((pt) => {
                const h = Math.max(10, Math.round((pt.sales / maxDailySales) * 100));
                return (
                  <div
                    key={pt.label}
                    className="flex-1 flex flex-col items-center justify-end h-full group"
                  >
                    <span className="text-[10px] font-bold text-[#0084C7] opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                      ৳{pt.sales.toLocaleString()} ({pt.count})
                    </span>
                    <div
                      style={{ height: `${h}%` }}
                      className="w-full max-w-[42px] rounded-t-xl bg-gradient-to-t from-[#0084C7] to-[#38BDF8] group-hover:from-[#FF7A00] group-hover:to-amber-400 transition-all"
                    />
                    <span className="text-[10px] font-semibold text-slate-500 mt-1.5">
                      {pt.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Payment Method Statistics
            </h2>
            <p className="text-xs text-slate-500">Share by payment channel</p>
          </div>
          <div className="space-y-3">
            {analytics.paymentBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No payment data in range.</p>
            ) : (
              analytics.paymentBreakdown.map((pm) => {
                const totalPay = analytics.paymentBreakdown.reduce((s, p) => s + p.value, 0) || 1;
                const pct = Math.round((pm.value / totalPay) * 100);
                return (
                  <div key={pm.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span className="truncate">{pm.name}</span>
                      <span>
                        {pct}% (৳{pm.value.toLocaleString()})
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-[#0084C7] to-[#FF7A00]"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2: Category Sales, Brand Sales & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900">Category-wise Sales</h3>
          {analytics.categorySales.length === 0 ? (
            <p className="text-xs text-slate-400">No category breakdown in filter.</p>
          ) : (
            analytics.categorySales.map((cat) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="capitalize text-slate-700">{cat.name}</span>
                  <span className="font-bold text-slate-900">৳{cat.value.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    style={{ width: `${Math.round((cat.value / maxCategorySales) * 100)}%` }}
                    className="h-full rounded-full bg-[#0084C7]"
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900">Brand-wise Sales</h3>
          {analytics.brandSales.length === 0 ? (
            <p className="text-xs text-slate-400">No brand breakdown in filter.</p>
          ) : (
            analytics.brandSales.map((br) => (
              <div key={br.name} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">{br.name}</span>
                  <span className="font-bold text-slate-900">৳{br.value.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    style={{ width: `${Math.round((br.value / maxBrandSales) * 100)}%` }}
                    className="h-full rounded-full bg-[#FF7A00]"
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900">Top Selling Products</h3>
          <div className="space-y-2.5">
            {analytics.topProducts.length === 0 ? (
              <p className="text-xs text-slate-400">No product order lines in range.</p>
            ) : (
              analytics.topProducts.map((tp, idx) => (
                <div
                  key={tp.title}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="size-6 rounded-lg bg-[#0084C7] text-white text-[11px] font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{tp.title}</p>
                      <p className="text-[11px] text-slate-500">{tp.qty} units sold</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-[#0084C7] shrink-0">
                    ৳{tp.revenue.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 7-Feed Recent Business Activities */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase">Recent Orders</h4>
            <button onClick={() => onNavigate("orders")} className="text-[11px] font-bold text-[#0084C7]">
              View All
            </button>
          </div>
          {orders.slice(0, 4).map((o) => (
            <div key={o.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-none">
              <div className="min-w-0">
                <p className="font-bold text-slate-800 truncate">#{o.id}</p>
                <p className="text-[11px] text-slate-500 truncate">{o.shippingAddress?.fullName}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-slate-900">৳{Number(o.total || 0).toLocaleString()}</p>
                <span className="text-[10px] font-bold text-[#0084C7]">{o.status}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase">Recent Payments &amp; Expenses</h4>
            <button onClick={() => onNavigate("payments")} className="text-[11px] font-bold text-[#0084C7]">
              View All
            </button>
          </div>
          {(db.payments || []).slice(0, 2).map((p) => (
            <div key={p.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
              <div className="min-w-0">
                <p className="font-bold text-slate-800 truncate">Pay #{p.orderId}</p>
                <p className="text-[11px] text-slate-500 truncate">{p.method}</p>
              </div>
              <span className="text-[11px] font-bold text-emerald-600">+৳{p.amount.toLocaleString()}</span>
            </div>
          ))}
          {recentExpenses.slice(0, 2).map((ex) => (
            <div key={ex.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-none">
              <div className="min-w-0">
                <p className="font-bold text-slate-800 truncate">{ex.category}</p>
                <p className="text-[11px] text-slate-500 truncate">{ex.description}</p>
              </div>
              <span className="text-[11px] font-bold text-rose-600">-৳{ex.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase">Recent Stock Updates</h4>
            <button onClick={() => onNavigate("inv-history")} className="text-[11px] font-bold text-[#0084C7]">
              History
            </button>
          </div>
          {(db.stockMovements || []).slice(0, 4).map((m) => (
            <div key={m.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-none">
              <div className="min-w-0">
                <p className="font-bold text-slate-800 truncate">{m.productTitle}</p>
                <p className="text-[11px] text-slate-500 truncate">{m.reason}</p>
              </div>
              <span className="text-[11px] font-extrabold text-[#0084C7] shrink-0">
                {m.previousStock}→{m.newStock}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase">Recent Admin Activity</h4>
            <button onClick={() => onNavigate("logs")} className="text-[11px] font-bold text-[#0084C7]">
              Audit Log
            </button>
          </div>
          {(db.auditLogs || []).slice(0, 4).map((log) => (
            <div key={log.id} className="text-xs py-1.5 border-b border-slate-100 last:border-none">
              <p className="font-bold text-slate-800 truncate">{log.action}</p>
              <p className="text-[10px] text-slate-500">
                {log.section} · {log.actor}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
