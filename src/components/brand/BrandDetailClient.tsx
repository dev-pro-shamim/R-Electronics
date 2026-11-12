"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Product } from "@/data/products";
import { AdminBrandItem } from "@/types/admin";
import { ProductCard } from "@/components/common/ProductCard";
import { Award, CheckCircle2, ChevronRight, Home, Search } from "lucide-react";

interface BrandDetailClientProps {
  brand: AdminBrandItem;
  initialProducts: Product[];
}

export function BrandDetailClient({ brand, initialProducts }: BrandDetailClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [sort, setSort] = useState("featured");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(initialProducts.length);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadBrandProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          brand: brand.slug,
          sort,
          page: String(page),
          limit: "20",
        });
        if (categoryFilter !== "all") params.set("category", categoryFilter);
        if (searchQuery.trim()) params.set("q", searchQuery.trim());
        const res = await fetch(`/api/catalog?${params.toString()}`, { cache: "no-store" });
        const data = await res.json();
        if (!active) return;
        if (res.ok && Array.isArray(data.items)) {
          setProducts(data.items);
          setTotal(Number(data.total || data.items.length));
          setTotalPages(Number(data.totalPages || 1));
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadBrandProducts();
    return () => {
      active = false;
    };
  }, [brand.slug, sort, categoryFilter, searchQuery, page]);

  const categoriesInBrand = Array.from(
    new Set(initialProducts.map((p) => p.category).filter(Boolean))
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-14">
      <div className="max-w-[1442px] mx-auto px-3 sm:px-4 pt-5">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
          <Link href="/" className="hover:text-[#0084C7] inline-flex items-center gap-1">
            <Home className="size-3.5" />
            <span>Home</span>
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-slate-700 font-semibold">{brand.name} Official Store</span>
        </nav>

        {/* Brand Showcase Hero */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 md:p-7 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl border border-slate-200 bg-white flex items-center justify-center p-2 shrink-0">
              <img
                src={brand.logo || "/logo.png"}
                alt={brand.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                  {brand.name} Electronics
                </h1>
                {brand.authorized && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="size-3.5" />
                    Authorized Brand Partner
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
                {brand.description ||
                  `Explore 100% genuine ${brand.name} appliances and electronics with official brand warranty and 0% EMI at Rango Electronics.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-sky-50 border border-sky-100 rounded-xl px-4 py-3 shrink-0">
            <Award className="size-5 text-[#0084C7]" />
            <div>
              <p className="text-xs font-bold text-slate-900">{total} Official Products</p>
              <p className="text-[11px] text-slate-500">0% EMI up to 36 Months</p>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 mb-5 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCategoryFilter("all");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                categoryFilter === "all"
                  ? "bg-[#0084C7] text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              All ({initialProducts.length})
            </button>
            {categoriesInBrand.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategoryFilter(cat);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  categoryFilter === cat
                    ? "bg-[#0084C7] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {cat.replace(/-/g, " ")}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder={`Search ${brand.name} models...`}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-[#0084C7] outline-none"
              />
            </div>

            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-slate-700 outline-none focus:border-[#0084C7]"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="discount">Biggest Discount</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div key={idx} className="h-72 rounded-xl bg-white border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <h2 className="text-lg font-bold text-slate-800">
              No {brand.name} products match these filters
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Try clearing your search or category selection.
            </p>
            <button
              type="button"
              onClick={() => {
                setCategoryFilter("all");
                setSearchQuery("");
              }}
              className="mt-4 px-5 py-2 rounded-xl bg-[#0084C7] text-white text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-slate-600 px-3">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
