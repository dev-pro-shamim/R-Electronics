const fs = require('fs');
const path = require('path');

const prodPath = path.join(__dirname, '../src/data/products.ts');
const prodCode = fs.readFileSync(prodPath, 'utf8');
const prodMarker = 'export const PRODUCTS: Product[] = ';
const products = eval(prodCode.slice(prodCode.indexOf(prodMarker) + prodMarker.length).trim().replace(/;\s*$/, ''));

async function checkAll() {
  const hostCounts = {};
  for (const p of products) {
    const u = p.thumbnail;
    try {
      const host = new URL(u).hostname;
      hostCounts[host] = (hostCounts[host] || 0) + 1;
    } catch (e) {
      hostCounts['invalid'] = (hostCounts['invalid'] || 0) + 1;
    }
  }
  console.log('Thumbnail host distribution:', hostCounts);

  const samples = {};
  for (const p of products) {
    try {
      const host = new URL(p.thumbnail).hostname;
      if (!samples[host]) samples[host] = [];
      if (samples[host].length < 4) samples[host].push({ id: p.id, url: p.thumbnail });
    } catch (e) {}
  }

  for (const [host, list] of Object.entries(samples)) {
    console.log('\nTesting host:', host);
    for (const item of list) {
      try {
        const res = await fetch(item.url);
        console.log(`  [${item.id}] HTTP ${res.status} (${res.headers.get('content-type')})`);
      } catch (err) {
        console.log(`  [${item.id}] ERR: ${err.message}`);
      }
    }
  }
}

checkAll();
