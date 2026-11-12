const fs = require('fs');

const html = fs.readFileSync('product_tv.html', 'utf8');

// Let's find product details container
const mainMatch = html.match(/<main[\s\S]*?<\/main>/i);
if (mainMatch) {
  const main = mainMatch[0];
  fs.writeFileSync('extracted_product_main.html', main);
  console.log('Saved extracted_product_main.html, length:', main.length);
  
  // Find price, emi, title, stock, buttons
  const priceMatches = [...main.matchAll(/৳\s*([0-9,]+)/g)].map(m => m[1]);
  console.log('Prices found on page:', priceMatches);
  
  // Find tables (specifications)
  const tables = [...main.matchAll(/<table[\s\S]*?<\/table>/gi)];
  console.log('Tables found:', tables.length);
  if (tables.length > 0) {
    fs.writeFileSync('sample_specs_table.html', tables[0][0]);
    console.log('Saved sample_specs_table.html');
  }
}
