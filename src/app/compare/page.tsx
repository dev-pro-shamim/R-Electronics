"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Scale, 
  Trash2, 
  ShoppingCart, 
  Plus, 
  ChevronRight, 
  Search, 
  X, 
  Check, 
  Sparkles,
  ArrowRight
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { PRODUCTS, Product } from "@/data/products";

export default function ComparePage() {
  const { compareList, addToCompare, removeFromCompare, addToCart } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Search filtered products for adding
  const searchResults = useMemo(() => {
    if (!searchQuery && selectedCategory === "all") {
      return PRODUCTS.slice(0, 12);
    }
    return PRODUCTS.filter((p) => {
      const matchesCat = selectedCategory === "all" || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
        p.title.toLowerCase().includes(q) || 
        p.brand.toLowerCase().includes(q) || 
        (p.model && p.model.toLowerCase().includes(q));
      return matchesCat && matchesQuery;
    }).slice(0, 16);
  }, [searchQuery, selectedCategory]);

  // Suggested preset comparisons
  const loadTvPreset = () => {
    const tvs = PRODUCTS.filter(p => p.category === "television").slice(0, 3);
    tvs.forEach(tv => addToCompare(tv));
  };

  const loadAcPreset = () => {
    const acs = PRODUCTS.filter(p => p.category === "air-conditioner").slice(0, 3);
    acs.forEach(ac => addToCompare(ac));
  };

  const loadFridgePreset = () => {
    const fridges = PRODUCTS.filter(p => p.category === "refrigerator").slice(0, 3);
    fridges.forEach(f => addToCompare(f));
  };

  // Collect all unique specification keys across compareList (falling back to static PRODUCTS specs if stripped in runtime summary)
  const hydratedCompareList = useMemo(() => {
    return compareList.map((prod) => {
      if (prod.specifications && prod.specifications.length > 0) return prod;
      const baseMatch = PRODUCTS.find((p) => p.id === prod.id);
      return baseMatch?.specifications ? { ...prod, specifications: baseMatch.specifications } : prod;
    });
  }, [compareList]);

  const allSpecKeys = useMemo(() => {
    const keysSet = new Set<string>();
    hydratedCompareList.forEach((prod) => {
      if (prod.specifications) {
        prod.specifications.forEach((grp) => {
          if (grp.items) {
            grp.items.forEach((item) => {
              if (item.key) keysSet.add(item.key);
            });
          }
        });
      }
    });
    return Array.from(keysSet);
  }, [hydratedCompareList]);

  const getSpecValue = (prod: Product, key: string) => {
    const resolved =
      prod.specifications && prod.specifications.length > 0
        ? prod
        : PRODUCTS.find((p) => p.id === prod.id) || prod;
    if (!resolved.specifications) return "—";
    for (const grp of resolved.specifications) {
      if (grp.items) {
        const found = grp.items.find(it => it.key.toLowerCase() === key.toLowerCase());
        if (found && found.value) return found.value;
      }
    }
    return "—";
  };

  return (
    <div className="bg-gray-50/50 min-h-screen py-6 md:py-10">
      <div className="container">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight className="size-3.5 text-gray-400" />
          <span className="text-gray-800 font-semibold">Compare Products</span>
        </nav>

        <div className="bg-white rounded-2xl border border-gray-200/90 p-5 md:p-8 shadow-xs space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <Scale className="size-5" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                  Compare Products ({compareList.length} / 4)
                </h1>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Side-by-side technical specs, features, EMI and pricing comparison.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {compareList.length > 0 && compareList.length < 4 && (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="size-3.5" />
                  <span>Add Product</span>
                </button>
              )}
              {compareList.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    compareList.forEach(p => removeFromCompare(p.id));
                  }}
                  className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Empty State */}
          {compareList.length === 0 ? (
            <div className="py-10 space-y-8">
              <div className="text-center space-y-3 max-w-md mx-auto">
                <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Scale className="size-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  No products in your comparison list
                </h3>
                <p className="text-xs text-gray-500">
                  Choose from popular categories below or search any product to compare specifications, prices, and warranties side-by-side.
                </p>
              </div>

              {/* Quick Preset Comparisons */}
              <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={loadTvPreset}
                  className="p-4 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 text-left transition-all group"
                >
                  <div className="text-xs font-semibold text-primary mb-1 flex items-center justify-between">
                    <span>Popular Preset</span>
                    <Sparkles className="size-3.5 text-secondary" />
                  </div>
                  <div className="font-bold text-sm text-gray-900 group-hover:text-primary">
                    Compare 4K Smart TVs
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    Samsung vs Haier vs Hisense
                  </div>
                </button>

                <button
                  type="button"
                  onClick={loadAcPreset}
                  className="p-4 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 text-left transition-all group"
                >
                  <div className="text-xs font-semibold text-primary mb-1 flex items-center justify-between">
                    <span>Popular Preset</span>
                    <Sparkles className="size-3.5 text-secondary" />
                  </div>
                  <div className="font-bold text-sm text-gray-900 group-hover:text-primary">
                    Compare 1.5 Ton ACs
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    Gree vs Haier vs Hisense
                  </div>
                </button>

                <button
                  type="button"
                  onClick={loadFridgePreset}
                  className="p-4 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 text-left transition-all group"
                >
                  <div className="text-xs font-semibold text-primary mb-1 flex items-center justify-between">
                    <span>Popular Preset</span>
                    <Sparkles className="size-3.5 text-secondary" />
                  </div>
                  <div className="font-bold text-sm text-gray-900 group-hover:text-primary">
                    Compare Refrigerators
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    Sharp vs Haier vs Whirlpool
                  </div>
                </button>
              </div>

              {/* Quick Search to Add */}
              <div className="max-w-xl mx-auto bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <label className="text-xs font-bold text-gray-700 block">
                  Search &amp; Add Any Product to Compare:
                </label>
                <div className="relative">
                  <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by TV, AC, Fridge, Haier, Samsung, model..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 text-xs bg-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pt-2">
                  {searchResults.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 bg-white rounded-lg border border-gray-200 flex items-center justify-between gap-2 hover:border-primary transition-colors"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <img
                          src={p.thumbnail}
                          alt={p.title}
                          className="size-10 object-contain rounded bg-gray-50 flex-shrink-0"
                        />
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-gray-800 truncate">{p.title}</p>
                          <p className="text-[11px] font-bold text-primary">৳{p.price.toLocaleString()}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => addToCompare(p)}
                        className="p-1.5 rounded bg-primary text-white hover:bg-primary/90 flex-shrink-0 text-[11px] font-bold flex items-center gap-1"
                      >
                        <Plus className="size-3" />
                        <span>Add</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Comparison Table */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-gray-200 rounded-xl overflow-hidden min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-4 w-44 text-gray-500 font-bold uppercase tracking-wider bg-gray-100/50">
                      Product
                    </th>
                    {compareList.map((p) => (
                      <th key={p.id} className="p-4 w-64 align-top bg-white border-l border-gray-200">
                        <div className="space-y-3">
                          <div className="relative h-32 w-full bg-white rounded-lg p-2 border border-gray-100 flex items-center justify-center">
                            <img
                              src={p.thumbnail}
                              alt={p.title}
                              className="max-h-full max-w-full object-contain"
                            />
                            <button
                              type="button"
                              onClick={() => removeFromCompare(p.id)}
                              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-gray-100 hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-colors"
                              title="Remove from comparison"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              {p.brand}
                            </span>
                            <Link
                              href={`/product/${p.slug}`}
                              className="font-bold text-gray-900 hover:text-primary line-clamp-2 mt-0.5 leading-snug"
                            >
                              {p.title}
                            </Link>
                          </div>
                          <div>
                            <div className="text-base font-black text-primary">
                              ৳{p.price.toLocaleString()}
                            </div>
                            {p.originalPrice > p.price && (
                              <div className="text-xs text-gray-400 line-through">
                                ৳{p.originalPrice.toLocaleString()}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => addToCart(p, 1)}
                            className="w-full py-2 bg-primary text-white font-bold rounded-lg flex items-center justify-center gap-1.5 text-xs shadow-2xs hover:bg-primary/90 transition-colors"
                          >
                            <ShoppingCart className="size-3.5" />
                            <span>Add to Cart</span>
                          </button>
                        </div>
                      </th>
                    ))}

                    {/* Empty Slots to add up to 4 */}
                    {Array.from({ length: Math.max(0, 4 - compareList.length) }).map((_, i) => (
                      <th key={`empty-${i}`} className="p-4 w-64 align-middle bg-gray-50/30 border-l border-gray-200 text-center">
                        <button
                          type="button"
                          onClick={() => setIsModalOpen(true)}
                          className="w-full h-44 rounded-xl border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-primary transition-all p-4 group"
                        >
                          <div className="size-10 rounded-full bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center">
                            <Plus className="size-5 text-gray-400 group-hover:text-primary" />
                          </div>
                          <span className="text-xs font-bold text-gray-600 group-hover:text-primary">
                            + Add Product
                          </span>
                          <span className="text-[10px] text-gray-400">
                            Slot {compareList.length + i + 1} of 4
                          </span>
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Category */}
                  <tr className="hover:bg-gray-50/50">
                    <td className="p-3.5 font-bold text-gray-700 bg-gray-50/40">Category</td>
                    {compareList.map((p) => (
                      <td key={p.id} className="p-3.5 font-semibold text-gray-800 border-l border-gray-200 capitalize">
                        {p.category.replace(/-/g, " ")}
                      </td>
                    ))}
                    {Array.from({ length: Math.max(0, 4 - compareList.length) }).map((_, i) => (
                      <td key={`empty-cat-${i}`} className="p-3.5 border-l border-gray-200 text-gray-300 text-center">—</td>
                    ))}
                  </tr>

                  {/* Brand & Model */}
                  <tr className="hover:bg-gray-50/50">
                    <td className="p-3.5 font-bold text-gray-700 bg-gray-50/40">Model / SKU</td>
                    {compareList.map((p) => (
                      <td key={p.id} className="p-3.5 text-gray-700 font-medium border-l border-gray-200">
                        {p.model || p.sku || "Official Model"}
                      </td>
                    ))}
                    {Array.from({ length: Math.max(0, 4 - compareList.length) }).map((_, i) => (
                      <td key={`empty-model-${i}`} className="p-3.5 border-l border-gray-200 text-gray-300 text-center">—</td>
                    ))}
                  </tr>

                  {/* Warranty */}
                  <tr className="hover:bg-gray-50/50">
                    <td className="p-3.5 font-bold text-gray-700 bg-gray-50/40">Official Warranty</td>
                    {compareList.map((p) => (
                      <td key={p.id} className="p-3.5 font-semibold text-gray-800 border-l border-gray-200">
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium text-[11px]">
                          <Check className="size-3" />
                          {p.warranty || "Official Brand Warranty"}
                        </span>
                      </td>
                    ))}
                    {Array.from({ length: Math.max(0, 4 - compareList.length) }).map((_, i) => (
                      <td key={`empty-warr-${i}`} className="p-3.5 border-l border-gray-200 text-gray-300 text-center">—</td>
                    ))}
                  </tr>

                  {/* 0% EMI */}
                  <tr className="hover:bg-gray-50/50">
                    <td className="p-3.5 font-bold text-gray-700 bg-gray-50/40">0% EMI Rate</td>
                    {compareList.map((p) => (
                      <td key={p.id} className="p-3.5 text-secondary font-bold border-l border-gray-200">
                        From ৳{Math.round(p.price / 12).toLocaleString()}/month (12 Mo)
                      </td>
                    ))}
                    {Array.from({ length: Math.max(0, 4 - compareList.length) }).map((_, i) => (
                      <td key={`empty-emi-${i}`} className="p-3.5 border-l border-gray-200 text-gray-300 text-center">—</td>
                    ))}
                  </tr>

                  {/* Stock Status */}
                  <tr className="hover:bg-gray-50/50">
                    <td className="p-3.5 font-bold text-gray-700 bg-gray-50/40">Stock Status</td>
                    {compareList.map((p) => (
                      <td key={p.id} className="p-3.5 font-bold text-emerald-600 border-l border-gray-200">
                        {p.isStockOut ? (
                          <span className="text-rose-500">Out of Stock</span>
                        ) : (
                          <span className="text-emerald-600">In Stock (Available)</span>
                        )}
                      </td>
                    ))}
                    {Array.from({ length: Math.max(0, 4 - compareList.length) }).map((_, i) => (
                      <td key={`empty-stock-${i}`} className="p-3.5 border-l border-gray-200 text-gray-300 text-center">—</td>
                    ))}
                  </tr>

                  {/* Rating */}
                  <tr className="hover:bg-gray-50/50">
                    <td className="p-3.5 font-bold text-gray-700 bg-gray-50/40">Customer Rating</td>
                    {compareList.map((p) => (
                      <td key={p.id} className="p-3.5 font-semibold text-gray-800 border-l border-gray-200">
                        {Number(p.reviewsCount || 0) > 0
                          ? `★ ${Number(p.rating || 0).toFixed(1)} / 5.0 (${p.reviewsCount} reviews)`
                          : "No reviews yet"}
                      </td>
                    ))}
                    {Array.from({ length: Math.max(0, 4 - compareList.length) }).map((_, i) => (
                      <td key={`empty-rating-${i}`} className="p-3.5 border-l border-gray-200 text-gray-300 text-center">—</td>
                    ))}
                  </tr>

                  {/* Detailed Specifications */}
                  {allSpecKeys.map((key) => (
                    <tr key={key} className="hover:bg-gray-50/50">
                      <td className="p-3.5 font-bold text-gray-700 bg-gray-50/40 capitalize">
                        {key}
                      </td>
                      {compareList.map((p) => (
                        <td key={p.id} className="p-3.5 text-gray-700 border-l border-gray-200">
                          {getSpecValue(p, key)}
                        </td>
                      ))}
                      {Array.from({ length: Math.max(0, 4 - compareList.length) }).map((_, i) => (
                        <td key={`empty-spec-${key}-${i}`} className="p-3.5 border-l border-gray-200 text-gray-300 text-center">—</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Add Product to Compare</h3>
                <p className="text-xs text-gray-500">Pick from Rango Electronics catalog</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Search & Filter */}
            <div className="p-4 border-b border-gray-100 space-y-3 bg-gray-50">
              <div className="relative">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products by brand, title, or category..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-xs bg-white focus:outline-none focus:border-primary"
                  autoFocus
                />
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
                {["all", "television", "air-conditioner", "refrigerator", "washing-machine", "microwave-oven"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedCategory(c)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${
                      selectedCategory === c
                        ? "bg-primary text-white"
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {c === "all" ? "All Products" : c.replace(/-/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Product List */}
            <div className="overflow-y-auto p-4 space-y-2 flex-1">
              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500">
                  No matching products found. Try a different keyword.
                </div>
              ) : (
                searchResults.map((prod) => {
                  const alreadyIn = compareList.some((p) => p.id === prod.id);
                  return (
                    <div
                      key={prod.id}
                      className="p-2.5 rounded-lg border border-gray-200 flex items-center justify-between gap-3 hover:border-primary transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img
                          src={prod.thumbnail}
                          alt={prod.title}
                          className="size-12 object-contain rounded bg-gray-50 flex-shrink-0"
                        />
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-gray-800 line-clamp-1">{prod.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-bold text-primary">৳{prod.price.toLocaleString()}</span>
                            <span className="text-[10px] text-gray-400 capitalize">({prod.category})</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={alreadyIn}
                        onClick={() => {
                          addToCompare(prod);
                          setIsModalOpen(false);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex-shrink-0 ${
                          alreadyIn
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-primary text-white hover:bg-primary/90"
                        }`}
                      >
                        {alreadyIn ? "Added" : "+ Add"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
