const fs = require('fs');
const path = require('path');

const prodPath = path.join(__dirname, '../src/data/products.ts');
const catPath = path.join(__dirname, '../src/data/categories.ts');

const prodCode = fs.readFileSync(prodPath, 'utf8');
const catCode = fs.readFileSync(catPath, 'utf8');

const prodMarker = 'export const PRODUCTS: Product[] = ';
const products = eval(prodCode.slice(prodCode.indexOf(prodMarker) + prodMarker.length).trim().replace(/;\s*$/, ''));

const catMarker = 'export const CATEGORIES: Category[] = ';
const catEndMarker = 'export const FEATURED_CATEGORIES';
const catRaw = catCode.slice(catCode.indexOf(catMarker) + catMarker.length);
const categories = eval(catRaw.slice(0, catRaw.indexOf(catEndMarker)).trim().replace(/;\s*$/, ''));

function simulateFilter(slug, liveProducts, liveCategories) {
  const currentCategory = liveCategories.find(
    (c) =>
      c.slug.toLowerCase() === slug.toLowerCase() ||
      (c.subcategories || []).some((s) => s.slug.toLowerCase() === slug.toLowerCase())
  );

  const matchedSub = currentCategory?.subcategories?.find(
    (s) => s.slug.toLowerCase() === slug.toLowerCase()
  );

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
        if (currentCategory && cat !== currentCategory.slug.toLowerCase()) {
          return false;
        }
        const matchSlug = matchedSub.slug.toLowerCase();
        const matchName = matchedSub.name.toLowerCase();
        const matchId = (matchedSub.id || "").toLowerCase();
        if (
          sub === matchSlug ||
          sub === matchName ||
          sub === matchId
        ) {
          return true;
        }
        if (cat === "air-conditioner") {
          const tLower = p.title.toLowerCase();
          if (
            (matchId === "1-ton-ac" || matchSlug.includes("1-ton")) &&
            (sub.includes("1-ton") ||
              tLower.includes("1.0 ton") ||
              tLower.includes("1 ton") ||
              tLower.includes("1.1 ton"))
          ) {
            return true;
          }
          if (
            (matchId === "1-5-ton-ac" || matchSlug.includes("1-5-ton")) &&
            (sub.includes("1-5-ton") ||
              sub.includes("1.5-ton") ||
              tLower.includes("1.5 ton") ||
              tLower.includes("1.6 ton"))
          ) {
            return true;
          }
          if (
            (matchId === "2-ton-ac" || matchSlug.includes("2-ton")) &&
            (sub.includes("2-ton") ||
              tLower.includes("2.0 ton") ||
              tLower.includes("2 ton"))
          ) {
            return true;
          }
          if (
            (matchId === "2-5-ton-ac" || matchSlug.includes("2-5-ton")) &&
            (sub.includes("2-5-ton") ||
              sub.includes("2.5-ton") ||
              tLower.includes("2.5 ton"))
          ) {
            return true;
          }
          if (
            (matchId === "cassette-ac" || matchSlug.includes("cassette")) &&
            (sub.includes("cassette") || tLower.includes("cassette"))
          ) {
            return true;
          }
          if (
            (matchId === "ceiling-ac" || matchSlug.includes("ceiling")) &&
            (sub.includes("ceiling") || tLower.includes("ceiling"))
          ) {
            return true;
          }
          if (
            (matchId === "portable-ac" || matchSlug.includes("portable")) &&
            (sub.includes("portable") ||
              sub.includes("floor") ||
              tLower.includes("portable") ||
              tLower.includes("floor"))
          ) {
            return true;
          }
        }
        return false;
      }

      if (currentCategory) {
        return cat === currentCategory.slug.toLowerCase();
      }
      if (cat === s) return true;
      if (isTv && cat === "television") return true;
      if (isFridge && cat === "refrigerator") return true;
      if (isOven && cat === "microwave-oven") return true;
      if (isGeyser && cat === "geyser-water-heaters") return true;
      return false;
    });
  }

  return prods;
}

let anyFailures = false;

// Test main categories
for (const cat of categories) {
  const result = simulateFilter(cat.slug, products, categories);
  const foreign = result.filter(p => p.category !== cat.slug);
  if (foreign.length > 0) {
    console.error(`LEAK in category page ${cat.slug}: ${foreign.length} foreign products!`);
    anyFailures = true;
  } else {
    console.log(`PASS: Category [${cat.slug}] -> ${result.length} products, 0 foreign.`);
  }

  // Test subcategories
  if (cat.subcategories) {
    for (const sub of cat.subcategories) {
      const subResult = simulateFilter(sub.slug, products, categories);
      const subForeign = subResult.filter(p => p.category !== cat.slug);
      if (subForeign.length > 0) {
        console.error(`LEAK in subcategory page ${sub.slug}: ${subForeign.length} foreign products!`);
        anyFailures = true;
      }
    }
  }
}

if (!anyFailures) {
  console.log('ALL CATEGORY AND SUBCATEGORY PAGES VERIFIED CLEAN WITH ZERO LEAKS!');
}
