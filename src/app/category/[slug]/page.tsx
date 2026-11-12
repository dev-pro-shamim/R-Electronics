"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  X,
  LayoutGrid,
  List
} from "lucide-react";
import { PRODUCTS, Product } from "@/data/products";
import { CATEGORIES } from "@/data/categories";
import { BRANDS } from "@/data/brands";
import { ProductCard } from "@/components/common/ProductCard";
import { useStoreRuntime } from "@/lib/useStoreRuntime";

function CategoryContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const runtime = useStoreRuntime();
  const slug = decodeURIComponent((params?.slug as string) || "all");
  const brandQuery = searchParams.get("brand");
  const searchQuery = searchParams.get("search") || searchParams.get("q");

  const liveCategories =
    runtime?.categories && runtime.categories.length > 0 ? runtime.categories : CATEGORIES;
  const liveBrands =
    runtime?.brands && runtime.brands.length > 0 ? runtime.brands : BRANDS;
  const liveProducts =
    runtime?.products && runtime.products.length > 0 ? runtime.products : PRODUCTS;

  // Find category or subcategory information
  const currentCategory = liveCategories.find(
    (c) =>
      c.slug.toLowerCase() === slug.toLowerCase() ||
      (c.subcategories || []).some((s) => s.slug.toLowerCase() === slug.toLowerCase())
  );

  const matchedSub = currentCategory?.subcategories?.find(
    (s) => s.slug.toLowerCase() === slug.toLowerCase()
  );

  const categoryName = matchedSub
    ? matchedSub.name
    : currentCategory
    ? currentCategory.name
    : slug === "all"
    ? "All Electronics"
    : slug.replace(/-/g, " ");

  // Filter States
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    brandQuery ? [brandQuery.toLowerCase()] : []
  );
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc" | "rating">("default");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 450000]);
  const [page, setPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter products strictly by assigned category / subcategory
  const filteredProducts = useMemo(() => {
    let prods = [...liveProducts];

    if (slug !== "all") {
      const s = slug.toLowerCase();
      const isTv = s === "television" || s === "smart-android-tv";
      const isFridge = s === "refrigerator" || s === "refrigerators-and-freezer";
      const isOven = s === "microwave-oven" || s === "oven";
      const isGeyser = s === "geyser-water-heaters" || s === "geyser";

      prods = prods.filter((p) => {
        const cat = (p.category || "").toLowerCase();
        const sub = (p.subcategory || "").toLowerCase();
        if (matchedSub) {
          return (
            sub === matchedSub.slug.toLowerCase() ||
            sub === matchedSub.name.toLowerCase() ||
            cat === matchedSub.slug.toLowerCase()
          );
        }
        if (cat === s || sub === s) return true;
        if (isTv && cat === "television") return true;
        if (isFridge && cat === "refrigerator") return true;
        if (isOven && cat === "microwave-oven") return true;
        if (isGeyser && cat === "geyser-water-heaters") return true;
        if (
          currentCategory &&
          currentCategory.slug.toLowerCase() === s &&
          (cat === currentCategory.slug.toLowerCase() ||
            cat === currentCategory.name.toLowerCase())
        ) {
          return true;
        }
        return false;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      prods = prods.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.brand || "").toLowerCase().includes(q) ||
          (p.model || "").toLowerCase().includes(q) ||
          (p.sku || "").toLowerCase().includes(q)
      );
    }

    if (selectedBrands.length > 0) {
      prods = prods.filter((p) => {
        const pb = (p.brand || "").toLowerCase();
        return selectedBrands.some((sb) => {
          const matched = liveBrands.find(
            (lb) => lb.slug.toLowerCase() === sb || lb.name.toLowerCase() === sb
          );
          return pb === sb || (matched && (pb === matched.name.toLowerCase() || pb === matched.slug.toLowerCase()));
        });
      });
    }

    if (inStockOnly) {
      prods = prods.filter((p) => !p.isStockOut && (p.stock === undefined || p.stock > 0));
    }

    prods = prods.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (sortBy === "price-asc") {
      prods.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      prods.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      prods.sort((a, b) => Number(b.reviewsCount || 0) - Number(a.reviewsCount || 0) || Number(b.rating) - Number(a.rating));
    }

    return prods;
  }, [liveProducts, liveBrands, currentCategory, matchedSub, slug, searchQuery, selectedBrands, inStockOnly, priceRange, sortBy]);

  const pageSize = 24;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedProducts = filteredProducts.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleBrand = (bName: string) => {
    const lower = bName.toLowerCase();
    setSelectedBrands(prev =>
      prev.includes(lower) ? prev.filter(b => b !== lower) : [...prev, lower]
    );
  };

  const clearAllFilters = () => {
    setSelectedBrands([]);
    setInStockOnly(false);
    setPriceRange([0, 450000]);
    setSortBy("default");
  };

  return (
    <div className="bg-gray-50/50 min-h-screen py-4 md:py-6">
      <div className="container">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          <ChevronRight className="size-3.5 text-gray-400" />
          <Link href="/category/all" className="hover:text-primary">
            Categories
          </Link>
          <ChevronRight className="size-3.5 text-gray-400" />
          <span className="text-gray-800 font-semibold capitalize">{categoryName}</span>
        </nav>

        {/* Page Title & Sort Toolbar */}
        <div className="bg-white rounded-xl border border-gray-200/90 p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 capitalize">
              {categoryName} Price in Bangladesh
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Showing {filteredProducts.length} authentic products with official warranty
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Mobile Filter Button */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-800"
            >
              <Filter className="size-3.5 text-primary" />
              <span>Filters ({selectedBrands.length + (inStockOnly ? 1 : 0)})</span>
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium hidden sm:inline">Sort By:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="h-9 px-3 text-xs font-semibold rounded-lg border border-gray-300 bg-white text-gray-800 focus:outline-none focus:border-primary"
              >
                <option value="default">Default / Recommended</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Customer Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Layout: Sidebar Filters + Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px,_1fr] gap-6">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block space-y-5">
            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2 font-bold text-sm text-gray-900">
                  <SlidersHorizontal className="size-4 text-primary" />
                  <span>Filter Products</span>
                </div>
                {(selectedBrands.length > 0 || inStockOnly) && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-xs text-rose-500 hover:underline font-semibold"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* In Stock Toggle */}
              <div>
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-gray-800">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={e => setInStockOnly(e.target.checked)}
                    className="size-4 rounded text-primary focus:ring-primary accent-primary"
                  />
                  <span>In Stock Only</span>
                </label>
              </div>

              {/* Brands Filter */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Brands</h4>
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {liveBrands.map(brand => (
                    <label
                      key={brand.id}
                      className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-600 hover:text-black"
                    >
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand.slug.toLowerCase())}
                        onChange={() => {
                          toggleBrand(brand.slug);
                          setPage(1);
                        }}
                        className="size-4 rounded text-primary focus:ring-primary accent-primary"
                      />
                      <span className="flex-1">{brand.name}</span>
                      <Link
                        href={`/brand/${brand.slug}`}
                        className="text-[10px] text-[#0084C7] hover:underline"
                      >
                        Store
                      </Link>
                    </label>
                  ))}
                </div>
              </div>

              {/* Category Navigation Links */}
              {currentCategory && (
                <div className="space-y-2 pt-3 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Subcategories
                  </h4>
                  <div className="space-y-1">
                    {currentCategory.subcategories.map(sub => (
                      <Link
                        key={sub.id}
                        href={`/category/${sub.slug}`}
                        className={`block text-xs py-1 px-2 rounded-md transition-colors ${
                          sub.slug === slug
                            ? "bg-rose-50 text-primary font-bold"
                            : "text-gray-600 hover:text-primary hover:bg-gray-50"
                        }`}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Product Grid Area */}
          <div>
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
                <p className="text-base font-bold text-gray-800">No products match your filters</p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Try clearing some filter options or selecting a broader category.
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">
                  {paginatedProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      disabled={safePage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-xs font-semibold disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-semibold text-gray-600 px-3">
                      Page {safePage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={safePage >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-xs font-semibold disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Category SEO Content & Buying Guide */}
            <div className="mt-12 bg-white rounded-2xl border border-gray-200 p-6 md:p-8 space-y-4 text-xs sm:text-sm text-gray-600 leading-relaxed">
              <h2 className="text-lg md:text-xl font-bold text-gray-900">
                Buy Authentic {categoryName} in Bangladesh with Official Warranty
              </h2>
              <p>
                Looking for the latest {categoryName.toLowerCase()} at competitive prices in Bangladesh? Rango Electronics provides authorized models from leading global manufacturers including Samsung, Sony, LG, Haier, Hisense, Hitachi, and Walton. Every unit includes legitimate manufacturer warranty cards, 0% EMI payment support, and insured door-to-door delivery.
              </p>
              <h3 className="font-bold text-gray-900 text-sm pt-2">
                Flexible Payment &amp; EMI Options
              </h3>
              <p>
                Take advantage of our 0% EMI facility available for up to 36 months across 28+ leading commercial banks. Contact our helpline at +88 01798-565001 for inquiries regarding model compatibility and fast delivery.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 p-5 space-y-5 animate-slideLeft overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="font-bold text-sm text-gray-900">Filters</span>
              <button onClick={() => setMobileFilterOpen(false)}>
                <X className="size-5" />
              </button>
            </div>

            <div>
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-gray-800">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={e => setInStockOnly(e.target.checked)}
                  className="size-4 rounded text-primary focus:ring-primary accent-primary"
                />
                <span>In Stock Only</span>
              </label>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Brands</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {liveBrands.map(brand => (
                  <label key={brand.id} className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand.slug.toLowerCase())}
                      onChange={() => {
                        toggleBrand(brand.slug);
                        setPage(1);
                      }}
                      className="size-4 rounded text-primary focus:ring-primary accent-primary"
                    />
                    <span>{brand.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex gap-2">
              <button
                type="button"
                onClick={clearAllFilters}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-xs font-bold"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-2 bg-primary text-white rounded-lg text-xs font-bold"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-gray-500">Loading Category Products...</div>}>
      <CategoryContent />
    </Suspense>
  );
}
