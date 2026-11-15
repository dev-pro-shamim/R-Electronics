const fs = require('fs');

const js = fs.readFileSync('haier2025_product_list.js', 'utf8');

// Find all searchParams occurrences
const idx = js.indexOf('searchParams:');
console.log('searchParams:');
console.log(js.slice(idx, idx + 1000));
