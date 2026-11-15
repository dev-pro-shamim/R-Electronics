const fs = require('fs');

const js = fs.readFileSync('haier2025_product_list.js', 'utf8');

// Find all ajax or fetch calls in this file
const ajaxMatches = js.match(/url\s*:\s*["'][^"']+["']|\$\.ajax\([\s\S]*?\)|fetch\([^\)]+\)/gi) || [];
console.log('Ajax matches:', ajaxMatches);

// Find any string with .json or search or product
const urls = js.match(/["'](\/[^"']+)["']/g) || [];
console.log('Path matches:', Array.from(new Set(urls)));
