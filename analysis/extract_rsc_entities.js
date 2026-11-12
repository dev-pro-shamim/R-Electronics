const fs = require('fs');
const rsc = fs.readFileSync('rsc_data.txt', 'utf8');

// Let's find JSON objects with product structure
const jsonChunks = [];
const regex = /\{"id":\d+,"name":\{"en":"[^"]+"\}[\s\S]*?\}(?=,\{|\])/g;
let m;
while ((m = regex.exec(rsc)) !== null) {
  try {
    const parsed = JSON.parse(m[0]);
    jsonChunks.push(parsed);
  } catch (e) {}
}
console.log('Parsed products from RSC:', jsonChunks.length);
if (jsonChunks.length > 0) {
  console.log('Sample product:', JSON.stringify(jsonChunks[0], null, 2));
  fs.writeFileSync('extracted_products.json', JSON.stringify(jsonChunks, null, 2));
}

// Let's also check for categories in RSC
const catRegex = /\{"id":\d+,"name":\{"en":"[^"]+"\},"slug":"[^"]+"[\s\S]*?\}(?=,\{|\])/g;
const cats = [];
while ((m = catRegex.exec(rsc)) !== null) {
  try {
    const parsed = JSON.parse(m[0]);
    cats.push(parsed);
  } catch (e) {}
}
console.log('Parsed categories from RSC:', cats.length);
if (cats.length > 0) {
  fs.writeFileSync('extracted_categories.json', JSON.stringify(cats, null, 2));
}
