const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('electromart_nuxt.json', 'utf8'));

function resolve(val) {
  if (typeof val === 'number') {
    return raw[val];
  }
  return val;
}

function resolveDeep(val, depth = 0) {
  if (depth > 5) return val;
  if (typeof val === 'number') {
    return resolveDeep(raw[val], depth + 1);
  }
  if (Array.isArray(val)) {
    return val.map(x => resolveDeep(x, depth + 1));
  }
  if (val && typeof val === 'object') {
    const res = {};
    for (const k of Object.keys(val)) {
      res[k] = resolveDeep(val[k], depth + 1);
    }
    return res;
  }
  return val;
}

// Search for product items (they usually have slug, mrp, price, etc.)
const foundProducts = [];
for (let i = 0; i < raw.length; i++) {
  const item = raw[i];
  if (item && typeof item === 'object' && !Array.isArray(item)) {
    if (item.title !== undefined && item.slug !== undefined && (item.mrp !== undefined || item.price !== undefined || item.regular_price !== undefined || item.selling_price !== undefined)) {
      foundProducts.push(resolveDeep(item));
    }
  }
}

console.log('Resolved products found:', foundProducts.length);
if (foundProducts.length > 0) {
  console.log('Sample product:', JSON.stringify(foundProducts[0], null, 2));
  fs.writeFileSync('electromart_products_page1.json', JSON.stringify(foundProducts, null, 2));
}

// Check pagination or total products in electromart category
for (let i = 0; i < raw.length; i++) {
  const item = raw[i];
  if (item && typeof item === 'object') {
    if (item.last_page || item.total || item.per_page) {
      console.log('Pagination info found at', i, resolveDeep(item));
    }
  }
}
