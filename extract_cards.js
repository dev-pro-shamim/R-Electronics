const fs = require('fs');

function parseCards(html) {
  const cards = [];
  // Find all cards containing /product/
  const blocks = html.split('<div class="group relative');
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].substring(0, 4000);
    const linkMatch = block.match(/href="([^"]*\/product\/[^"]*)"/);
    if (!linkMatch) continue;
    const href = linkMatch[1];
    const slug = href.split('/product/')[1].split('"')[0].split('?')[0];

    const titleMatch = block.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i) || block.match(/alt="([^"]+)"/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : slug;

    const imgMatch = block.match(/src="([^"]+)"|srcSet="([^"]+)"/i);
    let img = '';
    if (imgMatch) {
      const s = imgMatch[1] || imgMatch[2];
      const u = s.match(/url=([^&]+)/);
      img = u ? decodeURIComponent(u[1]) : s.split(' ')[0];
    }

    // price match e.g. ৳ 45,900 or ৳45,900
    const priceMatches = [...block.matchAll(/৳\s*([0-9,]+)/g)].map(m => parseInt(m[1].replace(/,/g, ''), 10));
    let price = priceMatches[0] || 0;
    let originalPrice = priceMatches[1] || Math.round(price * 1.15);
    if (originalPrice < price) {
      const temp = price;
      price = originalPrice;
      originalPrice = temp;
    }

    // discount match e.g. 15% or -15%
    const discountMatch = block.match(/([0-9]+)%\s*off|-([0-9]+)%/i);
    let discount = discountMatch ? parseInt(discountMatch[1] || discountMatch[2], 10) : 0;
    if (!discount && originalPrice > price && price > 0) {
      discount = Math.round(((originalPrice - price) / originalPrice) * 100);
    }

    cards.push({ slug, title, href, img, price, originalPrice, discount });
  }
  return cards;
}

const homeCards = parseCards(fs.readFileSync('analysis/eb_homepage.html', 'utf8'));
const tvCards = parseCards(fs.readFileSync('analysis/category_tv.html', 'utf8'));
const mobCards = parseCards(fs.readFileSync('analysis/category_mobile.html', 'utf8'));

console.log('Home cards:', homeCards.length);
console.log('TV cards:', tvCards.length);
console.log('Mobile cards:', mobCards.length);

const merged = {};
for (const c of [...homeCards, ...tvCards, ...mobCards]) {
  if (!merged[c.slug]) {
    merged[c.slug] = c;
  }
}
const allCards = Object.values(merged);
console.log('Total unique cards extracted:', allCards.length);
console.log('Sample extracted card:', allCards[0]);
fs.writeFileSync('extracted_product_cards.json', JSON.stringify(allCards, null, 2));
