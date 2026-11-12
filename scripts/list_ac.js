const fs = require('fs');
const content = fs.readFileSync('src/data/products.ts', 'utf8');
const lines = content.split('\n');
let title = '';
let cat = '';
lines.forEach((l, i) => {
  if (l.includes('"title":')) title = l.trim();
  if (l.includes('"category":')) cat = l.trim();
  if (l.includes('"thumbnail":') && (cat.includes('air-conditioner') || title.toLowerCase().includes('ac') || title.toLowerCase().includes('air conditioner'))) {
    console.log(`${i+1}: ${title} | ${cat} | ${l.trim()}`);
  }
});
