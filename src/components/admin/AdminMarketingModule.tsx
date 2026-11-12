"use client";

import React, { useState } from "react";
import {
  Tag,
  Image as ImageIcon,
  MessageSquare,
  Activity,
  BarChart2,
  Trash2,
  Upload,
  Sparkles,
} from "lucide-react";
import { Product } from "@/data/products";
import {
  AdminBannerItem,
  AdminCoupon,
  AdminDatabase,
  AdminPopupItem,
  AdminTabId,
} from "@/types/admin";

interface AdminMarketingModuleProps {
  activeTab: AdminTabId;
  db: AdminDatabase;
  products: Product[];
  onAction: (action: string, payload: Record<string, unknown>, msg?: string) => Promise<boolean>;
  onPersistPatch: (section: string, permKey: string, desc: string, patch: Partial<AdminDatabase>) => Promise<boolean>;
}

const ALL_META_EVENTS = [
  "PageView",
  "ViewContent",
  "AddToCart",
  "InitiateCheckout",
  "Purchase",
  "Search",
  "Lead",
];

export const AdminMarketingModule: React.FC<AdminMarketingModuleProps> = ({
  activeTab,
  db,
  products,
  onAction,
  onPersistPatch,
}) => {
  const today = new Date().toISOString().slice(0, 10);

  // Coupon state
  const [cpnForm, setCpnForm] = useState<Partial<AdminCoupon>>({
    code: "",
    name: "",
    type: "percent",
    value: 10,
    minOrder: 2000,
    maxDiscount: 3000,
    startDate: today,
    expiryDate: "2027-12-31",
    usageLimit: 500,
    perCustomerLimit: 2,
    applicableCategories: [],
    description: "",
  });

  // Banner state
  const [bannerForm, setBannerForm] = useState<Partial<AdminBannerItem>>({
    placement: "hero",
    title: "",
    subtitle: "",
    image: "",
    link: "/offer",
    order: (db.banners || []).length + 1,
  });

  // Popup state
  const [editingPopupId, setEditingPopupId] = useState<string | null>(null);
  const [selectedPathsText, setSelectedPathsText] = useState("");
  const [popupForm, setPopupForm] = useState<Partial<AdminPopupItem>>({
    title: "",
    description: "",
    desktopImage: "",
    mobileImage: "",
    buttonText: "Shop Offer",
    buttonLink: "/offer",
    startDate: today,
    endDate: "2027-12-31",
    displayPosition: "center",
    targetPages: "homepage",
    selectedPaths: [],
    visitorRule: "all",
    frequency: "once_per_session",
    delaySeconds: 3,
    active: true,
  });

  // Tracking form state
  const [trackingDraft, setTrackingDraft] = useState(db.trackingSettings);
  const [uploading, setUploading] = useState(false);

  // Manual Promotional Offer / Flash Deal Creator
  const [offerProdQuery, setOfferProdQuery] = useState("");
  const [offerForm, setOfferForm] = useState({
    productId: products[0]?.id || "",
    title: "Flash Mega Campaign",
    badge: "FLASH DEAL",
    discountPercent: 20,
    offerPrice: products[0] ? Math.round(products[0].price * 0.8) : 0,
    startDate: today,
    endDate: "2027-12-31",
  });

  const handleUploadAsset = async (
    file: File,
    folder: string,
    onUrl: (url: string) => void
  ) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data?.url) onUrl(data.url);
    } finally {
      setUploading(false);
    }
  };

  if (activeTab === "coupons") {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Tag className="size-5 text-[#0084C7]" />
            <span>Create Database-Driven Coupon / Promo Voucher</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <input
              type="text"
              placeholder="Coupon Code (e.g. RANGO500) *"
              value={cpnForm.code || ""}
              onChange={(e) => setCpnForm({ ...cpnForm, code: e.target.value.toUpperCase() })}
              className="h-10 px-3 rounded-xl border border-slate-300 uppercase font-bold"
            />
            <input
              type="text"
              placeholder="Campaign Name"
              value={cpnForm.name || ""}
              onChange={(e) => setCpnForm({ ...cpnForm, name: e.target.value })}
              className="h-10 px-3 rounded-xl border border-slate-300"
            />
            <select
              value={cpnForm.type}
              onChange={(e) => setCpnForm({ ...cpnForm, type: e.target.value as any })}
              className="h-10 px-3 rounded-xl border border-slate-300 bg-white"
            >
              <option value="percent">Percentage (%)</option>
              <option value="fixed">Fixed Amount (৳)</option>
            </select>
            <input
              type="number"
              placeholder="Discount Value"
              value={cpnForm.value || 0}
              onChange={(e) => setCpnForm({ ...cpnForm, value: Number(e.target.value) })}
              className="h-10 px-3 rounded-xl border border-slate-300"
            />
            <input
              type="number"
              placeholder="Minimum Order (৳)"
              value={cpnForm.minOrder || 0}
              onChange={(e) => setCpnForm({ ...cpnForm, minOrder: Number(e.target.value) })}
              className="h-10 px-3 rounded-xl border border-slate-300"
            />
            <input
              type="number"
              placeholder="Max Discount Cap (৳)"
              value={cpnForm.maxDiscount || 0}
              onChange={(e) => setCpnForm({ ...cpnForm, maxDiscount: Number(e.target.value) })}
              className="h-10 px-3 rounded-xl border border-slate-300"
            />
            <input
              type="date"
              value={cpnForm.startDate || today}
              onChange={(e) => setCpnForm({ ...cpnForm, startDate: e.target.value })}
              className="h-10 px-3 rounded-xl border border-slate-300"
            />
            <input
              type="date"
              value={cpnForm.expiryDate || "2027-12-31"}
              onChange={(e) => setCpnForm({ ...cpnForm, expiryDate: e.target.value })}
              className="h-10 px-3 rounded-xl border border-slate-300"
            />
            <input
              type="number"
              placeholder="Total Usage Limit"
              value={cpnForm.usageLimit || 0}
              onChange={(e) => setCpnForm({ ...cpnForm, usageLimit: Number(e.target.value) })}
              className="h-10 px-3 rounded-xl border border-slate-300"
            />
            <input
              type="number"
              placeholder="Per Customer Limit"
              value={cpnForm.perCustomerLimit || 1}
              onChange={(e) => setCpnForm({ ...cpnForm, perCustomerLimit: Number(e.target.value) })}
              className="h-10 px-3 rounded-xl border border-slate-300"
            />
            <input
              type="text"
              placeholder="Description"
              value={cpnForm.description || ""}
              onChange={(e) => setCpnForm({ ...cpnForm, description: e.target.value })}
              className="h-10 px-3 rounded-xl border border-slate-300"
            />
            <button
              type="button"
              onClick={async () => {
                const code = (cpnForm.code || "").trim().toUpperCase();
                if (!code) return;
                const created: AdminCoupon = {
                  id: `cpn-${Date.now()}`,
                  code,
                  name: cpnForm.name || `${code} Offer`,
                  type: cpnForm.type || "percent",
                  value: Number(cpnForm.value || 10),
                  minOrder: Number(cpnForm.minOrder || 0),
                  maxDiscount: Number(cpnForm.maxDiscount || 0) || undefined,
                  startDate: cpnForm.startDate || today,
                  expiryDate: cpnForm.expiryDate || "2027-12-31",
                  usageLimit: Number(cpnForm.usageLimit || 0) || undefined,
                  perCustomerLimit: Number(cpnForm.perCustomerLimit || 1) || undefined,
                  usageCount: 0,
                  applicableCategories: cpnForm.applicableCategories || [],
                  applicableProducts: [],
                  description: cpnForm.description || "",
                  active: true,
                };
                await onPersistPatch("Coupons", "coupons", `Created coupon ${code}`, {
                  coupons: [created, ...(db.coupons || [])],
                });
                setCpnForm({ ...cpnForm, code: "", name: "", description: "" });
              }}
              className="h-10 rounded-xl bg-[#0084C7] text-white font-extrabold cursor-pointer"
            >
              + Create Coupon
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
                <th className="p-3">Code &amp; Title</th>
                <th className="p-3">Discount Rule</th>
                <th className="p-3">Validity Window</th>
                <th className="p-3">Usage Count</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(db.coupons || []).map((c) => (
                <tr key={c.id}>
                  <td className="p-3">
                    <div className="font-mono font-black text-[#0084C7] text-sm">{c.code}</div>
                    <div className="text-[11px] text-slate-500">{c.name}</div>
                  </td>
                  <td className="p-3">
                    <strong>
                      {c.type === "percent" ? `${c.value}%` : `৳${c.value}`} OFF
                    </strong>
                    <div className="text-[11px] text-slate-500">
                      Min Order: ৳{c.minOrder.toLocaleString()}
                      {c.maxDiscount ? ` · Cap: ৳${c.maxDiscount}` : ""}
                    </div>
                  </td>
                  <td className="p-3 text-slate-600">
                    {c.startDate} → {c.expiryDate}
                  </td>
                  <td className="p-3 font-bold">
                    {c.usageCount} / {c.usageLimit || "∞"}
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() =>
                        onPersistPatch("Coupons", "coupons", `Toggled coupon ${c.code}`, {
                          coupons: db.coupons.map((x) =>
                            x.id === c.id ? { ...x, active: !x.active } : x
                          ),
                        })
                      }
                      className={`px-2.5 py-1 rounded-full font-bold text-[11px] cursor-pointer ${
                        c.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {c.active ? "Active" : "Paused"}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        onPersistPatch("Coupons", "coupons", `Deleted coupon ${c.code}`, {
                          coupons: db.coupons.filter((x) => x.id !== c.id),
                        })
                      }
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (activeTab === "offers") {
    const dealProducts = products.filter((p) => p.hotDeal || p.discount >= 15);
    const matchingInventory = offerProdQuery.trim()
      ? products.filter(
          (p) =>
            p.title.toLowerCase().includes(offerProdQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(offerProdQuery.toLowerCase()) ||
            p.brand.toLowerCase().includes(offerProdQuery.toLowerCase())
        )
      : products;
    const pickedProd = products.find((p) => p.id === offerForm.productId) || products[0];

    return (
      <div className="space-y-6">
        {/* Manual Offer & Flash Deal Builder */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="size-5 text-[#FF7A00]" />
                <span>Create Promotional Offer on Any Inventory Product</span>
              </h2>
              <p className="text-xs text-slate-500">
                Search any product from all {products.length} inventory items, set your custom offer price or discount %, and publish to Storefront Offers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="lg:col-span-2">
              <label className="font-bold text-slate-600 block mb-1">
                Filter Inventory Products ({matchingInventory.length} matches)
              </label>
              <input
                type="text"
                value={offerProdQuery}
                onChange={(e) => {
                  const q = e.target.value;
                  setOfferProdQuery(q);
                  const first = products.find(
                    (p) =>
                      p.title.toLowerCase().includes(q.toLowerCase()) ||
                      p.category.toLowerCase().includes(q.toLowerCase())
                  );
                  if (first) {
                    const orig = first.originalPrice || first.price;
                    setOfferForm((prev) => ({
                      ...prev,
                      productId: first.id,
                      offerPrice: Math.round(orig * (1 - prev.discountPercent / 100)),
                    }));
                  }
                }}
                placeholder="Type product name, AC, TV, geyser, washing machine..."
                className="w-full h-10 px-3 rounded-xl border border-slate-300"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="font-bold text-slate-600 block mb-1">Select Product *</label>
              <select
                value={offerForm.productId}
                onChange={(e) => {
                  const p = products.find((item) => item.id === e.target.value);
                  if (!p) return;
                  const orig = p.originalPrice || p.price;
                  setOfferForm((prev) => ({
                    ...prev,
                    productId: p.id,
                    offerPrice: Math.round(orig * (1 - prev.discountPercent / 100)),
                  }));
                }}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white font-semibold"
              >
                {matchingInventory.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} — Current: ৳{p.price.toLocaleString()} ({p.brand})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">Offer Campaign Title</label>
              <input
                type="text"
                value={offerForm.title}
                onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">Offer Badge Label</label>
              <input
                type="text"
                value={offerForm.badge}
                onChange={(e) => setOfferForm({ ...offerForm, badge: e.target.value })}
                placeholder="FLASH SALE / HOT DEAL"
                className="w-full h-10 px-3 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">Discount %</label>
              <input
                type="number"
                min={0}
                max={90}
                value={offerForm.discountPercent}
                onChange={(e) => {
                  const pct = Math.min(90, Math.max(0, Number(e.target.value)));
                  const baseOrig = pickedProd?.originalPrice || pickedProd?.price || 0;
                  setOfferForm({
                    ...offerForm,
                    discountPercent: pct,
                    offerPrice: Math.max(1, Math.round(baseOrig * (1 - pct / 100))),
                  });
                }}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold text-[#FF7A00]"
              />
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">Offer Price (৳)</label>
              <input
                type="number"
                min={1}
                value={offerForm.offerPrice}
                onChange={(e) => {
                  const nextOffer = Math.max(1, Number(e.target.value));
                  const baseOrig = pickedProd?.originalPrice || pickedProd?.price || nextOffer;
                  const pct =
                    baseOrig > nextOffer
                      ? Math.round(((baseOrig - nextOffer) / baseOrig) * 100)
                      : 0;
                  setOfferForm({
                    ...offerForm,
                    offerPrice: nextOffer,
                    discountPercent: pct,
                  });
                }}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 font-extrabold text-[#0084C7]"
              />
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">Start Date</label>
              <input
                type="date"
                value={offerForm.startDate}
                onChange={(e) => setOfferForm({ ...offerForm, startDate: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">End Date</label>
              <input
                type="date"
                value={offerForm.endDate}
                onChange={(e) => setOfferForm({ ...offerForm, endDate: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-300"
              />
            </div>

            <div className="lg:col-span-2 flex items-end">
              <button
                type="button"
                onClick={async () => {
                  if (!pickedProd) return;
                  const baseOrig = pickedProd.originalPrice || pickedProd.price || offerForm.offerPrice;
                  await onAction(
                    "upsert_product",
                    {
                      product: {
                        ...pickedProd,
                        hotDeal: true,
                        price: offerForm.offerPrice,
                        originalPrice: Math.max(baseOrig, offerForm.offerPrice),
                        discount: offerForm.discountPercent,
                        badge: offerForm.badge || `${offerForm.discountPercent}% OFF`,
                        offerTitle: offerForm.title,
                        offerEndsAt: offerForm.endDate,
                      },
                    },
                    `Published offer on "${pickedProd.title}" (৳${offerForm.offerPrice.toLocaleString()})`
                  );
                  const newOffer = {
                    id: `off-${Date.now()}`,
                    productId: pickedProd.id,
                    title: offerForm.title,
                    badge: offerForm.badge || "HOT DEAL",
                    offerPrice: offerForm.offerPrice,
                    originalPrice: Math.max(baseOrig, offerForm.offerPrice),
                    discountPercent: offerForm.discountPercent,
                    startDate: offerForm.startDate,
                    endDate: offerForm.endDate,
                    active: true,
                    createdAt: new Date().toISOString(),
                  };
                  await onPersistPatch("Offers", "offers", "Saved promotional offer record", {
                    offers: [newOffer, ...(db.offers || []).filter((o) => o.productId !== pickedProd.id)],
                  });
                }}
                className="w-full h-10 rounded-xl bg-gradient-to-r from-[#0084C7] to-[#FF7A00] text-white font-extrabold shadow cursor-pointer hover:opacity-95"
              >
                + Publish Offer to Selected Product
              </button>
            </div>
          </div>
        </div>

        {/* Active Deals List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-extrabold text-slate-900">
              Active Flash Deals &amp; Promotional Offers ({dealProducts.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dealProducts.map((p) => (
              <div key={p.id} className="p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs bg-slate-50/50">
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 truncate">{p.title}</p>
                  <p className="text-[11px] text-[#0084C7] font-bold">
                    ৳{p.price.toLocaleString()}{" "}
                    {p.originalPrice > p.price && (
                      <span className="line-through text-slate-400 font-normal ml-1">
                        ৳{p.originalPrice.toLocaleString()}
                      </span>
                    )}{" "}
                    <span className="text-[#FF7A00]">({p.discount}% OFF)</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onAction("upsert_product", {
                      product: { ...p, hotDeal: !p.hotDeal },
                    })
                  }
                  className={`px-3 py-1.5 rounded-xl font-bold shrink-0 cursor-pointer ${
                    p.hotDeal ? "bg-[#FF7A00] text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {p.hotDeal ? "Hot Deal ON" : "Enable Deal"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "banners") {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <ImageIcon className="size-5 text-[#0084C7]" />
            <span>Homepage Banners &amp; Sliders Manager</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <select
              value={bannerForm.placement}
              onChange={(e) => setBannerForm({ ...bannerForm, placement: e.target.value as any })}
              className="h-10 px-3 rounded-xl border border-slate-300 bg-white"
            >
              <option value="hero">Hero Slider</option>
              <option value="side">Hero Right Side Card</option>
              <option value="promo_full">Full Promo Banner</option>
              <option value="mid">Mid Dual Banners</option>
            </select>
            <input
              type="text"
              placeholder="Banner Title"
              value={bannerForm.title || ""}
              onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
              className="h-10 px-3 rounded-xl border border-slate-300"
            />
            <input
              type="text"
              placeholder="Target Link (e.g. /offer)"
              value={bannerForm.link || ""}
              onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })}
              className="h-10 px-3 rounded-xl border border-slate-300"
            />
            <input
              type="text"
              placeholder="Image URL"
              value={bannerForm.image || ""}
              onChange={(e) => setBannerForm({ ...bannerForm, image: e.target.value })}
              className="h-10 px-3 rounded-xl border border-slate-300"
            />
            <div className="flex gap-2">
              <label className="h-10 px-3 rounded-xl border border-slate-300 flex items-center gap-1 cursor-pointer font-bold text-slate-700">
                <Upload className="size-3.5" />
                <span>{uploading ? "..." : "Upload"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] &&
                    handleUploadAsset(e.target.files[0], "rango_banners", (url) =>
                      setBannerForm((b) => ({ ...b, image: url }))
                    )
                  }
                />
              </label>
              <button
                type="button"
                onClick={async () => {
                  if (!bannerForm.title?.trim() || !bannerForm.image?.trim()) return;
                  const nb: AdminBannerItem = {
                    id: `bn-${Date.now()}`,
                    placement: (bannerForm.placement || "hero") as AdminBannerItem["placement"],
                    title: bannerForm.title,
                    subtitle: bannerForm.subtitle,
                    image: bannerForm.image,
                    link: bannerForm.link || "/",
                    active: true,
                    order: Number(bannerForm.order || 1),
                  };
                  await onPersistPatch("Banners", "banners", `Added banner ${nb.title}`, {
                    banners: [...(db.banners || []), nb],
                  });
                  setBannerForm({ ...bannerForm, title: "", image: "" });
                }}
                className="flex-1 h-10 rounded-xl bg-[#0084C7] text-white font-extrabold cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(db.banners || []).map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <img src={b.image} alt={b.title} className="w-full h-36 object-cover bg-slate-100" />
              <div className="p-4 flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <span className="px-2 py-0.5 rounded bg-[#E0F2FE] text-[#0084C7] font-bold text-[10px] uppercase">
                    {b.placement}
                  </span>
                  <p className="font-bold text-slate-900 truncate mt-1">{b.title}</p>
                  <p className="text-[11px] text-slate-500 truncate">{b.link}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      onPersistPatch("Banners", "banners", `Toggled banner ${b.title}`, {
                        banners: db.banners.map((x) =>
                          x.id === b.id ? { ...x, active: !x.active } : x
                        ),
                      })
                    }
                    className={`px-2.5 py-1 rounded-lg font-bold ${
                      b.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {b.active ? "Active" : "Off"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onPersistPatch("Banners", "banners", `Deleted banner ${b.title}`, {
                        banners: db.banners.filter((x) => x.id !== b.id),
                      })
                    }
                    className="p-1.5 text-rose-500"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === "popups") {
    const resetPopupForm = () => {
      setEditingPopupId(null);
      setSelectedPathsText("");
      setPopupForm({
        title: "",
        description: "",
        desktopImage: "",
        mobileImage: "",
        buttonText: "Shop Offer",
        buttonLink: "/offer",
        startDate: today,
        endDate: "2027-12-31",
        displayPosition: "center",
        targetPages: "homepage",
        selectedPaths: [],
        visitorRule: "all",
        frequency: "once_per_session",
        delaySeconds: 3,
        active: true,
      });
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="size-5 text-[#0084C7]" />
              <span>{editingPopupId ? "Edit Promotional Popup" : "Create Promotional Popup"}</span>
            </h2>
            {editingPopupId && (
              <button
                type="button"
                onClick={resetPopupForm}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Popup Title *</label>
              <input
                type="text"
                placeholder="e.g. Mega Eid Appliance Sale"
                value={popupForm.title || ""}
                onChange={(e) => setPopupForm({ ...popupForm, title: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Popup Description</label>
              <input
                type="text"
                placeholder="Up to 35% off on Inverter ACs..."
                value={popupForm.description || ""}
                onChange={(e) => setPopupForm({ ...popupForm, description: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Button Text</label>
              <input
                type="text"
                placeholder="Shop Offer"
                value={popupForm.buttonText || ""}
                onChange={(e) => setPopupForm({ ...popupForm, buttonText: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Button URL</label>
              <input
                type="text"
                placeholder="/offer"
                value={popupForm.buttonLink || ""}
                onChange={(e) => setPopupForm({ ...popupForm, buttonLink: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Position</label>
              <select
                value={popupForm.displayPosition}
                onChange={(e) => setPopupForm({ ...popupForm, displayPosition: e.target.value as AdminPopupItem["displayPosition"] })}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white"
              >
                <option value="center">Center Modal</option>
                <option value="bottom-right">Bottom-Right Slide Card</option>
                <option value="top-bar">Top Announcement Bar</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Display Location</label>
              <select
                value={popupForm.targetPages}
                onChange={(e) => setPopupForm({ ...popupForm, targetPages: e.target.value as AdminPopupItem["targetPages"] })}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white"
              >
                <option value="homepage">Homepage Only</option>
                <option value="all">All Pages</option>
                <option value="selected">Selected Pages</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Visitor Rule</label>
              <select
                value={popupForm.visitorRule}
                onChange={(e) => setPopupForm({ ...popupForm, visitorRule: e.target.value as AdminPopupItem["visitorRule"] })}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white"
              >
                <option value="all">Every Visit Rule</option>
                <option value="first_visit">First Visit Only</option>
                <option value="repeat_visit">Returning Visitors</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Display Frequency</label>
              <select
                value={popupForm.frequency}
                onChange={(e) => setPopupForm({ ...popupForm, frequency: e.target.value as AdminPopupItem["frequency"] })}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white"
              >
                <option value="once_per_session">Once Per Session</option>
                <option value="once_per_day">Once Per Day</option>
                <option value="always">Every Visit</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Display Delay (Seconds)</label>
              <input
                type="number"
                min={0}
                value={popupForm.delaySeconds ?? 3}
                onChange={(e) => setPopupForm({ ...popupForm, delaySeconds: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={popupForm.startDate || today}
                onChange={(e) => setPopupForm({ ...popupForm, startDate: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={popupForm.endDate || "2027-12-31"}
                onChange={(e) => setPopupForm({ ...popupForm, endDate: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-slate-300"
              />
            </div>
            <div className="flex items-end">
              <label className="w-full h-10 flex items-center gap-2 px-3 rounded-lg border border-slate-200 bg-slate-50 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={popupForm.active !== false}
                  onChange={(e) => setPopupForm({ ...popupForm, active: e.target.checked })}
                />
                <span>Popup Active</span>
              </label>
            </div>
          </div>

          {popupForm.targetPages === "selected" && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Selected Page Paths (comma-separated, e.g. /offer, /category/air-conditioner)
              </label>
              <input
                type="text"
                value={selectedPathsText}
                onChange={(e) => setSelectedPathsText(e.target.value)}
                placeholder="/offer, /category/television"
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs"
              />
            </div>
          )}

          {/* Desktop & Mobile Image Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Desktop Promotional Image *</p>
                  <p className="text-[11px] text-slate-500">JPG, JPEG, PNG, or WebP (Recommended 900×520px)</p>
                </div>
                <label className="px-3 py-1.5 rounded-lg bg-[#0084C7] hover:bg-[#006DA6] text-white text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer">
                  <Upload className="size-3.5" />
                  <span>{uploading ? "Uploading..." : popupForm.desktopImage ? "Replace" : "Upload Desktop"}</span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadAsset(f, "rango_popups", (url) => setPopupForm((p) => ({ ...p, desktopImage: url })));
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              {popupForm.desktopImage ? (
                <div className="relative rounded-lg border border-slate-200 bg-white overflow-hidden">
                  <img src={popupForm.desktopImage} alt="Desktop Popup Preview" className="w-full h-40 object-contain" />
                  <button
                    type="button"
                    onClick={() => setPopupForm({ ...popupForm, desktopImage: "" })}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded bg-rose-600 text-white text-[10px] font-bold"
                  >
                    Delete Image
                  </button>
                </div>
              ) : (
                <div className="h-28 rounded-lg border border-dashed border-slate-300 bg-white flex items-center justify-center text-[11px] text-slate-400">
                  No desktop image uploaded yet
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Mobile Promotional Image (Optional)</p>
                  <p className="text-[11px] text-slate-500">JPG, JPEG, PNG, or WebP (Recommended 600×720px)</p>
                </div>
                <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer">
                  <Upload className="size-3.5" />
                  <span>{uploading ? "Uploading..." : popupForm.mobileImage ? "Replace" : "Upload Mobile"}</span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadAsset(f, "rango_popups", (url) => setPopupForm((p) => ({ ...p, mobileImage: url })));
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              {popupForm.mobileImage ? (
                <div className="relative rounded-lg border border-slate-200 bg-white overflow-hidden">
                  <img src={popupForm.mobileImage} alt="Mobile Popup Preview" className="w-full h-40 object-contain" />
                  <button
                    type="button"
                    onClick={() => setPopupForm({ ...popupForm, mobileImage: "" })}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded bg-rose-600 text-white text-[10px] font-bold"
                  >
                    Delete Image
                  </button>
                </div>
              ) : (
                <div className="h-28 rounded-lg border border-dashed border-slate-300 bg-white flex items-center justify-center text-[11px] text-slate-400">
                  Uses desktop image on mobile if omitted
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              if (!popupForm.title?.trim() && !popupForm.desktopImage) return;
              const paths = selectedPathsText
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
              const payload: AdminPopupItem = {
                id: editingPopupId || `pop-${Date.now()}`,
                title: (popupForm.title || "Special Offer").trim(),
                description: popupForm.description || "",
                desktopImage: popupForm.desktopImage || "/banners/11-11-mega-sale-rango.png",
                mobileImage: popupForm.mobileImage || undefined,
                buttonText: popupForm.buttonText || "View Offer",
                buttonLink: popupForm.buttonLink || "/offer",
                startDate: popupForm.startDate || today,
                endDate: popupForm.endDate || "2027-12-31",
                displayPosition: popupForm.displayPosition || "center",
                targetPages: popupForm.targetPages || "homepage",
                selectedPaths: paths,
                visitorRule: popupForm.visitorRule || "all",
                frequency: popupForm.frequency || "once_per_session",
                delaySeconds: Number(popupForm.delaySeconds ?? 3),
                active: popupForm.active !== false,
              };

              if (editingPopupId) {
                await onPersistPatch("Popups", "popups", `Updated popup "${payload.title}"`, {
                  popups: (db.popups || []).map((x) => (x.id === editingPopupId ? payload : x)),
                });
              } else {
                await onPersistPatch("Popups", "popups", `Created popup "${payload.title}"`, {
                  popups: [payload, ...(db.popups || [])],
                });
              }
              resetPopupForm();
            }}
            className="h-10 px-6 rounded-lg bg-[#0084C7] hover:bg-[#006DA6] text-white text-xs font-bold cursor-pointer"
          >
            {editingPopupId ? "Update Popup" : "+ Publish Popup"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(db.popups || []).map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-start justify-between gap-4 text-xs">
              <div className="flex items-start gap-3 min-w-0">
                {p.desktopImage && (
                  <img
                    src={p.desktopImage}
                    alt={p.title}
                    className="w-24 h-16 rounded-lg object-cover border border-slate-200 bg-slate-50 shrink-0"
                  />
                )}
                <div className="space-y-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{p.title}</p>
                  <p className="text-slate-600 line-clamp-2">{p.description}</p>
                  <p className="text-[11px] text-slate-500">
                    {p.displayPosition} · {p.targetPages} · {p.frequency} · {p.delaySeconds}s delay
                  </p>
                  {p.mobileImage && (
                    <span className="inline-block px-2 py-0.5 rounded bg-sky-50 text-[#0084C7] text-[10px] font-semibold">
                      Mobile image set
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditingPopupId(p.id);
                    setPopupForm({ ...p });
                    setSelectedPathsText((p.selectedPaths || []).join(", "));
                  }}
                  className="px-2.5 py-1 rounded-lg bg-sky-50 text-[#0084C7] font-bold"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onPersistPatch("Popups", "popups", `Toggled popup "${p.title}"`, {
                      popups: db.popups.map((x) =>
                        x.id === p.id ? { ...x, active: !x.active } : x
                      ),
                    })
                  }
                  className={`px-2.5 py-1 rounded-full font-bold ${
                    p.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {p.active ? "Active" : "Paused"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onPersistPatch("Popups", "popups", `Deleted popup "${p.title}"`, {
                      popups: db.popups.filter((x) => x.id !== p.id),
                    })
                  }
                  className="p-1.5 text-rose-500"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      <div className="flex items-center gap-2.5">
        {activeTab === "meta-pixel" ? (
          <Activity className="size-5 text-[#0084C7]" />
        ) : (
          <BarChart2 className="size-5 text-[#FF7A00]" />
        )}
        <div>
          <h2 className="text-base font-extrabold text-slate-900">
            {activeTab === "meta-pixel"
              ? "Meta Pixel & Server Conversions API (CAPI)"
              : "Google Tag Manager (GTM) & GA4 Analytics"}
          </h2>
          <p className="text-xs text-slate-500">
            Public container IDs inject cleanly into storefront scripts; secret CAPI tokens stay exclusively in server environment variables.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="font-bold text-slate-700 block mb-1">Meta Pixel ID</label>
          <input
            type="text"
            placeholder="e.g. 123456789012345"
            value={trackingDraft.metaPixelId}
            onChange={(e) => setTrackingDraft({ ...trackingDraft, metaPixelId: e.target.value })}
            className="w-full h-10 px-3 rounded-xl border border-slate-300"
          />
        </div>
        <div>
          <label className="font-bold text-slate-700 block mb-1">Meta Test Event Code (Optional)</label>
          <input
            type="text"
            placeholder="e.g. TEST94821"
            value={trackingDraft.metaTestEventCode}
            onChange={(e) =>
              setTrackingDraft({ ...trackingDraft, metaTestEventCode: e.target.value })
            }
            className="w-full h-10 px-3 rounded-xl border border-slate-300"
          />
        </div>
        <div>
          <label className="font-bold text-slate-700 block mb-1">GTM Container ID</label>
          <input
            type="text"
            placeholder="e.g. GTM-XXXXXXX"
            value={trackingDraft.gtmContainerId}
            onChange={(e) =>
              setTrackingDraft({ ...trackingDraft, gtmContainerId: e.target.value })
            }
            className="w-full h-10 px-3 rounded-xl border border-slate-300"
          />
        </div>
        <div>
          <label className="font-bold text-slate-700 block mb-1">GA4 Measurement ID</label>
          <input
            type="text"
            placeholder="e.g. G-XXXXXXXXXX"
            value={trackingDraft.ga4MeasurementId}
            onChange={(e) =>
              setTrackingDraft({ ...trackingDraft, ga4MeasurementId: e.target.value })
            }
            className="w-full h-10 px-3 rounded-xl border border-slate-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {[
          { key: "metaPixelEnabled", label: "Enable Meta Pixel Script" },
          { key: "metaCapiEnabled", label: "Enable Server CAPI Forwarding" },
          { key: "gtmEnabled", label: "Enable Google Tag Manager" },
          { key: "consentRequired", label: "Require Cookie Consent Banner" },
        ].map((flag) => (
          <label
            key={flag.key}
            className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer font-bold text-slate-700"
          >
            <input
              type="checkbox"
              checked={Boolean((trackingDraft as any)[flag.key])}
              onChange={(e) =>
                setTrackingDraft({ ...trackingDraft, [flag.key]: e.target.checked })
              }
              className="accent-[#0084C7]"
            />
            <span>{flag.label}</span>
          </label>
        ))}
      </div>

      <div className="space-y-2 text-xs">
        <p className="font-bold text-slate-700">Tracked Commerce Events</p>
        <div className="flex flex-wrap gap-2">
          {ALL_META_EVENTS.map((ev) => {
            const on = (trackingDraft.metaEvents || []).includes(ev);
            return (
              <button
                key={ev}
                type="button"
                onClick={() =>
                  setTrackingDraft({
                    ...trackingDraft,
                    metaEvents: on
                      ? trackingDraft.metaEvents.filter((x) => x !== ev)
                      : [...trackingDraft.metaEvents, ev],
                  })
                }
                className={`px-3 py-1.5 rounded-xl font-bold ${
                  on ? "bg-[#0084C7] text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {ev}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          onPersistPatch("Tracking & Pixels", "meta-pixel", "Saved Pixel/CAPI/GTM settings", {
            trackingSettings: trackingDraft,
          })
        }
        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0084C7] to-[#006DA6] text-white text-xs font-extrabold cursor-pointer"
      >
        Save Tracking Configuration
      </button>
    </div>
  );
};
