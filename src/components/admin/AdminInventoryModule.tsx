"use client";

import React, { useMemo, useState } from "react";
import { Boxes, AlertTriangle, ArrowUpDown, History, Search } from "lucide-react";
import { Product } from "@/data/products";
import { AdminDatabase, AdminTabId, OrderStatus, ProductAdminExtended } from "@/types/admin";

interface AdminInventoryModuleProps {
  activeTab: AdminTabId;
  db: AdminDatabase;
  products: (Product & ProductAdminExtended)[];
  onAction: (action: string, payload: Record<string, unknown>, msg?: string) => Promise<boolean>;
  onPersistPatch: (section: string, permKey: string, desc: string, patch: Partial<AdminDatabase>) => Promise<boolean>;
}

export const AdminInventoryModule: React.FC<AdminInventoryModuleProps> = ({
  activeTab,
  db,
  products,
  onAction,
  onPersistPatch,
}) => {
  const [search, setSearch] = useState("");
  const [adjProductId, setAdjProductId] = useState(products[0]?.id || "");
  const [adjType, setAdjType] = useState<"stock_in" | "stock_out" | "adjustment">("stock_in");
  const [adjQty, setAdjQty] = useState(5);
  const [adjReason, setAdjReason] = useState("Warehouse restock");
  const [thresholdDraft, setThresholdDraft] = useState(db.settings?.lowStockThreshold ?? 5);
  const [deductStatusDraft, setDeductStatusDraft] = useState<OrderStatus>(
    db.settings?.stockDeductOnStatus || "Confirmed"
  );

  const threshold = Number(db.settings?.lowStockThreshold ?? 5);

  const stats = useMemo(() => {
    let totalUnits = 0;
    let sellingValuation = 0;
    let purchaseValuation = 0;
    let lowCount = 0;
    let outCount = 0;
    for (const p of products) {
      const stk = typeof p.stock === "number" ? p.stock : p.isStockOut ? 0 : 10;
      totalUnits += stk;
      sellingValuation += stk * Number(p.price || 0);
      purchaseValuation += stk * Number(p.purchasePrice || Math.round(p.price * 0.78));
      if (stk <= 0 || p.isStockOut) outCount++;
      else if (stk <= threshold) lowCount++;
    }
    return { totalUnits, sellingValuation, purchaseValuation, lowCount, outCount };
  }, [products, threshold]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      if (
        q &&
        !p.title.toLowerCase().includes(q) &&
        !(p.sku || "").toLowerCase().includes(q)
      ) {
        return false;
      }
      if (activeTab === "inv-alerts") {
        const stk = typeof p.stock === "number" ? p.stock : p.isStockOut ? 0 : 10;
        return stk <= threshold || p.isStockOut;
      }
      return true;
    });
  }, [products, search, activeTab, threshold]);

  return (
    <div className="space-y-6">
      {/* Top KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Units", val: stats.totalUnits.toLocaleString(), color: "text-[#0084C7]" },
          { label: "Selling Valuation", val: `৳${stats.sellingValuation.toLocaleString()}`, color: "text-emerald-700" },
          { label: "Est. Purchase Cost", val: `৳${stats.purchaseValuation.toLocaleString()}`, color: "text-slate-800" },
          { label: `Low Stock (≤${threshold})`, val: stats.lowCount, color: "text-amber-600" },
          { label: "Out of Stock", val: stats.outCount, color: "text-rose-600" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <p className="text-[11px] font-bold text-slate-500 uppercase">{k.label}</p>
            <p className={`text-xl font-black mt-1 ${k.color}`}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Stock Adjustment + Threshold Rules */}
      {(activeTab === "inv-adjust" || activeTab === "inv-overview" || activeTab === "inv-alerts") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <ArrowUpDown className="size-4 text-[#0084C7]" />
              <span>Quick Stock In / Stock Out / Exact Adjustment</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <select
                value={adjProductId}
                onChange={(e) => setAdjProductId(e.target.value)}
                className="sm:col-span-2 h-10 px-3 rounded-xl border border-slate-300 bg-white"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} (Stock: {typeof p.stock === "number" ? p.stock : 10})
                  </option>
                ))}
              </select>
              <select
                value={adjType}
                onChange={(e) => setAdjType(e.target.value as any)}
                className="h-10 px-3 rounded-xl border border-slate-300 bg-white"
              >
                <option value="stock_in">Stock In (+)</option>
                <option value="stock_out">Stock Out (-)</option>
                <option value="adjustment">Set Exact Stock</option>
              </select>
              <input
                type="number"
                min={0}
                value={adjQty}
                onChange={(e) => setAdjQty(Number(e.target.value))}
                className="h-10 px-3 rounded-xl border border-slate-300"
              />
              <input
                type="text"
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                placeholder="Adjustment reason / PO#"
                className="sm:col-span-3 h-10 px-3 rounded-xl border border-slate-300"
              />
              <button
                type="button"
                onClick={() =>
                  onAction(
                    "stock_adjustment",
                    {
                      productId: adjProductId,
                      type: adjType,
                      quantity: adjQty,
                      targetStock: adjQty,
                      reason: adjReason,
                    },
                    "Applied stock adjustment"
                  )
                }
                className="h-10 rounded-xl bg-[#0084C7] text-white font-extrabold cursor-pointer"
              >
                Apply Stock
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="size-4 text-[#FF7A00]" />
              <span>Automation &amp; Alert Rules</span>
            </h3>
            <div>
              <label className="font-bold text-slate-600 block mb-1">
                Low Stock Alert Threshold (Units)
              </label>
              <input
                type="number"
                min={1}
                value={thresholdDraft}
                onChange={(e) => setThresholdDraft(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 block mb-1">
                Auto-Deduct Stock When Order Reaches
              </label>
              <select
                value={deductStatusDraft}
                onChange={(e) => setDeductStatusDraft(e.target.value as OrderStatus)}
                className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-white"
              >
                {["Confirmed", "Processing", "Ready to Ship", "Shipped", "Delivered"].map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() =>
                onPersistPatch("Inventory Settings", "inv-alerts", "Updated inventory alert rules", {
                  settings: {
                    ...db.settings,
                    lowStockThreshold: thresholdDraft,
                    stockDeductOnStatus: deductStatusDraft,
                  },
                })
              }
              className="w-full py-2 rounded-xl bg-slate-900 text-white font-bold cursor-pointer"
            >
              Save Automation Rules
            </button>
          </div>
        </div>
      )}

      {activeTab === "inv-history" ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <History className="size-4 text-[#0084C7]" />
            <span>Stock Movement Audit History</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
                  <th className="p-3">Time</th>
                  <th className="p-3">Product / SKU</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Prev → New</th>
                  <th className="p-3">Reason &amp; Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(db.stockMovements || []).map((m) => (
                  <tr key={m.id}>
                    <td className="p-3 text-slate-500 whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-slate-800">{m.productTitle}</p>
                      <p className="text-[11px] text-slate-400">{m.sku}</p>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-[#E0F2FE] text-[#0084C7] font-bold uppercase text-[10px]">
                        {m.type.replace("_", " ")} ({m.quantity})
                      </span>
                    </td>
                    <td className="p-3 font-extrabold text-slate-900">
                      {m.previousStock} → {m.newStock}
                    </td>
                    <td className="p-3">
                      <p className="text-slate-700">{m.reason}</p>
                      <p className="text-[11px] text-slate-400">{m.actor}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Boxes className="size-4 text-[#0084C7]" />
              <span>
                {activeTab === "inv-alerts" ? "Low & Out of Stock Alerts" : "Live Product Stock Levels"}
              </span>
            </h3>
            <div className="relative w-64">
              <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SKU or title..."
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
                  <th className="p-3">Product</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Purchase / Selling</th>
                  <th className="p-3">Available Stock</th>
                  <th className="p-3 text-right">Quick +10</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.slice(0, 60).map((p) => {
                  const stk = typeof p.stock === "number" ? p.stock : 10;
                  return (
                    <tr key={p.id}>
                      <td className="p-3 font-bold text-slate-800">{p.title}</td>
                      <td className="p-3 text-slate-500">{p.sku}</td>
                      <td className="p-3">
                        ৳{(p.purchasePrice || Math.round(p.price * 0.78)).toLocaleString()} /{" "}
                        <strong className="text-[#0084C7]">৳{p.price.toLocaleString()}</strong>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            stk <= 0
                              ? "bg-rose-100 text-rose-700"
                              : stk <= threshold
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {stk} units
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            onAction("stock_adjustment", {
                              productId: p.id,
                              type: "stock_in",
                              quantity: 10,
                              reason: "Quick +10 Restock",
                            })
                          }
                          className="px-3 py-1 rounded-lg bg-[#E0F2FE] text-[#0084C7] font-bold cursor-pointer"
                        >
                          +10 Restock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
