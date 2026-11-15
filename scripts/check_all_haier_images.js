const fs = require('fs');
const path = require('path');

const prodPath = path.join(__dirname, '../src/data/products.ts');
const prodCode = fs.readFileSync(prodPath, 'utf8');
const prodMarker = 'export const PRODUCTS: Product[] = ';
const products = eval(prodCode.slice(prodCode.indexOf(prodMarker) + prodMarker.length).trim().replace(/;\s*$/, ''));

async function checkHaier() {
  const haierProducts = products.filter(p => (p.thumbnail || '').includes('haier.com'));
  console.log(`Checking ${haierProducts.length} Haier images...`);
  let failed = 0;
  for (const p of haierProducts) {
    try {
      const res = await fetch(p.thumbnail);
      if (res.status !== 200) {
        console.log(`FAILED [${p.id}]: HTTP ${res.status} -> ${p.thumbnail}`);
        failed++;
      }
    } catch (e) {
      console.log(`ERROR [${p.id}]: ${e.message}`);
      failed++;
    }
  }
  console.log(`Haier images check complete: ${haierProducts.length - failed} OK, ${failed} failed.`);
}

checkHaier();
