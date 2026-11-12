const fs = require('fs');

const products = JSON.parse(fs.readFileSync('scripts/raw_source_products.json', 'utf8'));

// Sample one from each category
const categoriesToSample = ['smart-android-tv', 'refrigerator', 'washing-machine', 'microwave-oven', 'geyser-water-heaters', 'water-purifiers', 'blender-juicer'];

categoriesToSample.forEach(cat => {
  const p = products.find(x => x.categories?.some(c => c.slug === cat));
  if (p) {
    console.log(`\n================= Category: ${cat} =================`);
    console.log(`Title: ${p.name}`);
    console.log(`Slug: ${p.slug}`);
    console.log(`SKU: ${p.sku}`);
    console.log(`Short Description snippet: ${p.short_description.slice(0, 300)}...`);
  }
});
