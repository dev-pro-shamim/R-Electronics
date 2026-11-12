const fs = require('fs');
const raw = JSON.parse(fs.readFileSync('scripts/raw_products.json', 'utf8'));

console.log('Total raw products:', raw.length);
for (let i = 0; i < Math.min(5, raw.length); i++) {
  const p = raw[i];
  console.log(`\n--- Product ${i + 1}: ${p.name} ---`);
  console.log('ID:', p.id);
  console.log('Slug:', p.slug);
  console.log('Prices:', p.prices);
  console.log('Images count:', p.images?.length);
  console.log('Images:', p.images?.map(img => img.src));
  console.log('Categories:', p.categories);
  console.log('Short desc length:', p.short_description?.length);
  console.log('Desc length:', p.description?.length);
  console.log('Is in stock:', p.is_in_stock);
}
