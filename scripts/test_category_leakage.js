const fs = require('fs');
const path = require('path');

const prodPath = path.join(__dirname, '../src/data/products.ts');
const catPath = path.join(__dirname, '../src/data/categories.ts');

const prodCode = fs.readFileSync(prodPath, 'utf8');
const catCode = fs.readFileSync(catPath, 'utf8');

const prodMarker = 'export const PRODUCTS: Product[] = ';
const products = eval(prodCode.slice(prodCode.indexOf(prodMarker) + prodMarker.length).trim().replace(/;\s*$/, ''));

const catMarker = 'export const CATEGORIES: Category[] = ';
const catEndMarker = 'export const FEATURED_CATEGORIES';
const catRaw = catCode.slice(catCode.indexOf(catMarker) + catMarker.length);
const catJson = catRaw.slice(0, catRaw.indexOf(catEndMarker)).trim().replace(/;\s*$/, '');
const categories = eval(catJson);

console.log('Total products:', products.length);
console.log('Total categories:', categories.length);

const catCounts = {};
for (const p of products) {
  catCounts[p.category] = (catCounts[p.category] || 0) + 1;
}
console.log('Category breakdown:', JSON.stringify(catCounts, null, 2));

// Test filtering simulation for each category page
for (const cat of categories) {
  const filtered = products.filter(p => p.category === cat.slug);
  console.log(`Category [${cat.slug}] has ${filtered.length} products`);

  // Verify that NONE of the products belong to another category
  const foreign = filtered.filter(p => p.category !== cat.slug);
  if (foreign.length > 0) {
    console.error(`LEAK DETECTED in ${cat.slug}:`, foreign.map(f => f.title));
  }

  // Check subcategories
  if (cat.subcategories && cat.subcategories.length > 0) {
    for (const sub of cat.subcategories) {
      const subFiltered = filtered.filter(p => p.subcategory === sub.slug);
      console.log(`  Subcategory [${sub.name}] (${sub.slug}): ${subFiltered.length} products`);
    }
  }
}
