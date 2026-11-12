"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Download,
  Upload,
  Trash2,
  Edit3,
  Star,
  HelpCircle,
  Layers,
  Award,
  CheckCircle2,
  XCircle,
  ExternalLink,
  MessageSquareReply,
  FolderTree,
} from "lucide-react";
import { Product } from "@/data/products";
import {
  AdminBrandItem,
  AdminCategoryItem,
  AdminDatabase,
  AdminSubcategoryItem,
  AdminTabId,
  ProductAdminExtended,
  ProductQuestionRecord,
  ProductReviewRecord,
} from "@/types/admin";
import { AdminProductFormModal } from "@/components/admin/AdminProductFormModal";

interface AdminCatalogModuleProps {
  activeTab: AdminTabId;
  db: AdminDatabase;
  products: (Product & ProductAdminExtended)[];
  onNavigate: (tab: AdminTabId) => void;
  onAction: (action: string, payload: Record<string, unknown>, msg?: string) => Promise<boolean>;
  onPersistPatch: (section: string, permKey: string, desc: string, patch: Partial<AdminDatabase>) => Promise<boolean>;
  quickIntent?: string | null;
  onConsumeQuickIntent?: () => void;
}

export const AdminCatalogModule: React.FC<AdminCatalogModuleProps> = ({
  activeTab,
  db,
  products,
  onNavigate,
  onAction,
  onPersistPatch,
  quickIntent,
  onConsumeQuickIntent,
}) => {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"title" | "price_asc" | "price_desc" | "stock_asc">("title");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkValue, setBulkValue] = useState("");
  const [editingProduct, setEditingProduct] = useState<(Product & ProductAdminExtended) | null>(null);

  // Category CRUD state
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState<Partial<AdminCategoryItem>>({
    name: "",
    slug: "",
    description: "",
    image: "",
    icon: "",
    seoTitle: "",
    seoDescription: "",
    displayOrder: (db.categories || []).length + 1,
    active: true,
  });

  // Subcategory CRUD state
  const [editingSubcatId, setEditingSubcatId] = useState<string | null>(null);
  const [editingSubcatParentId, setEditingSubcatParentId] = useState<string>("");
  const [subcatParentId, setSubcatParentId] = useState<string>((db.categories || [])[0]?.id || "");
  const [subcatForm, setSubcatForm] = useState<Partial<AdminSubcategoryItem>>({
    name: "",
    slug: "",
    description: "",
    image: "",
    seoTitle: "",
    seoDescription: "",
    displayOrder: 1,
    active: true,
  });

  // Brand CRUD state
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [brandForm, setBrandForm] = useState<Partial<AdminBrandItem>>({
    name: "",
    slug: "",
    country: "Global",
    logo: "",
    description: "",
    seoTitle: "",
    seoDescription: "",
    authorized: true,
    active: true,
  });

  // Review & Q&A Moderation state
  const [reviewFilter, setReviewFilter] = useState<"All" | "Pending" | "Approved" | "Rejected">("All");
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewPage, setReviewPage] = useState(1);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editReviewDraft, setEditReviewDraft] = useState<{ rating: number; title: string; comment: string }>({
    rating: 5,
    title: "",
    comment: "",
  });
  const [qnaFilter, setQnaFilter] = useState<"All" | "Pending" | "Answered" | "Hidden">("All");
  const [qnaSearch, setQnaSearch] = useState("");
  const [qnaPage, setQnaPage] = useState(1);
  const [newQna, setNewQna] = useState({
    productId: products[0]?.id || "",
    customerName: "",
    question: "",
    answer: "",
  });
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null);

  useEffect(() => {
    if (!quickIntent) return;
    if (quickIntent === "add_product") {
      onNavigate("add-product");
      onConsumeQuickIntent?.();
    } else if (quickIntent === "add_category" || quickIntent === "add_subcategory" || quickIntent === "add_brand") {
      onConsumeQuickIntent?.();
    }
  }, [quickIntent, onNavigate, onConsumeQuickIntent]);

  const uploadSingleAsset = async (
    file: File,
    folder: string,
    key: string,
    onUrl: (url: string) => void
  ) => {
    setUploadingAsset(key);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data?.url) onUrl(data.url);
    } finally {
      setUploadingAsset(null);
    }
  };

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase();
    return products
      .filter((p) => {
        if (q) {
          const hit =
            p.title.toLowerCase().includes(q) ||
            (p.sku || "").toLowerCase().includes(q) ||
            (p.model || "").toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q);
          if (!hit) return false;
        }
        if (catFilter !== "all" && p.category !== catFilter) return false;
        if (brandFilter !== "all" && p.brand !== brandFilter) return false;
        if (statusFilter !== "all" && (p.status || "published") !== statusFilter) return false;
        const stk = typeof p.stock === "number" ? p.stock : 10;
        const th = Number(db.settings?.lowStockThreshold ?? 5);
        if (stockFilter === "low" && !(stk > 0 && stk <= th)) return false;
        if (stockFilter === "out" && stk > 0 && !p.isStockOut) return false;
        if (stockFilter === "in" && (stk <= 0 || p.isStockOut)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") return a.price - b.price;
        if (sortBy === "price_desc") return b.price - a.price;
        if (sortBy === "stock_asc") return (a.stock ?? 10) - (b.stock ?? 10);
        return a.title.localeCompare(b.title);
      });
  }, [products, search, catFilter, brandFilter, stockFilter, statusFilter, sortBy, db.settings]);

  const handleExportCsv = () => {
    const header = "ID,Title,SKU,Model,Brand,Category,Price,OriginalPrice,Stock,Status";
    const rows = filteredProducts.map((p) =>
      [
        p.id,
        `"${(p.title || "").replace(/"/g, '""')}"`,
        p.sku || "",
        p.model || "",
        p.brand,
        p.category,
        p.price,
        p.originalPrice || p.price,
        p.stock ?? 10,
        p.status || "published",
      ].join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rango-products-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCsv = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return;
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    for (const line of lines.slice(1)) {
      const cols = line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
      const getCol = (k: string) => cols[headers.indexOf(k)] || "";
      const title = getCol("title");
      if (!title) continue;
      const price = Number(getCol("price") || 0);
      const originalPrice = Number(getCol("originalprice") || price);
      const stock = Number(getCol("stock") || 10);
      await onAction("upsert_product", {
        product: {
          id: getCol("id") || `csv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          title,
          sku: getCol("sku") || `RE-${Date.now().toString().slice(-5)}`,
          model: getCol("model") || "",
          brand: getCol("brand") || "Samsung",
          category: getCol("category") || "television",
          subcategory: "",
          price,
          originalPrice,
          discount: originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0,
          stock,
          isStockOut: stock <= 0,
          rating: "4.8",
          reviewsCount: 0,
          images: ["/logo.png"],
          thumbnail: "/logo.png",
          featured: false,
          hotDeal: false,
          bestSeller: false,
          warranty: "Official Brand Warranty",
          emiAvailable: true,
          emiPlans: [],
          minEmiMonth: Math.round(price / 36),
          description: title,
          specifications: [],
          reviews: [],
          questions: [],
          status: "published",
        },
      });
    }
  };

  if (activeTab === "add-product") {
    return (
      <AdminProductFormModal
        inline
        categories={db.categories || []}
        brands={db.brands || []}
        allProducts={products}
        onSave={async (prod) => {
          await onAction("upsert_product", { product: prod }, `Created product "${prod.title}"`);
          onNavigate("products");
        }}
      />
    );
  }

  const slugify = (val: string) =>
    val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  if (activeTab === "categories") {
    const categoriesList = [...(db.categories || [])].sort(
      (a, b) => (a.displayOrder || 99) - (b.displayOrder || 99)
    );

    const resetCatForm = () => {
      setEditingCatId(null);
      setCatForm({
        name: "",
        slug: "",
        description: "",
        image: "",
        icon: "",
        seoTitle: "",
        seoDescription: "",
        displayOrder: categoriesList.length + 1,
        active: true,
      });
    };

    const resetSubcatForm = () => {
      setEditingSubcatId(null);
      setEditingSubcatParentId("");
      setSubcatParentId(categoriesList[0]?.id || "");
      setSubcatForm({
        name: "",
        slug: "",
        description: "",
        image: "",
        seoTitle: "",
        seoDescription: "",
        displayOrder: 1,
        active: true,
      });
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Category Form */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="size-5 text-[#0084C7]" />
                <span>{editingCatId ? "Edit Category" : "Create New Category"}</span>
              </h2>
              {editingCatId && (
                <button
                  type="button"
                  onClick={resetCatForm}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Air Conditioner"
                  value={catForm.name || ""}
                  onChange={(e) => {
                    const name = e.target.value;
                    setCatForm((prev) => ({
                      ...prev,
                      name,
                      slug: editingCatId ? prev.slug : slugify(name),
                    }));
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs outline-none focus:border-[#0084C7]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Category Slug *</label>
                <input
                  type="text"
                  placeholder="air-conditioner"
                  value={catForm.slug || ""}
                  onChange={(e) => setCatForm({ ...catForm, slug: slugify(e.target.value) })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs outline-none focus:border-[#0084C7]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={catForm.displayOrder ?? 1}
                  onChange={(e) => setCatForm({ ...catForm, displayOrder: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs outline-none focus:border-[#0084C7]"
                />
              </div>
              <div className="flex items-end">
                <label className="w-full h-10 flex items-center gap-2 px-3 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={catForm.active !== false}
                    onChange={(e) => setCatForm({ ...catForm, active: e.target.checked })}
                  />
                  <span>Active on Storefront</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Category Description</label>
              <textarea
                rows={2}
                placeholder="Short category overview for customers and search engines..."
                value={catForm.description || ""}
                onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs outline-none focus:border-[#0084C7]"
              />
            </div>

            {/* Category Image & Icon Uploads */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">Category Image</span>
                  <label className="px-2.5 py-1 rounded bg-[#0084C7] text-white text-[10px] font-bold cursor-pointer hover:bg-[#006DA6]">
                    {uploadingAsset === "cat-img" ? "Uploading..." : "Upload Image"}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadSingleAsset(f, "rango_categories", "cat-img", (url) => setCatForm((p) => ({ ...p, image: url })));
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                {catForm.image && (
                  <div className="flex items-center gap-2">
                    <img src={catForm.image} alt="Category" className="size-11 rounded object-contain bg-white border border-slate-200 p-1" />
                    <button
                      type="button"
                      onClick={() => setCatForm({ ...catForm, image: "" })}
                      className="text-[11px] text-rose-600 font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">Category Icon</span>
                  <label className="px-2.5 py-1 rounded bg-slate-800 text-white text-[10px] font-bold cursor-pointer hover:bg-slate-900">
                    {uploadingAsset === "cat-icon" ? "Uploading..." : "Upload Icon"}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadSingleAsset(f, "rango_categories", "cat-icon", (url) => setCatForm((p) => ({ ...p, icon: url })));
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                {catForm.icon && (
                  <div className="flex items-center gap-2">
                    <img src={catForm.icon} alt="Icon" className="size-11 rounded object-contain bg-white border border-slate-200 p-1" />
                    <button
                      type="button"
                      onClick={() => setCatForm({ ...catForm, icon: "" })}
                      className="text-[11px] text-rose-600 font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">SEO Title</label>
                <input
                  type="text"
                  placeholder="Buy Air Conditioner in Bangladesh | Rango Electronics"
                  value={catForm.seoTitle || ""}
                  onChange={(e) => setCatForm({ ...catForm, seoTitle: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs outline-none focus:border-[#0084C7]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Meta Description</label>
                <input
                  type="text"
                  placeholder="Best official ACs with EMI & warranty..."
                  value={catForm.seoDescription || ""}
                  onChange={(e) => setCatForm({ ...catForm, seoDescription: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs outline-none focus:border-[#0084C7]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                if (!catForm.name?.trim()) return;
                const cleanSlug = slugify(catForm.slug || catForm.name);
                if (editingCatId) {
                  const updated = (db.categories || []).map((c) =>
                    c.id === editingCatId
                      ? {
                          ...c,
                          name: catForm.name!.trim(),
                          slug: cleanSlug,
                          description: catForm.description || "",
                          image: catForm.image || "",
                          icon: catForm.icon || "",
                          seoTitle: catForm.seoTitle || "",
                          seoDescription: catForm.seoDescription || "",
                          displayOrder: Number(catForm.displayOrder || 1),
                          active: catForm.active !== false,
                        }
                      : c
                  );
                  await onPersistPatch("Categories", "categories", `Updated category ${catForm.name}`, {
                    categories: updated,
                  });
                } else {
                  const newCat: AdminCategoryItem = {
                    id: `cat-${Date.now()}`,
                    name: catForm.name.trim(),
                    slug: cleanSlug,
                    description: catForm.description || "",
                    image: catForm.image || "",
                    icon: catForm.icon || "",
                    seoTitle: catForm.seoTitle || "",
                    seoDescription: catForm.seoDescription || "",
                    displayOrder: Number(catForm.displayOrder || categoriesList.length + 1),
                    active: catForm.active !== false,
                    subcategories: [],
                  };
                  await onPersistPatch("Categories", "categories", `Created category ${newCat.name}`, {
                    categories: [...(db.categories || []), newCat],
                  });
                }
                resetCatForm();
              }}
              className="h-10 px-5 rounded-lg bg-[#0084C7] hover:bg-[#006DA6] text-white text-xs font-bold cursor-pointer"
            >
              {editingCatId ? "Update Category" : "+ Create Category"}
            </button>
          </div>

          {/* Subcategory Form */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FolderTree className="size-5 text-[#FF7A00]" />
                <span>{editingSubcatId ? "Edit Subcategory" : "Create New Subcategory"}</span>
              </h2>
              {editingSubcatId && (
                <button
                  type="button"
                  onClick={resetSubcatForm}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Parent Category *</label>
                <select
                  value={subcatParentId}
                  onChange={(e) => setSubcatParentId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs font-semibold outline-none focus:border-[#0084C7]"
                >
                  <option value="">Select Parent Category...</option>
                  {categoriesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (/{c.slug})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Subcategory Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Inverter Split AC"
                  value={subcatForm.name || ""}
                  onChange={(e) => {
                    const name = e.target.value;
                    setSubcatForm((prev) => ({
                      ...prev,
                      name,
                      slug: editingSubcatId ? prev.slug : slugify(name),
                    }));
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs outline-none focus:border-[#0084C7]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Subcategory Slug *</label>
                <input
                  type="text"
                  placeholder="inverter-split-ac"
                  value={subcatForm.slug || ""}
                  onChange={(e) => setSubcatForm({ ...subcatForm, slug: slugify(e.target.value) })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs outline-none focus:border-[#0084C7]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={subcatForm.displayOrder ?? 1}
                  onChange={(e) => setSubcatForm({ ...subcatForm, displayOrder: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs outline-none focus:border-[#0084C7]"
                />
              </div>
              <div className="flex items-end">
                <label className="w-full h-10 flex items-center gap-2 px-3 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subcatForm.active !== false}
                    onChange={(e) => setSubcatForm({ ...subcatForm, active: e.target.checked })}
                  />
                  <span>Active Subcategory</span>
                </label>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {subcatForm.image ? (
                  <img src={subcatForm.image} alt="Subcategory" className="size-11 rounded object-contain bg-white border border-slate-200 p-1" />
                ) : (
                  <span className="text-[11px] font-semibold text-slate-500">Subcategory Image (optional)</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {subcatForm.image && (
                  <button
                    type="button"
                    onClick={() => setSubcatForm({ ...subcatForm, image: "" })}
                    className="text-[11px] text-rose-600 font-semibold"
                  >
                    Remove
                  </button>
                )}
                <label className="px-3 py-1.5 rounded bg-[#0084C7] text-white text-[11px] font-bold cursor-pointer hover:bg-[#006DA6]">
                  {uploadingAsset === "subcat-img" ? "Uploading..." : "Upload Image"}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadSingleAsset(f, "rango_categories", "subcat-img", (url) => setSubcatForm((p) => ({ ...p, image: url })));
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">SEO Title</label>
                <input
                  type="text"
                  value={subcatForm.seoTitle || ""}
                  onChange={(e) => setSubcatForm({ ...subcatForm, seoTitle: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs outline-none focus:border-[#0084C7]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Meta Description</label>
                <input
                  type="text"
                  value={subcatForm.seoDescription || ""}
                  onChange={(e) => setSubcatForm({ ...subcatForm, seoDescription: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs outline-none focus:border-[#0084C7]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                if (!subcatParentId || !subcatForm.name?.trim()) return;
                const cleanSlug = slugify(subcatForm.slug || subcatForm.name);
                const subPayload: AdminSubcategoryItem = {
                  id: editingSubcatId || `sub-${Date.now()}`,
                  name: subcatForm.name.trim(),
                  slug: cleanSlug,
                  description: subcatForm.description || "",
                  image: subcatForm.image || "",
                  seoTitle: subcatForm.seoTitle || "",
                  seoDescription: subcatForm.seoDescription || "",
                  displayOrder: Number(subcatForm.displayOrder || 1),
                  active: subcatForm.active !== false,
                };

                const nextCats = (db.categories || []).map((c) => {
                  const filtered = (c.subcategories || []).filter(
                    (s) => !(editingSubcatId && c.id === editingSubcatParentId && s.id === editingSubcatId)
                  );
                  if (c.id !== subcatParentId) {
                    return { ...c, subcategories: filtered };
                  }
                  return {
                    ...c,
                    subcategories: [...filtered.filter((s) => s.id !== subPayload.id), subPayload],
                  };
                });

                await onPersistPatch("Categories", "categories", `Saved subcategory ${subPayload.name}`, {
                  categories: nextCats,
                });
                resetSubcatForm();
              }}
              className="h-10 px-5 rounded-lg bg-[#FF7A00] hover:bg-orange-600 text-white text-xs font-bold cursor-pointer"
            >
              {editingSubcatId ? "Update Subcategory" : "+ Add Subcategory"}
            </button>
          </div>
        </div>

        {/* Category & Subcategory Tree */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            All Categories &amp; Subcategories ({categoriesList.length})
          </h3>
          <div className="space-y-3">
            {categoriesList.map((c) => (
              <div key={c.id} className="rounded-xl border border-slate-200 p-4 bg-slate-50/70 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {(c.image || c.icon) ? (
                      <img
                        src={c.image || c.icon}
                        alt={c.name}
                        className="size-12 rounded-lg object-contain bg-white border border-slate-200 p-1"
                      />
                    ) : (
                      <div className="size-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#0084C7]">
                        <Layers className="size-5" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900">{c.name}</p>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.active !== false
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {c.active !== false ? "Active" : "Inactive"}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">Order #{c.displayOrder}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        /category/{c.slug} · {(c.subcategories || []).length} subcategories
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`/category/${c.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-[11px] font-semibold inline-flex items-center gap-1 hover:text-[#0084C7]"
                    >
                      <ExternalLink className="size-3" /> View
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCatId(c.id);
                        setCatForm({ ...c });
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-sky-50 text-[#0084C7] text-[11px] font-bold hover:bg-sky-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onPersistPatch("Categories", "categories", `Removed category ${c.name}`, {
                          categories: (db.categories || []).filter((item) => item.id !== c.id),
                        })
                      }
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {(c.subcategories || []).length > 0 && (
                  <div className="pl-4 sm:pl-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {(c.subcategories || []).map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {sub.image && (
                            <img src={sub.image} alt={sub.name} className="size-8 rounded object-contain bg-slate-50 border border-slate-100" />
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate">{sub.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">/{sub.slug}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSubcatId(sub.id);
                              setEditingSubcatParentId(c.id);
                              setSubcatParentId(c.id);
                              setSubcatForm({ ...sub });
                            }}
                            className="px-2 py-1 rounded bg-sky-50 text-[#0084C7] text-[10px] font-bold"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onPersistPatch("Categories", "categories", `Deleted subcategory ${sub.name}`, {
                                categories: (db.categories || []).map((cat) =>
                                  cat.id === c.id
                                    ? { ...cat, subcategories: (cat.subcategories || []).filter((s) => s.id !== sub.id) }
                                    : cat
                                ),
                              })
                            }
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "brands") {
    const resetBrandForm = () => {
      setEditingBrandId(null);
      setBrandForm({
        name: "",
        slug: "",
        country: "Global",
        logo: "",
        description: "",
        seoTitle: "",
        seoDescription: "",
        authorized: true,
        active: true,
      });
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="size-5 text-[#0084C7]" />
              <span>{editingBrandId ? "Edit Brand" : "Add New Brand"}</span>
            </h2>
            {editingBrandId && (
              <button
                type="button"
                onClick={resetBrandForm}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Brand Name *</label>
              <input
                type="text"
                placeholder="e.g. Samsung"
                value={brandForm.name || ""}
                onChange={(e) => {
                  const name = e.target.value;
                  setBrandForm((prev) => ({
                    ...prev,
                    name,
                    slug: editingBrandId ? prev.slug : slugify(name),
                  }));
                }}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs outline-none focus:border-[#0084C7]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Brand Slug *</label>
              <input
                type="text"
                placeholder="samsung"
                value={brandForm.slug || ""}
                onChange={(e) => setBrandForm({ ...brandForm, slug: slugify(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs outline-none focus:border-[#0084C7]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Origin Country</label>
              <input
                type="text"
                placeholder="South Korea"
                value={brandForm.country || ""}
                onChange={(e) => setBrandForm({ ...brandForm, country: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs outline-none focus:border-[#0084C7]"
              />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex-1 h-10 flex items-center gap-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={brandForm.authorized !== false}
                  onChange={(e) => setBrandForm({ ...brandForm, authorized: e.target.checked })}
                />
                <span>Authorized</span>
              </label>
              <label className="flex-1 h-10 flex items-center gap-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={brandForm.active !== false}
                  onChange={(e) => setBrandForm({ ...brandForm, active: e.target.checked })}
                />
                <span>Active</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Brand Description</label>
              <textarea
                rows={2}
                placeholder="Official warranty & product range details..."
                value={brandForm.description || ""}
                onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs outline-none focus:border-[#0084C7]"
              />
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {brandForm.logo ? (
                  <img src={brandForm.logo} alt="Brand Logo" className="h-12 w-24 rounded object-contain bg-white border border-slate-200 p-1" />
                ) : (
                  <span className="text-[11px] font-semibold text-slate-500">Brand Logo (JPG, PNG, WebP)</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {brandForm.logo && (
                  <button
                    type="button"
                    onClick={() => setBrandForm({ ...brandForm, logo: "" })}
                    className="text-[11px] text-rose-600 font-semibold"
                  >
                    Remove
                  </button>
                )}
                <label className="px-3 py-1.5 rounded bg-[#0084C7] text-white text-[11px] font-bold cursor-pointer hover:bg-[#006DA6]">
                  {uploadingAsset === "brand-logo" ? "Uploading..." : "Upload Logo"}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadSingleAsset(f, "rango_brands", "brand-logo", (url) => setBrandForm((p) => ({ ...p, logo: url })));
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">SEO Title</label>
              <input
                type="text"
                value={brandForm.seoTitle || ""}
                onChange={(e) => setBrandForm({ ...brandForm, seoTitle: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs outline-none focus:border-[#0084C7]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Meta Description</label>
              <input
                type="text"
                value={brandForm.seoDescription || ""}
                onChange={(e) => setBrandForm({ ...brandForm, seoDescription: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs outline-none focus:border-[#0084C7]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              if (!brandForm.name?.trim()) return;
              const cleanSlug = slugify(brandForm.slug || brandForm.name);
              if (editingBrandId) {
                const updated = (db.brands || []).map((b) =>
                  b.id === editingBrandId
                    ? {
                        ...b,
                        name: brandForm.name!.trim(),
                        slug: cleanSlug,
                        country: brandForm.country || "Global",
                        logo: brandForm.logo || "",
                        description: brandForm.description || "",
                        seoTitle: brandForm.seoTitle || "",
                        seoDescription: brandForm.seoDescription || "",
                        authorized: brandForm.authorized !== false,
                        active: brandForm.active !== false,
                      }
                    : b
                );
                await onPersistPatch("Brands", "brands", `Updated brand ${brandForm.name}`, {
                  brands: updated,
                });
              } else {
                const nb: AdminBrandItem = {
                  id: `br-${Date.now()}`,
                  name: brandForm.name.trim(),
                  slug: cleanSlug,
                  country: brandForm.country || "Global",
                  logo: brandForm.logo || "",
                  description: brandForm.description || "",
                  seoTitle: brandForm.seoTitle || "",
                  seoDescription: brandForm.seoDescription || "",
                  authorized: brandForm.authorized !== false,
                  active: brandForm.active !== false,
                };
                await onPersistPatch("Brands", "brands", `Added brand ${nb.name}`, {
                  brands: [...(db.brands || []), nb],
                });
              }
              resetBrandForm();
            }}
            className="h-10 px-5 rounded-lg bg-[#0084C7] hover:bg-[#006DA6] text-white text-xs font-bold cursor-pointer"
          >
            {editingBrandId ? "Update Brand" : "+ Add Brand"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(db.brands || []).map((b) => {
            const count = products.filter((p) => p.brand.toLowerCase() === b.name.toLowerCase()).length;
            return (
              <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  {b.logo ? (
                    <img src={b.logo} alt={b.name} className="h-10 w-14 rounded object-contain bg-slate-50 border border-slate-100 p-1 shrink-0" />
                  ) : (
                    <div className="size-10 rounded bg-sky-50 text-[#0084C7] font-bold text-xs flex items-center justify-center shrink-0">
                      {b.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-slate-900 truncate">{b.name}</p>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          b.active !== false ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {b.active !== false ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      {b.country} · {b.authorized ? "Authorized" : "Standard"} · {count} products
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={`/brand/${b.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    title="View Brand Page"
                    className="p-1.5 text-slate-500 hover:text-[#0084C7] rounded-lg"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBrandId(b.id);
                      setBrandForm({ ...b });
                    }}
                    className="px-2 py-1 rounded bg-sky-50 text-[#0084C7] text-[11px] font-bold"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onPersistPatch("Brands", "brands", `Deleted brand ${b.name}`, {
                        brands: (db.brands || []).filter((item) => item.id !== b.id),
                      })
                    }
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (activeTab === "reviews") {
    const allReviews: ProductReviewRecord[] = db.reviews || [];
    const pendingCount = allReviews.filter((r) => r.status === "Pending").length;
    const rq = reviewSearch.trim().toLowerCase();
    const filteredReviews = allReviews.filter((r) => {
      if (reviewFilter !== "All" && r.status !== reviewFilter) return false;
      if (!rq) return true;
      return (
        (r.productTitle || "").toLowerCase().includes(rq) ||
        (r.customerName || r.userName || "").toLowerCase().includes(rq) ||
        (r.title || "").toLowerCase().includes(rq) ||
        (r.comment || "").toLowerCase().includes(rq)
      );
    });
    const reviewsPerPage = 25;
    const totalReviewPages = Math.max(1, Math.ceil(filteredReviews.length / reviewsPerPage));
    const safeReviewPage = Math.min(reviewPage, totalReviewPages);
    const pagedReviews = filteredReviews.slice(
      (safeReviewPage - 1) * reviewsPerPage,
      safeReviewPage * reviewsPerPage
    );

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Star className="size-5 text-[#FF7A00]" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Customer Review Moderation ({allReviews.length.toLocaleString()})
              </h2>
              <p className="text-[11px] text-slate-500">
                Only Approved reviews appear on the storefront and contribute to dynamic product ratings.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              placeholder="Search product, reviewer, or comment..."
              value={reviewSearch}
              onChange={(e) => {
                setReviewSearch(e.target.value);
                setReviewPage(1);
              }}
              className="h-8 px-3 rounded-lg border border-slate-300 text-xs outline-none focus:border-[#0084C7] w-56"
            />
            <div className="flex flex-wrap gap-1.5">
              {(["All", "Pending", "Approved", "Rejected"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setReviewFilter(tab);
                    setReviewPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    reviewFilter === tab
                      ? "bg-[#0084C7] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab}
                  {tab === "Pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
                </button>
              ))}
            </div>
          </div>
        </div>

        {pagedReviews.length === 0 ? (
          <p className="text-xs text-slate-400 py-10 text-center">
            No {reviewFilter === "All" ? "" : reviewFilter.toLowerCase()} customer reviews found.
          </p>
        ) : (
          <div className="space-y-3">
            {pagedReviews.map((rev) => {
              const isEditing = editingReviewId === rev.id;
              return (
                <div key={rev.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[#0084C7]">{rev.productTitle}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            rev.status === "Approved"
                              ? "bg-emerald-100 text-emerald-700"
                              : rev.status === "Rejected"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {rev.status}
                        </span>
                        {rev.isTestData && (
                          <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-bold">
                            Test Data
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-900">
                        {rev.customerName} ({rev.customerLocation || "Bangladesh"}) · ★ {rev.rating}/5 ·{" "}
                        <span className="text-slate-400 font-normal">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onAction("moderate_review", { id: rev.id, status: "Approved" }, "Review approved")}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="size-3.5" /> Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => onAction("moderate_review", { id: rev.id, status: "Rejected" }, "Review rejected")}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold inline-flex items-center gap-1"
                      >
                        <XCircle className="size-3.5" /> Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingReviewId(isEditing ? null : rev.id);
                          setEditReviewDraft({
                            rating: rev.rating,
                            title: rev.title || "",
                            comment: rev.comment || "",
                          });
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onAction("moderate_review", { id: rev.id, delete: true }, "Review deleted")}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={editReviewDraft.rating}
                          onChange={(e) => setEditReviewDraft({ ...editReviewDraft, rating: Number(e.target.value) })}
                          className="h-9 px-3 rounded-lg border border-slate-300 text-xs"
                        />
                        <input
                          type="text"
                          value={editReviewDraft.title}
                          onChange={(e) => setEditReviewDraft({ ...editReviewDraft, title: e.target.value })}
                          placeholder="Review title"
                          className="sm:col-span-2 h-9 px-3 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={editReviewDraft.comment}
                        onChange={(e) => setEditReviewDraft({ ...editReviewDraft, comment: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-slate-300 text-xs"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          await onAction(
                            "moderate_review",
                            {
                              id: rev.id,
                              rating: editReviewDraft.rating,
                              title: editReviewDraft.title,
                              comment: editReviewDraft.comment,
                            },
                            "Review updated"
                          );
                          setEditingReviewId(null);
                        }}
                        className="px-4 py-1.5 rounded-lg bg-[#0084C7] text-white text-xs font-bold"
                      >
                        Save Changes
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs space-y-1.5">
                      {rev.title && <p className="font-semibold text-slate-900">{rev.title}</p>}
                      <p className="text-slate-600">{rev.comment}</p>
                      {(rev.images || []).length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {rev.images.map((imgUrl, idx) => (
                            <img
                              key={idx}
                              src={imgUrl}
                              alt="Customer upload"
                              className="size-14 rounded-lg object-cover border border-slate-200 bg-white"
                            />
                          ))}
                        </div>
                      )}
                      {rev.adminReply && (
                        <p className="p-2 rounded bg-sky-50 text-[#006DA6] text-[11px] font-medium">
                          Store Reply: {rev.adminReply}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyDrafts[rev.id] ?? rev.adminReply ?? ""}
                      onChange={(e) => setReplyDrafts({ ...replyDrafts, [rev.id]: e.target.value })}
                      placeholder="Write an official admin reply to this review..."
                      className="flex-1 h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const txt = replyDrafts[rev.id];
                        if (!txt?.trim()) return;
                        onAction("moderate_review", { id: rev.id, adminReply: txt.trim() }, "Admin reply saved");
                      }}
                      className="px-3.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <MessageSquareReply className="size-3.5" /> Reply
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalReviewPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Showing {(safeReviewPage - 1) * reviewsPerPage + 1}–
              {Math.min(safeReviewPage * reviewsPerPage, filteredReviews.length)} of{" "}
              {filteredReviews.length.toLocaleString()} reviews
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safeReviewPage <= 1}
                onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <span className="font-bold text-slate-700">
                Page {safeReviewPage} / {totalReviewPages}
              </span>
              <button
                type="button"
                disabled={safeReviewPage >= totalReviewPages}
                onClick={() => setReviewPage((p) => Math.min(totalReviewPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === "qna") {
    const allQuestions: ProductQuestionRecord[] = db.productQuestions || [];
    const filteredQuestions = allQuestions.filter((q) => {
      const matchStatus = qnaFilter === "All" || q.status === qnaFilter;
      const qStr = qnaSearch.trim().toLowerCase();
      const matchQuery =
        !qStr ||
        (q.productTitle || "").toLowerCase().includes(qStr) ||
        (q.question || "").toLowerCase().includes(qStr) ||
        (q.answer || "").toLowerCase().includes(qStr);
      return matchStatus && matchQuery;
    });
    const perPage = 30;
    const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / perPage));
    const safePage = Math.min(qnaPage, totalPages);
    const pagedQuestions = filteredQuestions.slice((safePage - 1) * perPage, safePage * perPage);

    return (
      <div className="space-y-5">
        {/* Add New Product Q&A Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Plus className="size-4 text-[#0084C7]" />
            <span>Add Product Question &amp; Answer</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <select
              value={newQna.productId}
              onChange={(e) => setNewQna({ ...newQna, productId: e.target.value })}
              className="h-9 px-3 rounded-lg border border-slate-300 bg-white lg:col-span-2"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Customer Name (optional)"
              value={newQna.customerName}
              onChange={(e) => setNewQna({ ...newQna, customerName: e.target.value })}
              className="h-9 px-3 rounded-lg border border-slate-300"
            />
            <input
              type="text"
              placeholder="Question *"
              value={newQna.question}
              onChange={(e) => setNewQna({ ...newQna, question: e.target.value })}
              className="h-9 px-3 rounded-lg border border-slate-300 lg:col-span-2"
            />
            <input
              type="text"
              placeholder="Official Answer (optional)"
              value={newQna.answer}
              onChange={(e) => setNewQna({ ...newQna, answer: e.target.value })}
              className="h-9 px-3 rounded-lg border border-slate-300"
            />
            <button
              type="button"
              onClick={async () => {
                if (!newQna.question.trim()) return;
                const prod = products.find((p) => p.id === newQna.productId);
                await onAction(
                  "add_question",
                  {
                    productId: prod?.id || newQna.productId,
                    productTitle: prod?.title || "Product",
                    productSlug: prod?.slug || "",
                    customerName: newQna.customerName || "Verified Shopper",
                    question: newQna.question.trim(),
                    answer: newQna.answer.trim(),
                  },
                  "Added Q&A item"
                );
                setNewQna({ ...newQna, question: "", answer: "" });
              }}
              className="h-9 rounded-lg bg-[#0084C7] text-white font-bold cursor-pointer"
            >
              + Add Q&amp;A
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="size-5 text-[#0084C7]" />
              <h2 className="text-base font-extrabold text-slate-900">
                Product Q&amp;A Moderation ({filteredQuestions.length})
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-64">
                <Search className="size-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={qnaSearch}
                  onChange={(e) => {
                    setQnaSearch(e.target.value);
                    setQnaPage(1);
                  }}
                  placeholder="Search product or question..."
                  className="w-full h-8 pl-8 pr-3 rounded-lg border border-slate-300 text-xs"
                />
              </div>
              <div className="flex gap-1.5">
                {(["All", "Pending", "Answered", "Hidden"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setQnaFilter(tab);
                      setQnaPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      qnaFilter === tab ? "bg-[#0084C7] text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {pagedQuestions.length === 0 ? (
            <p className="text-xs text-slate-400 py-10 text-center">No customer questions match your filter.</p>
          ) : (
            <div className="space-y-3">
              {pagedQuestions.map((q) => (
                <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-[#0084C7]">{q.productTitle}</p>
                      <p className="font-semibold text-slate-900 mt-0.5">
                        Q: {q.question} — <span className="text-slate-500 font-normal">{q.customerName || q.userName}</span>
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        q.status === "Answered" || q.status === "Approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : q.status === "Hidden"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>
                  {q.answer && <p className="text-slate-600">A: {q.answer}</p>}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <input
                      type="text"
                      value={replyDrafts[q.id] ?? q.answer ?? ""}
                      onChange={(e) => setReplyDrafts({ ...replyDrafts, [q.id]: e.target.value })}
                      placeholder="Type official admin answer..."
                      className="flex-1 min-w-[220px] h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const ans = replyDrafts[q.id] ?? q.answer ?? "";
                        if (!ans.trim()) return;
                        onAction("moderate_question", { id: q.id, answer: ans.trim(), status: "Answered" }, "Q&A answered & published");
                      }}
                      className="px-3.5 h-9 rounded-lg bg-[#0084C7] text-white font-bold cursor-pointer"
                    >
                      Publish Answer
                    </button>
                    <button
                      type="button"
                      onClick={() => onAction("moderate_question", { id: q.id, status: "Hidden" }, "Question hidden")}
                      className="px-3 h-9 rounded-lg bg-amber-100 text-amber-800 font-bold cursor-pointer"
                    >
                      Hide
                    </button>
                    <button
                      type="button"
                      onClick={() => onAction("moderate_question", { id: q.id, delete: true }, "Question deleted")}
                      className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-slate-600">
              <span>
                Page {safePage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setQnaPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setQnaPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, SKU, model, brand..."
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-300 text-xs outline-none focus:border-[#0084C7]"
              />
            </div>

            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-300 text-xs bg-white"
            >
              <option value="all">All Categories</option>
              {(db.categories || []).map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-300 text-xs bg-white"
            >
              <option value="all">All Brands</option>
              {(db.brands || []).map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-300 text-xs bg-white"
            >
              <option value="all">All Stock</option>
              <option value="in">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-10 px-3 rounded-xl border border-slate-300 text-xs bg-white"
            >
              <option value="title">Sort: Name A-Z</option>
              <option value="price_asc">Price Low→High</option>
              <option value="price_desc">Price High→Low</option>
              <option value="stock_asc">Lowest Stock First</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="h-10 px-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer"
            >
              <Download className="size-4" />
              <span>Export CSV</span>
            </button>
            <label className="h-10 px-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer">
              <Upload className="size-4" />
              <span>Import CSV</span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImportCsv(e.target.files[0])}
              />
            </label>
            <button
              type="button"
              onClick={() => onNavigate("add-product")}
              className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#0084C7] to-[#006DA6] text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Plus className="size-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="p-3 rounded-xl bg-[#E0F2FE]/70 border border-[#0084C7]/30 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-extrabold text-[#006DA6]">
              {selectedIds.length} products selected
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                placeholder="Value (% or Stock)"
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                className="h-8 w-36 px-2.5 rounded-lg border border-slate-300 bg-white text-xs"
              />
              <button
                type="button"
                onClick={() =>
                  onAction("bulk_products", {
                    productIds: selectedIds,
                    operation: "price_percent",
                    value: Number(bulkValue || 0),
                  })
                }
                className="px-3 py-1.5 rounded-lg bg-[#0084C7] text-white text-xs font-bold"
              >
                Adjust Price %
              </button>
              <button
                type="button"
                onClick={() =>
                  onAction("bulk_products", {
                    productIds: selectedIds,
                    operation: "discount_percent",
                    value: Number(bulkValue || 0),
                  })
                }
                className="px-3 py-1.5 rounded-lg bg-[#FF7A00] text-white text-xs font-bold"
              >
                Set Discount %
              </button>
              <button
                type="button"
                onClick={() =>
                  onAction("bulk_products", {
                    productIds: selectedIds,
                    operation: "set_stock",
                    value: Number(bulkValue || 0),
                  })
                }
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold"
              >
                Set Stock
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onAction("bulk_products", { productIds: selectedIds, operation: "delete" });
                  setSelectedIds([]);
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold"
              >
                Bulk Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
              <th className="p-3">
                <input
                  type="checkbox"
                  checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                  onChange={(e) =>
                    setSelectedIds(e.target.checked ? filteredProducts.map((p) => p.id) : [])
                  }
                />
              </th>
              <th className="p-3">Product</th>
              <th className="p-3">SKU / Model</th>
              <th className="p-3">Brand &amp; Category</th>
              <th className="p-3">Regular / Sale Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Flags</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProducts.slice(0, 60).map((p) => {
              const stk = typeof p.stock === "number" ? p.stock : 10;
              return (
                <tr key={p.id} className="hover:bg-slate-50/70">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={(e) =>
                        setSelectedIds(
                          e.target.checked
                            ? [...selectedIds, p.id]
                            : selectedIds.filter((id) => id !== p.id)
                        )
                      }
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3 min-w-[220px]">
                      <img
                        src={p.thumbnail || "/logo.png"}
                        alt={p.title}
                        className="size-11 rounded-xl border border-slate-200 object-contain bg-white p-1 shrink-0"
                      />
                      <span className="font-bold text-slate-800 line-clamp-2">{p.title}</span>
                    </div>
                  </td>
                  <td className="p-3 whitespace-nowrap text-slate-600">
                    <div>{p.sku || "-"}</div>
                    <div className="text-[11px] text-slate-400">{p.model || "-"}</div>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="font-bold text-slate-800">{p.brand}</div>
                    <div className="text-[11px] text-slate-500 capitalize">{p.category}</div>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="font-extrabold text-[#0084C7]">৳{p.price.toLocaleString()}</div>
                    {p.originalPrice > p.price && (
                      <div className="text-[11px] text-slate-400 line-through">
                        ৳{p.originalPrice.toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        stk <= 0
                          ? "bg-rose-100 text-rose-700"
                          : stk <= (db.settings?.lowStockThreshold ?? 5)
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {stk} units
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap space-x-1">
                    {p.featured && (
                      <span className="px-2 py-0.5 rounded bg-sky-100 text-[#0084C7] font-bold text-[10px]">
                        Featured
                      </span>
                    )}
                    {p.hotDeal && (
                      <span className="px-2 py-0.5 rounded bg-orange-100 text-[#FF7A00] font-bold text-[10px]">
                        Hot
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap space-x-1">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(p)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#E0F2FE] text-[#0084C7] font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="size-3.5" />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editingProduct && (
        <AdminProductFormModal
          initialProduct={editingProduct}
          categories={db.categories || []}
          brands={db.brands || []}
          allProducts={products}
          onClose={() => setEditingProduct(null)}
          onSave={async (prod) => {
            await onAction("upsert_product", { product: prod }, `Updated product "${prod.title}"`);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
};
