"use client";

import React, { useMemo, useState } from "react";
import {
  LayoutTemplate,
  Plus,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Save,
  Upload,
  Search,
  Video,
  Globe,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Product } from "@/data/products";
import {
  AdminDatabase,
  LandingBlockType,
  LandingPageBlock,
  LandingPageRecord,
} from "@/types/admin";

interface AdminLandingBuilderModuleProps {
  db: AdminDatabase;
  products: Product[];
  onPersistPatch: (
    section: string,
    permissionKey: string,
    actionDescription: string,
    patch: Partial<AdminDatabase>
  ) => Promise<boolean>;
}

const slugifyTitle = (val: string) =>
  val
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const BLOCK_TEMPLATES: { type: LandingBlockType; label: string; heading: string }[] = [
  { type: "hero", label: "Hero Offer Showcase", heading: "Special Product Campaign" },
  { type: "highlights", label: "Key Benefits & Features", heading: "Why Choose This Product" },
  { type: "video", label: "Product Video Tour", heading: "Watch Product Demo Video" },
  { type: "description", label: "Detailed Product Story", heading: "Product Features & Story" },
  { type: "specs", label: "Technical Specifications", heading: "Full Technical Specifications" },
  { type: "testimonial", label: "Customer Social Proof", heading: "Verified Customer Feedback" },
  { type: "checkout", label: "1-Step Order Form", heading: "Order Now — Cash on Delivery" },
];

function buildDefaultLandingPage(prod?: Product): LandingPageRecord {
  const now = new Date().toISOString();
  const id = `lp-${Date.now().toString().slice(-6)}`;
  const title = prod
    ? `${prod.title} — Exclusive Direct Offer`
    : "New Product Promotional Landing Page";
  return {
    id,
    slug: prod ? `${prod.slug}-offer` : `campaign-${id}`,
    title,
    subtitle: prod
      ? `100% genuine ${prod.brand} unit with ${prod.warranty || "official brand warranty"} & nationwide fast delivery.`
      : "Limited time promotional offer from Rango Electronics Bangladesh.",
    badge: "SPECIAL CAMPAIGN OFFER",
    productId: prod?.id || "",
    heroImage: prod?.thumbnail || "/logo.png",
    galleryImages: prod?.images?.length ? prod.images.slice(0, 4) : [],
    videoUrl: "",
    accentColor: "#0084C7",
    offerPrice: prod?.price || 0,
    originalPrice: prod?.originalPrice || prod?.price || 0,
    ctaText: "Order Now — Cash on Delivery",
    warrantyNote: prod?.warranty || "Official Brand Warranty",
    deliveryNote: "24-48 Hours Dhaka Express Delivery & 64-District Shipping",
    seoTitle: prod ? `${prod.title} Offer Price BD | Rango Electronics` : "Campaign Offer | Rango Electronics",
    seoDescription: prod
      ? `Buy genuine ${prod.title} at ৳${prod.price.toLocaleString()} with 0% EMI and fast home delivery at Rango Electronics.`
      : "Shop genuine electronics at Rango Electronics Bangladesh.",
    published: true,
    createdAt: now,
    updatedAt: now,
    blocks: [
      {
        id: `blk-${Date.now()}-1`,
        type: "hero",
        label: "Hero Offer Showcase",
        heading: prod?.title || "Headline Offer Showcase",
        subheading: "Authentic product with official brand warranty & nationwide COD.",
        imageUrl: prod?.thumbnail || "/logo.png",
        ctaText: "Order Now",
        visible: true,
      },
      {
        id: `blk-${Date.now()}-2`,
        type: "highlights",
        label: "Key Benefits & Features",
        heading: "Key Benefits & Highlights",
        bulletPoints: [
          "100% Genuine & Factory Sealed Product",
          "Official Brand Warranty & Cash Memo Included",
          "Fast Home Delivery Across 64 Districts in Bangladesh",
          "Cash on Delivery, bKash, Nagad & 0% EMI Available",
        ],
        visible: true,
      },
      {
        id: `blk-${Date.now()}-3`,
        type: "description",
        label: "Product Overview",
        heading: "Why Customers Love This Model",
        body: prod?.shortDescription || "Built for reliable daily performance with Rango Electronics support.",
        visible: true,
      },
      {
        id: `blk-${Date.now()}-4`,
        type: "specs",
        label: "Specifications Table",
        heading: "Technical Specifications",
        visible: true,
      },
      {
        id: `blk-${Date.now()}-5`,
        type: "checkout",
        label: "1-Step Checkout Form",
        heading: "Place Your Order in 30 Seconds",
        ctaText: "Confirm Order Now",
        visible: true,
      },
    ],
  };
}

export const AdminLandingBuilderModule: React.FC<AdminLandingBuilderModuleProps> = ({
  db,
  products,
  onPersistPatch,
}) => {
  const pages = db.landingPages || [];
  const [selectedId, setSelectedId] = useState<string>(pages[0]?.id || "");
  const [draft, setDraft] = useState<LandingPageRecord | null>(pages[0] ? { ...pages[0] } : null);
  const [slugLocked, setSlugLocked] = useState<boolean>(false);
  const [prodQuery, setProdQuery] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredProducts = useMemo(() => {
    const q = prodQuery.trim().toLowerCase();
    if (!q) return products.slice(0, 60);
    return products
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      )
      .slice(0, 60);
  }, [products, prodQuery]);

  const selectPage = (lp: LandingPageRecord) => {
    setSelectedId(lp.id);
    setDraft(JSON.parse(JSON.stringify(lp)) as LandingPageRecord);
    setSlugLocked(true);
  };

  const handleCreateNew = () => {
    const fresh = buildDefaultLandingPage(products[0]);
    setSelectedId(fresh.id);
    setDraft(fresh);
    setSlugLocked(false);
  };

  const handleUploadImage = async (
    file: File,
    onDone: (url: string) => void,
    fieldKey: string
  ) => {
    setUploadingField(fieldKey);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "rango_landing");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data?.url) onDone(String(data.url));
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = async () => {
    if (!draft || !draft.title.trim()) return;
    setSaving(true);
    try {
      const cleanSlug = slugifyTitle(draft.slug || draft.title) || `lp-${Date.now()}`;
      const finalized: LandingPageRecord = {
        ...draft,
        slug: cleanSlug,
        seoTitle: draft.seoTitle?.trim() || `${draft.title} | Rango Electronics`,
        seoDescription:
          draft.seoDescription?.trim() ||
          draft.subtitle ||
          `Order ${draft.title} with official warranty from Rango Electronics.`,
        updatedAt: new Date().toISOString(),
      };
      const exists = pages.some((p) => p.id === finalized.id);
      const nextPages = exists
        ? pages.map((p) => (p.id === finalized.id ? finalized : p))
        : [finalized, ...pages];

      const ok = await onPersistPatch(
        "Landing Pages",
        "website",
        `Saved landing page "/lp/${finalized.slug}"`,
        { landingPages: nextPages }
      );
      if (ok) {
        setDraft(finalized);
        setSelectedId(finalized.id);
        setSlugLocked(true);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const nextPages = pages.filter((p) => p.id !== id);
    await onPersistPatch("Landing Pages", "website", `Deleted landing page ${id}`, {
      landingPages: nextPages,
    });
    if (selectedId === id) {
      if (nextPages[0]) selectPage(nextPages[0]);
      else setDraft(null);
    }
  };

  const reorderBlocks = (fromIdx: number, toIdx: number) => {
    if (!draft || fromIdx === toIdx || fromIdx < 0 || toIdx < 0) return;
    if (toIdx >= draft.blocks.length) return;
    const next = [...draft.blocks];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setDraft({ ...draft, blocks: next });
  };

  const addBlock = (tpl: { type: LandingBlockType; label: string; heading: string }) => {
    if (!draft) return;
    const newBlock: LandingPageBlock = {
      id: `blk-${Date.now()}`,
      type: tpl.type,
      label: tpl.label,
      heading: tpl.heading,
      subheading: "",
      body: tpl.type === "description" ? "Write compelling product story and benefits here..." : "",
      bulletPoints: tpl.type === "highlights" ? ["Official Brand Warranty", "Fast Nationwide COD"] : undefined,
      ctaText: tpl.type === "hero" || tpl.type === "checkout" ? "Order Now" : undefined,
      imageUrl: tpl.type === "hero" ? draft.heroImage : "",
      videoUrl: tpl.type === "video" ? draft.videoUrl : "",
      visible: true,
    };
    setDraft({ ...draft, blocks: [...draft.blocks, newBlock] });
  };

  const updateBlock = (idx: number, patch: Partial<LandingPageBlock>) => {
    if (!draft) return;
    const next = draft.blocks.map((b, i) => (i === idx ? { ...b, ...patch } : b));
    setDraft({ ...draft, blocks: next });
  };

  const removeBlock = (idx: number) => {
    if (!draft) return;
    setDraft({ ...draft, blocks: draft.blocks.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white/95 rounded-2xl border border-sky-100 p-5 sm:p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-[#0084C7] to-[#FF7A00] text-white flex items-center justify-center shadow">
            <LayoutTemplate className="size-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Product-Wise Drag &amp; Drop Landing Page Builder ({pages.length})
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Create classic responsive one-page funnels with SEO, product info, images, video &amp; 1-step checkout.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCreateNew}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0084C7] to-[#006DA6] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow cursor-pointer hover:opacity-95"
        >
          <Plus className="size-4" />
          <span>New Landing Page</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left List of Pages */}
        <div className="xl:col-span-4 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Saved &amp; Demo Landing Pages ({pages.length})
            </h3>
            <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
              {pages.map((lp) => {
                const active = draft?.id === lp.id;
                return (
                  <div
                    key={lp.id}
                    onClick={() => selectPage(lp)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      active
                        ? "border-[#0084C7] bg-gradient-to-r from-sky-50 to-orange-50/40 shadow-xs"
                        : "border-slate-200 hover:border-sky-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={lp.heroImage || "/logo.png"}
                        alt={lp.title}
                        className="size-12 rounded-lg object-contain bg-slate-50 border border-slate-100 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold text-slate-900 line-clamp-1">{lp.title}</p>
                        <p className="text-[11px] font-mono text-[#0084C7] truncate">/lp/{lp.slug}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              lp.published
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {lp.published ? "Published" : "Draft"}
                          </span>
                          <a
                            href={`/lp/${lp.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] font-bold text-[#FF7A00] inline-flex items-center gap-1 hover:underline"
                          >
                            <ExternalLink className="size-3" />
                            <span>Open Live</span>
                          </a>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(lp.id);
                            }}
                            className="ml-auto text-rose-500 hover:text-rose-700 p-1"
                            title="Delete Landing Page"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Editor & Drag-Drop Canvas */}
        <div className="xl:col-span-8 space-y-6">
          {!draft ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">
              Select a landing page on the left or click &ldquo;New Landing Page&rdquo; to build one.
            </div>
          ) : (
            <div className="space-y-6">
              {/* General Info & Product Link + Media */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Landing Page Settings &amp; Product Link
                    </h3>
                    <p className="text-xs text-slate-500">
                      Live URL: <span className="font-mono text-[#0084C7]">/lp/{draft.slug}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/lp/${draft.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 hover:bg-slate-50"
                    >
                      <ExternalLink className="size-3.5" />
                      <span>Preview Page</span>
                    </a>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleSave}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0084C7] to-[#006DA6] text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow cursor-pointer disabled:opacity-60"
                    >
                      <Save className="size-4" />
                      <span>{saving ? "Saving..." : "Save Landing Page"}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="md:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">
                      Select Inventory Product
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative sm:w-56">
                        <Search className="size-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={prodQuery}
                          onChange={(e) => setProdQuery(e.target.value)}
                          placeholder="Filter inventory (AC, Geyser...)"
                          className="w-full h-10 pl-8 pr-3 rounded-xl border border-slate-300 text-xs"
                        />
                      </div>
                      <select
                        value={draft.productId}
                        onChange={(e) => {
                          const p = products.find((item) => item.id === e.target.value);
                          if (!p) return;
                          setDraft((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  productId: p.id,
                                  heroImage: p.thumbnail || prev.heroImage,
                                  offerPrice: p.price,
                                  originalPrice: p.originalPrice || p.price,
                                  warrantyNote: p.warranty || prev.warrantyNote,
                                }
                              : prev
                          );
                        }}
                        className="flex-1 h-10 px-3 rounded-xl border border-slate-300 bg-white font-semibold"
                      >
                        <option value="">-- Choose Product from Inventory --</option>
                        {filteredProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.category}] {p.title} — ৳{p.price.toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">
                      Campaign Headline Title *
                    </label>
                    <input
                      type="text"
                      value={draft.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        setDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                title,
                                slug: slugLocked ? prev.slug : slugifyTitle(title) || prev.slug,
                              }
                            : prev
                        );
                      }}
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-300 text-sm font-semibold"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">
                      Hero Subtitle / Value Proposition
                    </label>
                    <input
                      type="text"
                      value={draft.subtitle || ""}
                      onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">URL Slug (/lp/slug)</label>
                    <input
                      type="text"
                      value={draft.slug}
                      onChange={(e) => {
                        setSlugLocked(true);
                        setDraft({ ...draft, slug: slugifyTitle(e.target.value) });
                      }}
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Top Campaign Badge</label>
                    <input
                      type="text"
                      value={draft.badge || ""}
                      onChange={(e) => setDraft({ ...draft, badge: e.target.value })}
                      placeholder="e.g. FLASH OFFER • SAVE 25%"
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Offer Price (৳)</label>
                    <input
                      type="number"
                      value={draft.offerPrice || 0}
                      onChange={(e) => setDraft({ ...draft, offerPrice: Number(e.target.value) })}
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-300 font-bold text-[#0084C7]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Original Price (৳)</label>
                    <input
                      type="number"
                      value={draft.originalPrice || 0}
                      onChange={(e) => setDraft({ ...draft, originalPrice: Number(e.target.value) })}
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Hero / Product Image URL + Upload
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={draft.heroImage}
                        onChange={(e) => setDraft({ ...draft, heroImage: e.target.value })}
                        className="flex-1 h-10 px-3 rounded-xl border border-slate-300"
                      />
                      <label className="h-10 px-3 rounded-xl bg-sky-50 border border-sky-200 text-[#0084C7] font-bold inline-flex items-center gap-1 cursor-pointer shrink-0">
                        <Upload className="size-3.5" />
                        <span>{uploadingField === "hero" ? "..." : "Upload"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadImage(f, (url) => setDraft({ ...draft, heroImage: url }), "hero");
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                      <Video className="size-3.5 text-[#FF7A00]" />
                      <span>Promo Video URL (YouTube / MP4)</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={draft.videoUrl || ""}
                      onChange={(e) => setDraft({ ...draft, videoUrl: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">CTA Button Text</label>
                    <input
                      type="text"
                      value={draft.ctaText}
                      onChange={(e) => setDraft({ ...draft, ctaText: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-300"
                    />
                  </div>

                  <div className="flex items-end gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Theme Accent</label>
                      <input
                        type="color"
                        value={draft.accentColor || "#0084C7"}
                        onChange={(e) => setDraft({ ...draft, accentColor: e.target.value })}
                        className="h-10 w-16 rounded-xl border border-slate-300 cursor-pointer"
                      />
                    </div>
                    <label className="flex items-center gap-2 h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.published}
                        onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
                        className="accent-[#0084C7]"
                      />
                      <span>Published Live</span>
                    </label>
                  </div>

                  {/* SEO Section */}
                  <div className="md:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <p className="font-extrabold text-slate-800 flex items-center gap-1.5">
                      <Globe className="size-4 text-[#0084C7]" />
                      <span>SEO Metadata (Indexed in Sitemap)</span>
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">SEO Title</label>
                        <input
                          type="text"
                          value={draft.seoTitle}
                          onChange={(e) => setDraft({ ...draft, seoTitle: e.target.value })}
                          className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">SEO Meta Description</label>
                        <input
                          type="text"
                          value={draft.seoDescription}
                          onChange={(e) => setDraft({ ...draft, seoDescription: e.target.value })}
                          className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drag & Drop Page Sections */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Sparkles className="size-4 text-[#FF7A00]" />
                      <span>Drag &amp; Drop Section Layout ({draft.blocks.length} Sections)</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Drag any block card by its handle (or click arrows) to reorder how sections render on /lp/{draft.slug}.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {BLOCK_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.type}
                        type="button"
                        onClick={() => addBlock(tpl)}
                        className="px-2.5 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-[#0084C7] text-[11px] font-bold hover:bg-sky-100 cursor-pointer"
                      >
                        + {tpl.label.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {draft.blocks.map((blk, idx) => (
                    <div
                      key={blk.id}
                      draggable
                      onDragStart={() => setDragIdx(idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (dragIdx !== null) reorderBlocks(dragIdx, idx);
                        setDragIdx(null);
                      }}
                      className={`p-4 rounded-2xl border transition-all ${
                        dragIdx === idx
                          ? "border-[#FF7A00] bg-orange-50/40 scale-[0.99]"
                          : blk.visible
                            ? "border-slate-200 bg-slate-50/70 hover:border-sky-300"
                            : "border-slate-200 bg-slate-100/70 opacity-65"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing">
                          <GripVertical className="size-4 text-slate-400" />
                          <span className="px-2.5 py-0.5 rounded-full bg-[#0084C7] text-white text-[10px] font-extrabold uppercase">
                            {idx + 1}. {blk.type}
                          </span>
                          <span className="text-xs font-extrabold text-slate-800">{blk.label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => reorderBlocks(idx, idx - 1)}
                            disabled={idx === 0}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => reorderBlocks(idx, idx + 1)}
                            disabled={idx === draft.blocks.length - 1}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateBlock(idx, { visible: !blk.visible })}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 cursor-pointer"
                            title={blk.visible ? "Hide Block" : "Show Block"}
                          >
                            {blk.visible ? <Eye className="size-3.5 text-emerald-600" /> : <EyeOff className="size-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBlock(idx)}
                            className="p-1.5 rounded-lg border border-rose-200 bg-white text-rose-600 cursor-pointer"
                            title="Remove Section"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            Section Heading
                          </label>
                          <input
                            type="text"
                            value={blk.heading}
                            onChange={(e) => updateBlock(idx, { heading: e.target.value })}
                            className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            Subheading / CTA Label
                          </label>
                          <input
                            type="text"
                            value={blk.subheading || blk.ctaText || ""}
                            onChange={(e) =>
                              updateBlock(idx, {
                                subheading: e.target.value,
                                ctaText: blk.type === "hero" || blk.type === "checkout" ? e.target.value : blk.ctaText,
                              })
                            }
                            className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white"
                          />
                        </div>

                        {(blk.type === "description" || blk.type === "testimonial") && (
                          <div className="sm:col-span-2">
                            <label className="text-[11px] font-bold text-slate-600 block mb-1">
                              {blk.type === "description"
                                ? "Content (Paste plain text directly — blank lines, headings & • bullets format automatically)"
                                : "Featured Testimonial Quote"}
                            </label>
                            <textarea
                              rows={blk.type === "description" ? 5 : 3}
                              value={blk.body || ""}
                              onChange={(e) => updateBlock(idx, { body: e.target.value })}
                              placeholder={
                                blk.type === "description"
                                  ? "Paste description directly from Word, ChatGPT, or supplier sheet — no HTML tags needed!"
                                  : "Customer review highlight..."
                              }
                              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-xs leading-relaxed"
                            />
                          </div>
                        )}

                        {blk.type === "specs" && (
                          <div className="sm:col-span-2 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <label className="text-[11px] font-bold text-slate-600">
                                Paste Technical Specifications (Key: Value per line — leave blank to auto-use product specs)
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const linked = products.find((p) => p.id === draft.productId);
                                  if (!linked?.specifications?.length) return;
                                  const lines = linked.specifications.flatMap((g) =>
                                    g.items.map((it) => `${it.key}: ${it.value}`)
                                  );
                                  updateBlock(idx, { body: lines.join("\n") });
                                }}
                                className="px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-[#0084C7] text-[10px] font-extrabold hover:bg-sky-100 cursor-pointer"
                              >
                                Fill from Linked Product
                              </button>
                            </div>
                            <textarea
                              rows={5}
                              value={blk.body || ""}
                              onChange={(e) => updateBlock(idx, { body: e.target.value })}
                              placeholder={"Capacity: 1.5 Ton (18,000 BTU)\nCompressor: Full DC Inverter\nWarranty: 10 Years Official"}
                              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-xs leading-relaxed"
                            />
                          </div>
                        )}

                        {blk.type === "highlights" && (
                          <div className="sm:col-span-2">
                            <label className="text-[11px] font-bold text-slate-600 block mb-1">
                              Bullet Points (1 per line)
                            </label>
                            <textarea
                              rows={4}
                              value={(blk.bulletPoints || []).join("\n")}
                              onChange={(e) =>
                                updateBlock(idx, {
                                  bulletPoints: e.target.value.split(/\r?\n/).filter(Boolean),
                                })
                              }
                              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                            />
                          </div>
                        )}

                        {(blk.type === "hero" || blk.type === "gallery" || blk.type === "description") && (
                          <div className="sm:col-span-2 flex gap-2 items-end">
                            <div className="flex-1">
                              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                Section Image URL
                              </label>
                              <input
                                type="text"
                                value={blk.imageUrl || ""}
                                onChange={(e) => updateBlock(idx, { imageUrl: e.target.value })}
                                className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white"
                              />
                            </div>
                            <label className="h-9 px-3 rounded-lg bg-white border border-slate-300 text-[#0084C7] font-bold inline-flex items-center gap-1 cursor-pointer">
                              <Upload className="size-3.5" />
                              <span>{uploadingField === blk.id ? "..." : "Upload"}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleUploadImage(f, (url) => updateBlock(idx, { imageUrl: url }), blk.id);
                                }}
                              />
                            </label>
                          </div>
                        )}

                        {blk.type === "video" && (
                          <div className="sm:col-span-2">
                            <label className="text-[11px] font-bold text-slate-600 block mb-1">
                              Video Embed / MP4 URL
                            </label>
                            <input
                              type="url"
                              value={blk.videoUrl || ""}
                              onChange={(e) => updateBlock(idx, { videoUrl: e.target.value })}
                              placeholder="https://www.youtube.com/watch?v=..."
                              className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSave}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0084C7] to-[#FF7A00] text-white text-xs sm:text-sm font-extrabold inline-flex items-center gap-2 shadow cursor-pointer"
                  >
                    <CheckCircle2 className="size-4" />
                    <span>{saving ? "Publishing Changes..." : "Publish & Save Landing Page"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
