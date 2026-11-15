const fs = require('fs');

const code = fs.readFileSync('src/data/products.ts', 'utf8');
const pMarker = 'export const PRODUCTS: Product[] = ';
const pIdx = code.indexOf(pMarker);
const pJson = code.slice(pIdx + pMarker.length).trim().replace(/;\s*$/, '');
const products = eval(pJson);

console.log(`Checking thumbnails for ${products.length} products...`);

async function check() {
  const broken = [];
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const thumb = p.thumbnail || p.images?.[0];
    if (!thumb) {
      broken.push({ id: p.id, title: p.title, reason: 'missing' });
      continue;
    }
    // Check if domain is electronicsbangladesh.com
    if (thumb.includes('electronicsbangladesh.com')) {
      try {
        const res = await fetch(thumb, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!res.ok) {
          broken.push({ id: p.id, title: p.title, url: thumb, status: res.status });
        }
      } catch (e) {
        broken.push({ id: p.id, title: p.title, url: thumb, error: e.message });
      }
    }
  }

  console.log('Broken electronicsbangladesh.com images:', broken);
}

check();
