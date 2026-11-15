const fs = require('fs');

const js = fs.readFileSync('haier2025_product_list.js', 'utf8');

// Find the whole block around listUrl
const idx = js.indexOf('listUrl:');
console.log(js.slice(idx - 100, idx + 800));
