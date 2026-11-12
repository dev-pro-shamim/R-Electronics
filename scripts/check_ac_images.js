const fs = require('fs');
const content = fs.readFileSync('src/data/products.ts', 'utf8');
const lines = content.split('\n');

console.log('--- electronicsbangladesh URLs ---');
lines.forEach((l, i) => {
  if (l.includes('electronicsbangladesh')) {
    console.log(`${i + 1}: ${l.trim()}`);
  }
});

console.log('\n--- AC thumbnails sample ---');
let inAc = false;
lines.forEach((l, i) => {
  if (l.includes('"category": "air-conditioner"')) inAc = true;
  if (inAc && l.includes('"thumbnail":')) {
    console.log(`${i + 1}: ${l.trim()}`);
    inAc = false;
  }
});
