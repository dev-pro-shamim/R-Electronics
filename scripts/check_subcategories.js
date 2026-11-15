const fs = require('fs');

const content = fs.readFileSync('src/data/products.ts', 'utf8');

// Parse products
const categories = JSON.parse(fs.readFileSync('data/admin-db.json', 'utf8')).categories;

// Check subcategory mapping
const subCounts = {};
const catMatches = [...content.matchAll(/"category":\s*"([^"]+)",\s*"subcategory":\s*"([^"]+)"/g)];
for (const m of catMatches) {
  const cat = m[1];
  const sub = m[2];
  const key = `${cat} -> ${sub}`;
  subCounts[key] = (subCounts[key] || 0) + 1;
}

console.log('Subcategory distribution:');
console.table(subCounts);
