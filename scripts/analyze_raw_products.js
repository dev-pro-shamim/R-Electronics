const fs = require('fs');

const products = JSON.parse(fs.readFileSync('scripts/raw_source_products.json', 'utf8'));

console.log(`Total raw products: ${products.length}`);

// 1. Categories distribution
const categoriesMap = new Map();
const brandsMap = new Map();
let totalImages = 0;
let missingPrice = 0;
let missingImages = 0;

products.forEach(p => {
  // Categories
  if (p.categories && p.categories.length > 0) {
    p.categories.forEach(c => {
      categoriesMap.set(c.slug, (categoriesMap.get(c.slug) || 0) + 1);
    });
  }

  // Brands: check p.brands or extract from product name
  let brand = 'Rango';
  if (p.brands && p.brands.length > 0) {
    brand = p.brands[0].name;
  } else {
    const knownBrands = ['Samsung', 'Haier', 'Hisense', 'Gree', 'Panasonic', 'Hitachi', 'Sharp', 'LG', 'Sony', 'Daikin', 'Midea', 'Konka', 'Walton', 'Philips', 'Havells', 'Kent', 'Aquafresh', 'Cuckoo', 'Pureit'];
    for (const b of knownBrands) {
      if (new RegExp('\\b' + b + '\\b', 'i').test(p.name)) {
        brand = b;
        break;
      }
    }
  }
  brandsMap.set(brand, (brandsMap.get(brand) || 0) + 1);

  // Images
  if (p.images && p.images.length > 0) {
    totalImages += p.images.length;
  } else {
    missingImages++;
  }

  // Prices
  const regular = p.prices?.regular_price ? parseInt(p.prices.regular_price, 10) / 100 : 0;
  const sale = p.prices?.sale_price ? parseInt(p.prices.sale_price, 10) / 100 : 0;
  const current = p.prices?.price ? parseInt(p.prices.price, 10) / 100 : 0;
  if (!current && !regular) {
    missingPrice++;
  }
});

console.log('\n--- Categories Breakdown ---');
for (const [slug, count] of categoriesMap.entries()) {
  console.log(`- ${slug}: ${count} products`);
}

console.log('\n--- Brands Breakdown ---');
for (const [brand, count] of brandsMap.entries()) {
  console.log(`- ${brand}: ${count} products`);
}

console.log('\n--- Images & Prices ---');
console.log(`Total Product Images: ${totalImages}`);
console.log(`Products missing images: ${missingImages}`);
console.log(`Products missing price: ${missingPrice}`);
