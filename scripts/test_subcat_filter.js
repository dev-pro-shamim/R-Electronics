const fs = require('fs');

const catCode = fs.readFileSync('src/data/categories.ts', 'utf8');
const marker = 'export const CATEGORIES: Category[] = ';
const idx = catCode.indexOf(marker);
const jsonPart = catCode.slice(idx + marker.length, catCode.indexOf('export const FEATURED_CATEGORIES')).trim().replace(/;\s*$/, '');
const categories = eval(jsonPart);

const prodCode = fs.readFileSync('src/data/products.ts', 'utf8');
const pMarker = 'export const PRODUCTS: Product[] = ';
const pIdx = prodCode.indexOf(pMarker);
const pJson = prodCode.slice(pIdx + pMarker.length).trim().replace(/;\s*$/, '');
const products = eval(pJson);

console.log('--- Testing AC Subcategory Filtering ---');
const acCat = categories.find(c => c.id === 'air-conditioner');

for (const sub of acCat.subcategories) {
  const filtered = products.filter(p => {
    const pSub = (p.subcategory || '').toLowerCase();
    const pCat = (p.category || '').toLowerCase();
    const tLower = (p.title || '').toLowerCase();
    const matchSlug = sub.slug.toLowerCase();
    const matchName = sub.name.toLowerCase();
    const matchId = (sub.id || '').toLowerCase();

    if (pSub === matchSlug || pSub === matchName || pSub === matchId || pCat === matchSlug) {
      return true;
    }
    if (matchId === '1-ton-ac' && (pSub.includes('1-ton') || tLower.includes('1.0 ton') || tLower.includes('1 ton') || tLower.includes('1.1 ton'))) return true;
    if (matchId === '1-5-ton-ac' && (pSub.includes('1-5-ton') || pSub.includes('1.5-ton') || tLower.includes('1.5 ton') || tLower.includes('1.6 ton'))) return true;
    if (matchId === '2-ton-ac' && (pSub.includes('2-ton') || tLower.includes('2.0 ton') || tLower.includes('2 ton'))) return true;
    if (matchId === '2-5-ton-ac' && (pSub.includes('2-5-ton') || pSub.includes('2.5-ton') || tLower.includes('2.5 ton'))) return true;
    if (matchId === 'cassette-ac' && (pSub.includes('cassette') || tLower.includes('cassette'))) return true;
    if (matchId === 'ceiling-ac' && (pSub.includes('ceiling') || tLower.includes('ceiling'))) return true;
    if (matchId === 'portable-ac' && (pSub.includes('portable') || pSub.includes('floor') || tLower.includes('portable') || tLower.includes('floor'))) return true;
    return false;
  });

  console.log(`Submenu [${sub.name}] (${sub.slug}): found ${filtered.length} products`);
}
