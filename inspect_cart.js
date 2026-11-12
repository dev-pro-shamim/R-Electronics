const fs = require('fs');
const html = fs.readFileSync('analysis/cart.html', 'utf8');
const cartIdx = html.indexOf('Shopping Cart') !== -1 ? html.indexOf('Shopping Cart') : html.indexOf('Cart');
console.log(html.slice(cartIdx - 200, cartIdx + 600));
