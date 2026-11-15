const fs = require('fs');

const code = fs.readFileSync('src/data/products.ts', 'utf8');
const pMarker = 'export const PRODUCTS: Product[] = ';
const pIdx = code.indexOf(pMarker);
const pJson = code.slice(pIdx + pMarker.length).trim().replace(/;\s*$/, '');
const products = eval(pJson);

console.log(`Total products: ${products.length}`);

const domains = {};
let noThumb = 0;
let invalidUrl = 0;
const samplesByDomain = {};

for (const p of products) {
  const thumb = p.thumbnail || p.images?.[0];
  if (!thumb) {
    noThumb++;
    continue;
  }
  try {
    const u = new URL(thumb);
    domains[u.hostname] = (domains[u.hostname] || 0) + 1;
    if (!samplesByDomain[u.hostname]) {
      samplesByDomain[u.hostname] = thumb;
    }
  } catch (e) {
    invalidUrl++;
    console.log('Invalid URL in product:', p.id, thumb);
  }
}

console.log('\n--- Thumbnails by Domain ---');
console.table(domains);
console.log('No thumbnail:', noThumb, 'Invalid URL:', invalidUrl);

console.log('\n--- Sample URLs by Domain ---');
console.log(samplesByDomain);
