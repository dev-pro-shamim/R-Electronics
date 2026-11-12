const fs = require('fs');
const html = fs.readFileSync('analysis/product_tv.html', 'utf8');
const btnIdx = html.indexOf('Buy Now');
if (btnIdx !== -1) {
  console.log(html.slice(btnIdx - 200, btnIdx + 500));
} else {
  console.log('Buy Now not found');
}
