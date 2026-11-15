const fs = require('fs');
const path = require('path');

const prodPath = path.join(__dirname, '../src/data/products.ts');
const prodCode = fs.readFileSync(prodPath, 'utf8');
const prodMarker = 'export const PRODUCTS: Product[] = ';
const products = eval(prodCode.slice(prodCode.indexOf(prodMarker) + prodMarker.length).trim().replace(/;\s*$/, ''));

async function checkAll304() {
  console.log(`Checking thumbnails for all ${products.length} products...`);
  let passed = 0;
  let failed = 0;

  // Process in chunks of 20
  for (let i = 0; i < products.length; i += 20) {
    const chunk = products.slice(i, i + 20);
    await Promise.all(
      chunk.map(async (p) => {
        try {
          const res = await fetch(p.thumbnail);
          if (res.status === 200) {
            passed++;
          } else {
            console.log(`FAIL [${p.id}]: HTTP ${res.status} -> ${p.thumbnail}`);
            failed++;
          }
        } catch (e) {
          console.log(`ERR [${p.id}]: ${e.message} -> ${p.thumbnail}`);
          failed++;
        }
      })
    );
  }

  console.log(`\nFinal Image Verification Results:`);
  console.log(`  Passed (HTTP 200 OK): ${passed} / ${products.length}`);
  console.log(`  Failed: ${failed} / ${products.length}`);
}

checkAll304();
