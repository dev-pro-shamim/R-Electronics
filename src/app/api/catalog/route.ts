import { NextRequest, NextResponse } from "next/server";
import { readAdminDbCached } from "@/lib/adminDb";
import { getMergedCatalogProducts } from "@/lib/adminServerHelpers";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit") || 24)));
  const category = (sp.get("category") || "").trim().toLowerCase();
  const subcategory = (sp.get("subcategory") || "").trim().toLowerCase();
  const brand = (sp.get("brand") || "").trim().toLowerCase();
  const q = (sp.get("q") || "").trim().toLowerCase();
  const sort = sp.get("sort") || "featured";
  const inStockOnly = sp.get("inStock") === "true";
  const hotDealOnly = sp.get("hotDeal") === "true";
  const minPrice = sp.get("minPrice") ? Number(sp.get("minPrice")) : undefined;
  const maxPrice = sp.get("maxPrice") ? Number(sp.get("maxPrice")) : undefined;
  const idsParam = sp.get("ids");
  const idsSet = idsParam ? new Set(idsParam.split(",").map((s) => s.trim())) : null;

  const db = readAdminDbCached();
  const activeCategoryMap = new Map(
    (db.categories || []).map((c) => [c.slug.toLowerCase(), c])
  );
  const activeBrandList = (db.brands || []).filter((b) => b.active !== false);

  let items = getMergedCatalogProducts(db).filter(
    (p) => p.status !== "draft" && p.status !== "archived"
  );

  // Build facets before applying specific category/brand filters if full catalog overview helps
  const categoryCounts: Record<string, number> = {};
  const brandCounts: Record<string, number> = {};
  for (const p of items) {
    const cKey = (p.category || "").toLowerCase();
    const bKey = (p.brand || "").toLowerCase();
    if (cKey) categoryCounts[cKey] = (categoryCounts[cKey] || 0) + 1;
    if (bKey) brandCounts[bKey] = (brandCounts[bKey] || 0) + 1;
  }

  if (idsSet) {
    items = items.filter((p) => idsSet.has(p.id));
  }

  if (category && category !== "all" && category !== "all-products") {
    const matchedCat = (db.categories || []).find(
      (c) =>
        c.slug.toLowerCase() === category ||
        c.name.toLowerCase() === category ||
        (c.subcategories || []).some(
          (sub) => sub.slug.toLowerCase() === category || sub.name.toLowerCase() === category
        )
    );
    const subMatch = matchedCat?.subcategories?.find(
      (sub) => sub.slug.toLowerCase() === category || sub.name.toLowerCase() === category
    );

    items = items.filter((p) => {
      const pCat = (p.category || "").toLowerCase();
      const pSub = (p.subcategory || "").toLowerCase();
      if (subMatch) {
        return (
          pSub === subMatch.slug.toLowerCase() ||
          pSub === subMatch.name.toLowerCase() ||
          pCat === subMatch.slug.toLowerCase()
        );
      }
      if (matchedCat) {
        return (
          pCat === matchedCat.slug.toLowerCase() ||
          pCat === matchedCat.name.toLowerCase()
        );
      }
      return pCat === category || pSub === category;
    });
  }

  if (subcategory) {
    items = items.filter(
      (p) => (p.subcategory || "").toLowerCase() === subcategory
    );
  }

  if (brand) {
    const matchedBrand = activeBrandList.find(
      (b) => b.slug.toLowerCase() === brand || b.name.toLowerCase() === brand
    );
    items = items.filter((p) => {
      const pb = (p.brand || "").toLowerCase();
      return matchedBrand
        ? pb === matchedBrand.name.toLowerCase() || pb === matchedBrand.slug.toLowerCase()
        : pb === brand;
    });
  }

  if (q) {
    items = items.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q) ||
        (p.model || "").toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
    );
  }

  if (inStockOnly) {
    items = items.filter((p) => !p.isStockOut && (p.stock === undefined || p.stock > 0));
  }

  if (hotDealOnly) {
    items = items.filter((p) => (p.discount || 0) >= 15 || Boolean(p.hotDeal));
  }

  if (typeof minPrice === "number" && !Number.isNaN(minPrice)) {
    items = items.filter((p) => p.price >= minPrice);
  }
  if (typeof maxPrice === "number" && !Number.isNaN(maxPrice)) {
    items = items.filter((p) => p.price <= maxPrice);
  }

  if (sort === "price-asc") {
    items = [...items].sort((a, b) => a.price - b.price);
  } else if (sort === "price-desc") {
    items = [...items].sort((a, b) => b.price - a.price);
  } else if (sort === "discount") {
    items = [...items].sort((a, b) => (b.discount || 0) - (a.discount || 0));
  } else if (sort === "rating") {
    items = [...items].sort(
      (a, b) =>
        Number(b.reviewsCount || 0) - Number(a.reviewsCount || 0) ||
        Number(b.rating || 0) - Number(a.rating || 0)
    );
  } else {
    items = [...items].sort(
      (a, b) =>
        Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
        (b.discount || 0) - (a.discount || 0)
    );
  }

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const paged = items
    .slice((safePage - 1) * limit, safePage * limit)
    .map(({ reviews: _reviews, ...prod }) => prod);

  return NextResponse.json({
    items: paged,
    total,
    page: safePage,
    limit,
    totalPages,
    facets: {
      categories: (db.categories || [])
        .filter((c) => c.active !== false)
        .sort((a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99))
        .map((c) => ({
          ...c,
          count: categoryCounts[c.slug.toLowerCase()] || activeCategoryMap.get(c.slug.toLowerCase())?.subcategories?.length || 0,
        })),
      brands: activeBrandList.map((b) => ({
        ...b,
        count: brandCounts[b.name.toLowerCase()] || brandCounts[b.slug.toLowerCase()] || 0,
      })),
    },
  });
}
