const fs = require('fs');

const products = JSON.parse(fs.readFileSync('scripts/all_raw_153_products.json', 'utf8'));
const categories = JSON.parse(fs.readFileSync('scripts/live_all_categories.json', 'utf8'));

const catById = new Map();
categories.forEach(c => catById.set(c.id, c));

const catProductCount = {};

products.forEach(p => {
  const pCats = p.categories || [];
  pCats.forEach(c => {
    catProductCount[c.name] = (catProductCount[c.name] || 0) + 1;
  });
});

console.log("=== Product counts per category on rangoelectronics.com ===");
Object.entries(catProductCount).sort((a,b) => b[1] - a[1]).forEach(([name, count]) => {
  console.log(`- ${name}: ${count} products`);
});
