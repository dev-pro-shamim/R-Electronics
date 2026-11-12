const fs = require('fs');

const cart = fs.readFileSync('cart.html', 'utf8');
const cartMain = cart.match(/<main[\s\S]*?<\/main>/i);
if (cartMain) {
  console.log('Cart HTML length:', cartMain[0].length);
  fs.writeFileSync('extracted_cart_main.html', cartMain[0]);
  console.log('Cart preview:\n', cartMain[0].substring(0, 2000));
}

const checkout = fs.readFileSync('checkout.html', 'utf8');
const checkoutMain = checkout.match(/<main[\s\S]*?<\/main>/i);
if (checkoutMain) {
  console.log('Checkout HTML length:', checkoutMain[0].length);
  fs.writeFileSync('extracted_checkout_main.html', checkoutMain[0]);
  console.log('Checkout preview:\n', checkoutMain[0].substring(0, 2000));
}
