const fs = require('fs');

const cartHtml = fs.readFileSync('analysis/cart_content.html', 'utf8');
console.log('Cart HTML total length:', cartHtml.length);
// print first 2500 and last 2500
console.log('--- CART TOP ---');
console.log(cartHtml.slice(0, 2500));
console.log('--- CART BOTTOM ---');
console.log(cartHtml.slice(-2500));

const chkHtml = fs.readFileSync('analysis/checkout_content.html', 'utf8');
console.log('\nCheckout HTML total length:', chkHtml.length);
console.log('--- CHECKOUT TOP ---');
console.log(chkHtml.slice(0, 2500));
console.log('--- CHECKOUT BOTTOM ---');
console.log(chkHtml.slice(-2500));
