const products = require('./raw_source_products.json');
const wm = products.filter(p => p.categories && p.categories.some(c => c.slug === 'washing-machine'));
console.log('WM count:', wm.length);
if (wm.length > 0) {
  console.log('Title:', wm[0].name);
  console.log('Categories:', wm[0].categories.map(c => c.slug));
}
