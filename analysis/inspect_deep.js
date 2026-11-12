const fs = require('fs');

console.log('=== CSS INSPECTION ===');
const css1 = fs.readFileSync('style1.css', 'utf8');
const css2 = fs.readFileSync('style2.css', 'utf8');
const allCss = css1 + '\n' + css2;

// Extract CSS root variables
const rootVars = [...allCss.matchAll(/--([a-zA-Z0-9_-]+):\s*([^;]+);/g)].map(m => `--${m[1]}: ${m[2].trim()}`);
console.log('CSS Root Variables:', rootVars.slice(0, 30));

// Extract color codes
const colors = [...new Set([...allCss.matchAll(/#(?:[0-9a-fA-F]{3}){1,2}\b/g)].map(m => m[0]))];
console.log('Common hex colors:', colors.slice(0, 20));

// Inspect Product Page structure
console.log('\n=== PRODUCT PAGE INSPECTION ===');
const prodHtml = fs.readFileSync('product_tv.html', 'utf8');
const prodMain = prodHtml.match(/<main[\s\S]*?<\/main>/i);
if (prodMain) {
  console.log('Product Main size:', prodMain[0].length);
  // headings
  const h = [...prodMain[0].matchAll(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);
  console.log('Product Headings:', h.slice(0, 15));
  // buttons
  const btns = [...prodMain[0].matchAll(/<button[^>]*>([\s\S]*?)<\/button>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);
  console.log('Product Buttons:', [...new Set(btns)].slice(0, 15));
}

// Inspect Category Page structure
console.log('\n=== CATEGORY PAGE INSPECTION ===');
const catHtml = fs.readFileSync('category_tv.html', 'utf8');
const catMain = catHtml.match(/<main[\s\S]*?<\/main>/i);
if (catMain) {
  console.log('Category Main size:', catMain[0].length);
  const h = [...catMain[0].matchAll(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);
  console.log('Category Headings:', h.slice(0, 15));
}

// Inspect Cart & Checkout
console.log('\n=== CART & CHECKOUT INSPECTION ===');
const cartHtml = fs.readFileSync('cart.html', 'utf8');
const cartMain = cartHtml.match(/<main[\s\S]*?<\/main>/i);
if (cartMain) {
  const h = [...cartMain[0].matchAll(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);
  console.log('Cart Headings:', h);
}

const checkoutHtml = fs.readFileSync('checkout.html', 'utf8');
const checkoutMain = checkoutHtml.match(/<main[\s\S]*?<\/main>/i);
if (checkoutMain) {
  const h = [...checkoutMain[0].matchAll(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);
  console.log('Checkout Headings:', h);
  const inputs = [...checkoutMain[0].matchAll(/<input[^>]*name="([^"]*)"/gi)].map(m => m[1]);
  console.log('Checkout Form Inputs:', inputs);
}
