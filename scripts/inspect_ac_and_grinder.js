const fs = require('fs');

const text = fs.readFileSync('src/data/products.ts', 'utf8');
const jsonMatch = text.match(/export const PRODUCTS: Product\[\] = (\[[\s\S]*?\]);\s*$/);
if (!jsonMatch) {
  console.log("Could not find PRODUCTS JSON match");
  process.exit(1);
}

const products = JSON.parse(jsonMatch[1]);
console.log("Total products:", products.length);

console.log("\n--- AIR CONDITIONER PRODUCTS ---");
products.filter(p => p.category === 'air-conditioner').forEach(p => {
  console.log(`[${p.id}] ${p.title} | Sub: ${p.subcategory}`);
});

console.log("\n--- PRODUCTS WITH 'GRINDER' OR 'MIXER' ---");
products.filter(p => p.title.toLowerCase().includes('grinder') || p.title.toLowerCase().includes('mixer')).forEach(p => {
  console.log(`[${p.id}] [Cat: ${p.category}] ${p.title} | Sub: ${p.subcategory}`);
});

console.log("\n--- PRODUCTS WITH '2.5 TON' OR 'INVERTER AC' ---");
products.filter(p => p.title.toLowerCase().includes('ton') || p.title.toLowerCase().includes('inverter ac')).forEach(p => {
  console.log(`[${p.id}] [Cat: ${p.category}] ${p.title} | Sub: ${p.subcategory}`);
});
