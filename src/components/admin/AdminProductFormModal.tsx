"use client";

import React, { useState } from "react";
import { X, Upload, Plus, Trash2, Save, CheckCircle2, Star, ArrowLeft, ArrowRight, RefreshCw, ImagePlus } from "lucide-react";
import { Product, SpecificationGroup } from "@/data/products";
import { AdminBrandItem, AdminCategoryItem, ProductAdminExtended } from "@/types/admin";

interface AdminProductFormModalProps {
  initialProduct?: (Product & ProductAdminExtended) | null;
  categories: AdminCategoryItem[];
  brands: AdminBrandItem[];
  allProducts: (Product & ProductAdminExtended)[];
  inline?: boolean;
  onClose?: () => void;
  onSave: (product: Product & ProductAdminExtended) => Promise<void>;
}

const SECTIONS = [
  "1. Basic Info",
  "2. Product Images",
  "3. Pricing",
  "4. Inventory",
  "5. Categories & Brands",
  "6. Specifications",
  "7. Description",
  "8. Warranty",
  "9. EMI Information",
  "10. SEO Settings",
  "11. Tags & Flags",
  "12. Related Products",
];

export const AdminProductFormModal: React.FC<AdminProductFormModalProps> = ({
  initialProduct,
  categories,
  brands,
  allProducts,
  inline = false,
  onClose,
  onSave,
}) => {
  const autoSlugify = (val: string) =>
    val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const [activeSection, setActiveSection] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [slugEdited, setSlugEdited] = useState(Boolean(initialProduct?.slug));
  const [specBulkText, setSpecBulkText] = useState("");
  const [specBulkNotice, setSpecBulkNotice] = useState<string | null>(null);

  const [form, setForm] = useState<Product & ProductAdminExtended>(() => {
    if (initialProduct) return { ...initialProduct };
    const id = `prod-${Date.now().toString().slice(-6)}`;
    return {
      id,
      slug: "",
      title: "",
      brand: brands[0]?.name || "Samsung",
      model: "",
      sku: `RE-${Date.now().toString().slice(-5)}`,
      category: categories[0]?.slug || "television",
      subcategory: categories[0]?.subcategories?.[0]?.slug || "",
      price: 0,
      originalPrice: 0,
      discount: 0,
      stock: 10,
      isStockOut: false,
      rating: 4.8,
      reviewsCount: 0,
      images: [],
      thumbnail: "",
      featured: false,
      hotDeal: false,
      bestSeller: false,
      warranty: "Official Brand Warranty",
      emiAvailable: true,
      emiPlans: [],
      minEmiMonth: 0,
      description: "",
      specifications: [{ group: "General Specifications", items: [{ key: "Brand", value: "" }] }],
      reviews: [],
      questions: [],
      purchasePrice: 0,
      status: "published",
      seoTitle: "",
      seoDescription: "",
      tags: [],
      relatedProductIds: [],
    };
  });

  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDraggingImages, setIsDraggingImages] = useState(false);
  const [tagInput, setTagInput] = useState((form.tags || []).join(", "));

  const handleUploadFiles = async (fileList: FileList | File[], replaceIdx?: number) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const picked = Array.from(fileList).filter((f) => {
      const extOk = /\.(jpe?g|png|webp)$/i.test(f.name);
      return allowedTypes.includes(f.type.toLowerCase()) || extOk;
    });
    if (picked.length === 0) {
      setUploadError("Please select valid JPG, JPEG, PNG, or WebP images.");
      return;
    }

    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      picked.forEach((f) => fd.append("files", f));
      fd.append("folder", "rango_products");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || data?.error) {
        setUploadError(data?.error || "Image upload failed.");
        return;
      }
      const urls: string[] = Array.isArray(data?.urls)
        ? data.urls
        : data?.url
          ? [data.url]
          : [];
      if (urls.length === 0) {
        setUploadError("No image URL returned from server.");
        return;
      }

      setForm((prev) => {
        const existing = [...(prev.images || [])];
        if (typeof replaceIdx === "number" && replaceIdx >= 0 && replaceIdx < existing.length) {
          const oldUrl = existing[replaceIdx];
          existing[replaceIdx] = urls[0];
          const extra = urls.slice(1);
          const nextImages = [...existing, ...extra];
          const nextThumb = prev.thumbnail === oldUrl ? urls[0] : prev.thumbnail || nextImages[0] || "";
          return { ...prev, thumbnail: nextThumb, images: nextImages };
        }
        const nextImages = [...existing, ...urls];
        return {
          ...prev,
          thumbnail: prev.thumbnail || nextImages[0] || "",
          images: nextImages,
        };
      });
    } catch {
      setUploadError("Upload request failed. Please retry.");
    } finally {
      setUploading(false);
    }
  };

  const moveImage = (idx: number, delta: -1 | 1) => {
    setForm((prev) => {
      const imgs = [...(prev.images || [])];
      const target = idx + delta;
      if (target < 0 || target >= imgs.length) return prev;
      [imgs[idx], imgs[target]] = [imgs[target], imgs[idx]];
      return { ...prev, images: imgs };
    });
  };

  const handlePriceUpdate = (price: number, originalPrice: number) => {
    const disc =
      originalPrice > price && originalPrice > 0
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0;
    const minEmiMonth = form.emiAvailable ? Math.round(price / 36) : 0;
    setForm((prev) => ({ ...prev, price, originalPrice, discount: disc, minEmiMonth }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const slug =
        form.slug?.trim() ||
        form.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      const thumb = form.thumbnail || form.images?.[0] || "/logo.png";
      const imgs = form.images?.length ? form.images : [thumb];
      const tags = tagInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await onSave({
        ...form,
        slug,
        thumbnail: thumb,
        images: imgs,
        tags,
        isStockOut: Number(form.stock || 0) <= 0,
      });
      if (onClose) onClose();
    } finally {
      setSaving(false);
    }
  };

  const selectedCatObj = categories.find((c) => c.slug === form.category);

  const formInner = (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-[#0084C7] to-[#006DA6] text-white flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold">
            {initialProduct ? `Edit Product: ${initialProduct.title}` : "Add New Enterprise Product"}
          </h2>
          <p className="text-xs text-sky-100">
            Complete 12-Section Product Specification, Pricing, Stock, SEO &amp; Gallery
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/15"
            aria-label="Close product form"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      {/* Section Navigation Pills */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex gap-1.5 overflow-x-auto">
        {SECTIONS.map((label, idx) => (
          <button
            key={label}
            type="button"
            onClick={() => setActiveSection(idx)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              activeSection === idx
                ? "bg-[#0084C7] text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-sky-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Section Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {activeSection === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Product Title *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => {
                  const nextTitle = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    title: nextTitle,
                    slug: slugEdited ? prev.slug : autoSlugify(nextTitle),
                  }));
                }}
                placeholder="e.g., Samsung 55 Inch Crystal UHD 4K Smart TV"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-[#0084C7]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                SEO URL Slug (Auto-Generated from Title)
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    setForm({ ...form, slug: autoSlugify(e.target.value) });
                  }}
                  placeholder="auto-generated-from-title"
                  className="flex-1 h-11 px-3.5 rounded-xl border border-slate-300 text-sm font-mono outline-none focus:border-[#0084C7]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSlugEdited(false);
                    setForm((prev) => ({ ...prev, slug: autoSlugify(prev.title) }));
                  }}
                  title="Regenerate SEO slug from title"
                  className="px-3 h-11 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-[#0084C7] hover:bg-sky-50 cursor-pointer shrink-0"
                >
                  Auto
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">SKU Code</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-[#0084C7]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Model Number</label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-[#0084C7]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Publication Status</label>
              <select
                value={form.status || "published"}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-[#0084C7] bg-white"
              >
                <option value="published">Published (Live on Store)</option>
                <option value="draft">Draft (Hidden from Store)</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        )}

        {activeSection === 1 && (
          <div className="space-y-4">
            {/* Drag & Drop Multi-File Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingImages(true);
              }}
              onDragLeave={() => setIsDraggingImages(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingImages(false);
                if (e.dataTransfer.files?.length) {
                  handleUploadFiles(e.dataTransfer.files);
                }
              }}
              className={`rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
                isDraggingImages
                  ? "border-[#0084C7] bg-sky-50"
                  : "border-slate-300 bg-slate-50/60 hover:border-slate-400"
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="size-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[#0084C7]">
                  <ImagePlus className="size-5" />
                </div>
                <p className="text-xs font-semibold text-slate-700">
                  Drag &amp; drop multiple product images here, or browse files
                </p>
                <p className="text-[11px] text-slate-500">
                  Supports JPG, JPEG, PNG, WebP (up to 10MB each). Click any uploaded image below to set it as the Featured Image.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2.5 mt-1">
                  <label className="px-4 py-2 rounded-lg bg-[#0084C7] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer hover:bg-[#006DA6]">
                    <Upload className="size-4" />
                    <span>{uploading ? "Uploading..." : "Select Multiple Images"}</span>
                    <input
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.length) {
                          handleUploadFiles(e.target.files);
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            {uploadError && (
              <div className="px-3.5 py-2.5 rounded-lg border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700">
                {uploadError}
              </div>
            )}

            <div className="flex flex-1 min-w-[240px] gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Or paste external image URL..."
                className="flex-1 h-10 px-3 rounded-lg border border-slate-300 text-xs outline-none focus:border-[#0084C7]"
              />
              <button
                type="button"
                onClick={() => {
                  const clean = newImageUrl.trim();
                  if (!clean) return;
                  setForm((prev) => ({
                    ...prev,
                    thumbnail: prev.thumbnail || clean,
                    images: [...(prev.images || []), clean],
                  }));
                  setNewImageUrl("");
                }}
                className="px-4 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-900"
              >
                Add URL
              </button>
            </div>

            {(form.images || []).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No product images uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(form.images || []).map((img, i) => {
                  const isFeatured = form.thumbnail === img;
                  return (
                    <div
                      key={`${img}-${i}`}
                      className={`relative rounded-xl border p-2.5 bg-white transition-all ${
                        isFeatured ? "border-[#0084C7] ring-2 ring-[#0084C7]/20" : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            isFeatured
                              ? "bg-[#0084C7] text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {isFeatured && <Star className="size-2.5 fill-current" />}
                          {isFeatured ? "Featured" : `Image #${i + 1}`}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={i === 0}
                            onClick={() => moveImage(i, -1)}
                            title="Move Left"
                            className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30"
                          >
                            <ArrowLeft className="size-3" />
                          </button>
                          <button
                            type="button"
                            disabled={i === (form.images || []).length - 1}
                            onClick={() => moveImage(i, 1)}
                            title="Move Right"
                            className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30"
                          >
                            <ArrowRight className="size-3" />
                          </button>
                        </div>
                      </div>

                      <div className="w-full h-28 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
                        <img src={img} alt={`Product ${i + 1}`} className="w-full h-full object-contain p-1" />
                      </div>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, thumbnail: img }))}
                          className={`px-2 py-1 rounded font-bold transition-colors ${
                            isFeatured
                              ? "bg-sky-50 text-[#0084C7]"
                              : "bg-slate-100 text-slate-700 hover:bg-sky-50 hover:text-[#0084C7]"
                          }`}
                        >
                          {isFeatured ? "Featured Image" : "Set Featured"}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <label
                            title="Replace this image"
                            className="px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold cursor-pointer inline-flex items-center gap-1"
                          >
                            <RefreshCw className="size-3" />
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.length) {
                                  handleUploadFiles(e.target.files, i);
                                  e.target.value = "";
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => {
                                const nextImgs = (prev.images || []).filter((_, idx) => idx !== i);
                                const nextThumb =
                                  prev.thumbnail === img ? nextImgs[0] || "" : prev.thumbnail;
                                return {
                                  ...prev,
                                  thumbnail: nextThumb,
                                  images: nextImgs,
                                };
                              })
                            }
                            className="px-2 py-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeSection === 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Regular Price (৳)</label>
              <input
                type="number"
                value={form.originalPrice}
                onChange={(e) => handlePriceUpdate(form.price, Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Sale / Offer Price (৳) *</label>
              <input
                type="number"
                required
                value={form.price}
                onChange={(e) => handlePriceUpdate(Number(e.target.value), form.originalPrice)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Discount (%)</label>
              <input
                type="number"
                readOnly
                value={form.discount}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-emerald-700"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Purchase Cost Price (৳)</label>
              <input
                type="number"
                value={form.purchasePrice || 0}
                onChange={(e) => setForm({ ...form, purchasePrice: Number(e.target.value) })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>
        )}

        {activeSection === 3 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Available Stock Units</label>
              <input
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) =>
                  setForm({
                    ...form,
                    stock: Number(e.target.value),
                    isStockOut: Number(e.target.value) <= 0,
                  })
                }
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 w-full cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isStockOut}
                  onChange={(e) => setForm({ ...form, isStockOut: e.target.checked })}
                  className="size-4 accent-[#0084C7]"
                />
                <span className="text-xs font-bold text-slate-700">Mark as Out of Stock</span>
              </label>
            </div>
          </div>
        )}

        {activeSection === 4 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Primary Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Subcategory</label>
              <select
                value={form.subcategory}
                onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                <option value="">General</option>
                {(selectedCatObj?.subcategories || []).map((s) => (
                  <option key={s.id} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Brand</label>
              <select
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeSection === 5 && (
          <div className="space-y-4">
            {/* ChatGPT / Bulk Spec Paste Area */}
            <div className="p-4 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50/80 to-orange-50/40 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-extrabold text-slate-900">
                    Quick Paste Specifications (Copy &amp; Paste from ChatGPT or Product Sheet)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Paste lines like &ldquo;Cooling Capacity: 18,000 BTU&rdquo;, &ldquo;- **Compressor:** Full DC Inverter&rdquo;, tab-separated tables, or bullet lists.
                  </p>
                </div>
                {specBulkNotice && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    {specBulkNotice}
                  </span>
                )}
              </div>
              <textarea
                rows={5}
                value={specBulkText}
                onChange={(e) => setSpecBulkText(e.target.value)}
                placeholder={"General Features\nBrand: Hisense\nCapacity: 1.5 Ton (18,000 BTU)\nCompressor Type: Full DC Inverter\nCondenser: 100% Copper Tube\nWarranty: 10 Years Compressor"}
                className="w-full p-3 rounded-xl border border-slate-300 bg-white text-xs font-mono outline-none focus:border-[#0084C7]"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const parseLines = (raw: string): SpecificationGroup[] => {
                      const cleaned = raw
                        .replace(/<\/li>/gi, "\n")
                        .replace(/<[^>]+>/g, " ")
                        .replace(/\*\*/g, "");
                      const lines = cleaned
                        .split(/\r?\n/)
                        .map((l) => l.replace(/^[\s\-•*]+/, "").trim())
                        .filter(Boolean);

                      const groups: SpecificationGroup[] = [];
                      let current: SpecificationGroup = {
                        group: "General Specifications",
                        items: [],
                      };

                      for (const line of lines) {
                        const kvMatch = line.match(/^([^:|\t—–-]{2,60}?)\s*(?::|\||\t|—|–)\s*(.+)$/);
                        if (kvMatch) {
                          current.items.push({
                            key: kvMatch[1].trim(),
                            value: kvMatch[2].trim(),
                          });
                        } else if (line.endsWith(":")) {
                          if (current.items.length > 0) groups.push(current);
                          current = {
                            group: line.slice(0, -1).trim() || "Technical Specifications",
                            items: [],
                          };
                        } else if (line.length <= 50 && !line.includes(".")) {
                          if (current.items.length > 0) groups.push(current);
                          current = { group: line, items: [] };
                        } else {
                          current.items.push({ key: "Feature", value: line });
                        }
                      }
                      if (current.items.length > 0) groups.push(current);
                      return groups;
                    };

                    const parsed = parseLines(specBulkText);
                    if (parsed.length === 0) {
                      setSpecBulkNotice("No specification lines detected");
                      return;
                    }
                    const totalRows = parsed.reduce((s, g) => s + g.items.length, 0);
                    setForm((prev) => ({ ...prev, specifications: parsed }));
                    setSpecBulkNotice(`Applied ${totalRows} specs in ${parsed.length} group(s)!`);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0084C7] to-[#006DA6] text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  Apply Pasted Specifications
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSpecBulkText("");
                    setSpecBulkNotice(null);
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Clear Box
                </button>
              </div>
            </div>

            {(form.specifications || []).map((grp: SpecificationGroup, gIdx: number) => (
              <div key={gIdx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={grp.group}
                    onChange={(e) => {
                      const next = [...(form.specifications || [])];
                      next[gIdx] = { ...grp, group: e.target.value };
                      setForm({ ...form, specifications: next });
                    }}
                    placeholder="Specification Group Name"
                    className="flex-1 h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...(form.specifications || [])];
                      next[gIdx] = { ...grp, items: [...grp.items, { key: "", value: "" }] };
                      setForm({ ...form, specifications: next });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#0084C7] text-white text-xs font-bold"
                  >
                    + Row
                  </button>
                </div>
                {grp.items.map((item, rIdx) => (
                  <div key={rIdx} className="flex gap-2">
                    <input
                      type="text"
                      value={item.key}
                      placeholder="Feature (e.g. Capacity)"
                      onChange={(e) => {
                        const next = [...(form.specifications || [])];
                        next[gIdx].items[rIdx] = { ...item, key: e.target.value };
                        setForm({ ...form, specifications: next });
                      }}
                      className="w-1/3 h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                    <input
                      type="text"
                      value={item.value}
                      placeholder="Value (e.g. 1.5 Ton Full DC)"
                      onChange={(e) => {
                        const next = [...(form.specifications || [])];
                        next[gIdx].items[rIdx] = { ...item, value: e.target.value };
                        setForm({ ...form, specifications: next });
                      }}
                      className="flex-1 h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...(form.specifications || [])];
                        next[gIdx].items = grp.items.filter((_, idx) => idx !== rIdx);
                        setForm({ ...form, specifications: next });
                      }}
                      className="p-2 text-rose-500"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  specifications: [
                    ...(form.specifications || []),
                    { group: "Technical Details", items: [{ key: "", value: "" }] },
                  ],
                })
              }
              className="px-4 py-2 rounded-xl border border-dashed border-[#0084C7] text-[#0084C7] text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="size-4" />
              <span>Add Specification Group</span>
            </button>
          </div>
        )}

        {activeSection === 6 && (
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Detailed Product Description
            </label>
            <textarea
              rows={8}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Write comprehensive overview, highlights, and feature details..."
              className="w-full p-3.5 rounded-2xl border border-slate-300 text-sm outline-none focus:border-[#0084C7]"
            />
          </div>
        )}

        {activeSection === 7 && (
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Official Brand Warranty Details
            </label>
            <input
              type="text"
              value={form.warranty}
              onChange={(e) => setForm({ ...form, warranty: e.target.value })}
              placeholder="e.g. 10 Years Compressor + 2 Years Parts Official Warranty"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-[#0084C7]"
            />
          </div>
        )}

        {activeSection === 8 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={form.emiAvailable}
                onChange={(e) => setForm({ ...form, emiAvailable: e.target.checked })}
                className="size-4 accent-[#0084C7]"
              />
              <div>
                <p className="text-xs font-bold text-slate-800">Enable 0% EMI Facility</p>
                <p className="text-[11px] text-slate-500">Show partner bank EMI calculator on product page</p>
              </div>
            </label>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Min Monthly EMI (৳)</label>
              <input
                type="number"
                value={form.minEmiMonth}
                onChange={(e) => setForm({ ...form, minEmiMonth: Number(e.target.value) })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>
        )}

        {activeSection === 9 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">SEO Meta Title</label>
              <input
                type="text"
                value={form.seoTitle || ""}
                onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                placeholder="Custom SEO title (leave blank to use product title)"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">SEO Meta Description</label>
              <textarea
                rows={4}
                value={form.seoDescription || ""}
                onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
                placeholder="Search engine snippet summary (140–160 characters recommended)"
                className="w-full p-3.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>
        )}

        {activeSection === 10 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: "featured", label: "Featured Product" },
                { key: "hotDeal", label: "Hot Deal / Flash Offer" },
                { key: "bestSeller", label: "Best Seller Badge" },
              ].map((flag) => (
                <label
                  key={flag.key}
                  className="flex items-center gap-2.5 p-3.5 rounded-2xl border border-slate-200 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={Boolean((form as any)[flag.key])}
                    onChange={(e) => setForm({ ...form, [flag.key]: e.target.checked })}
                    className="size-4 accent-[#0084C7]"
                  />
                  <span className="text-xs font-bold text-slate-800">{flag.label}</span>
                </label>
              ))}
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Product Search Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="e.g. 4k-tv, inverter, energy-saving, official-warranty"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>
        )}

        {activeSection === 11 && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              Select up to 6 related products to cross-sell on this product page:
            </p>
            <div className="max-h-64 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allProducts
                .filter((p) => p.id !== form.id)
                .slice(0, 40)
                .map((p) => {
                  const checked = (form.relatedProductIds || []).includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer ${
                        checked ? "border-[#0084C7] bg-[#E0F2FE]/50" : "border-slate-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const prevIds = form.relatedProductIds || [];
                          setForm({
                            ...form,
                            relatedProductIds: e.target.checked
                              ? [...prevIds, p.id]
                              : prevIds.filter((id) => id !== p.id),
                          });
                        }}
                        className="accent-[#0084C7]"
                      />
                      <span className="truncate font-semibold text-slate-800">{p.title}</span>
                    </label>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Wizard Step & Save Bar */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={activeSection === 0}
            onClick={() => setActiveSection((s) => Math.max(0, s - 1))}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 disabled:opacity-40 cursor-pointer hover:bg-slate-100"
          >
            <ArrowLeft className="size-3.5" />
            <span>Previous</span>
          </button>
          {activeSection < SECTIONS.length - 1 && (
            <button
              type="button"
              onClick={() => setActiveSection((s) => Math.min(SECTIONS.length - 1, s + 1))}
              className="px-4 py-2 rounded-xl bg-[#FF7A00] text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-xs cursor-pointer hover:opacity-95"
            >
              <span>Next: {SECTIONS[activeSection + 1].replace(/^\d+\.\s*/, "")}</span>
              <ArrowRight className="size-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0084C7] to-[#006DA6] text-white text-xs font-extrabold inline-flex items-center gap-2 shadow cursor-pointer"
          >
            <Save className="size-4" />
            <span>{saving ? "Saving Product..." : "Save Product"}</span>
          </button>
        </div>
      </div>
    </form>
  );

  if (inline) return formInner;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-4xl h-[88vh]">{formInner}</div>
    </div>
  );
};
