const fs = require('fs');
const html = fs.readFileSync('eb_homepage.html', 'utf8');

// Find a product card
// Look for card containers
const productCards = [...html.matchAll(/<div[^>]*class="[^"]*group\/card[^"]*"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi)];
console.log('Cards found by group/card:', productCards.length);

if (productCards.length === 0) {
  // Let's search for /product/ links
  const prodLinkIdx = html.indexOf('/product/');
  if (prodLinkIdx !== -1) {
    console.log('Sample product HTML:');
    console.log(html.substring(prodLinkIdx - 200, prodLinkIdx + 1200));
  }
} else {
  console.log('Card HTML:');
  console.log(productCards[0][0].substring(0, 1500));
}
