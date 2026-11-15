const fs = require('fs');

const js = fs.readFileSync('haier2025_product_list.js', 'utf8');

// Search for this.listUrl or this.mergeListUrl definitions
const matches = js.match(/.{0,80}(?:listUrl|mergeListUrl|filterJsonUrl).{0,80}/gi) || [];
console.log('Matches:');
matches.forEach(m => console.log(m));
