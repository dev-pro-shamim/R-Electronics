const fs = require('fs');
const path = require('path');

const prodPath = path.join(__dirname, '../src/data/products.ts');
const prodCode = fs.readFileSync(prodPath, 'utf8');
const prodMarker = 'export const PRODUCTS: Product[] = ';
const products = eval(prodCode.slice(prodCode.indexOf(prodMarker) + prodMarker.length).trim().replace(/;\s*$/, ''));

async function checkNew() {
  const newOnes = products.filter(p => p.id.startsWith('haier-wh-') || p.id.startsWith('haier-tv-'));
  console.log(`Found ${newOnes.length} new products in catalog:`);
  let failed = 0;
  for (const p of newOnes) {
    try {
      const res = await fetch(p.thumbnail);
      console.log(`[${res.status}] ${p.id} | Cat: ${p.category} | Sub: ${p.subcategory} | ৳${p.price} (MRP: ৳${p.originalPrice}) | Revs: ${p.reviewsCount}`);
      if (res.status !== 200) failed++;
    } catch (e) {
      console.log(`[ERR] ${p.id}: ${e.message}`);
      failed++;
    }
  }
  console.log(`\nVerification Result: ${newOnes.length - failed} / ${newOnes.length} OK, ${failed} failed.`);
}

checkNew();
