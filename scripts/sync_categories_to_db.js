const fs = require('fs');

const catCode = fs.readFileSync('src/data/categories.ts', 'utf8');
const marker = 'export const CATEGORIES: Category[] = ';
const idx = catCode.indexOf(marker);
const jsonPart = catCode.slice(idx + marker.length, catCode.indexOf('export const FEATURED_CATEGORIES')).trim().replace(/;\s*$/, '');
const categories = eval(jsonPart);

const db = JSON.parse(fs.readFileSync('data/admin-db.json', 'utf8'));
db.categories = categories.map((c, idx) => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  displayOrder: idx + 1,
  seoTitle: `${c.name} Price in Bangladesh | Rango Electronics`,
  seoDescription: `Shop authentic ${c.name} at best price in Bangladesh with official warranty and 0% EMI.`,
  subcategories: c.subcategories.map(s => ({
    id: s.id,
    name: s.name,
    slug: s.slug
  }))
}));

fs.writeFileSync('data/admin-db.json', JSON.stringify(db, null, 2), 'utf8');
console.log('admin-db.json categories synchronized with exact subcategories!');
