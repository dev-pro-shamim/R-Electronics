const fs = require('fs');
const content = fs.readFileSync('src/data/products.ts', 'utf8');

// Match all product entries by "id": "..."
const idMatches = content.match(/"id":\s*"([^"]+)"/g) || [];
console.log('Total Products in src/data/products.ts:', idMatches.length);

// Count by categories and brands
const catMatches = [...content.matchAll(/"category":\s*"([^"]+)"/g)].map(m => m[1]);
const brandMatches = [...content.matchAll(/"brand":\s*"([^"]+)"/g)].map(m => m[1]);

const catCounts = {};
for (const c of catMatches) catCounts[c] = (catCounts[c] || 0) + 1;

const brandCounts = {};
for (const b of brandMatches) brandCounts[b] = (brandCounts[b] || 0) + 1;

console.log('\n--- Products by Category ---');
console.table(catCounts);

console.log('\n--- Products by Brand (Top 10) ---');
console.log(Object.entries(brandCounts).sort((a,b) => b[1] - a[1]).slice(0, 10));
