const fs = require('fs');

function extractAllCards(html) {
  const cards = [];
  // Split on `<a class="space-y-2" href="/product/`
  const parts = html.split(/<a class="[^"]*" href="\/product\//gi);
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const slugMatch = part.match(/^([^"?#\s>]+)/);
    if (!slugMatch) continue;
    const slug = slugMatch[1].replace(/"$/, '');

    // Title
    const titleMatch = part.match(/<p class="[^"]*line-clamp-2[^"]*">([\s\S]*?)<\/p>/i);
    const title = titleMatch ? titleMatch[1].trim() : slug;

    // Image
    const imgMatch = part.match(/src="([^"]+)"|srcSet="([^"]+)"/i);
    let img = '';
    if (imgMatch) {
      const s = imgMatch[1] || imgMatch[2];
      const u = s.match(/url=([^&]+)/);
      img = u ? decodeURIComponent(u[1]) : s.split(' ')[0];
    }

    // Prices
    const priceMatches = [...part.substring(0, 3000).matchAll(/৳(?:<!-- -->|\s)*([0-9,]+)/g)].map(m => parseInt(m[1].replace(/,/g, ''), 10));
    let price = priceMatches[0] || 0;
    let originalPrice = priceMatches[1] || Math.round(price * 1.18);
    if (originalPrice < price && originalPrice > 0) {
      const temp = price;
      price = originalPrice;
      originalPrice = temp;
    }

    cards.push({
      slug,
      title,
      img,
      price: price || 25000,
      originalPrice: originalPrice || (price ? Math.round(price * 1.2) : 29500),
      discount: originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0,
      rating: 4.8,
      reviewsCount: 12
    });
  }
  return cards;
}

const homeCards = extractAllCards(fs.readFileSync('analysis/eb_homepage.html', 'utf8'));
const tvCards = extractAllCards(fs.readFileSync('analysis/category_tv.html', 'utf8'));
const mobCards = extractAllCards(fs.readFileSync('analysis/category_mobile.html', 'utf8'));

const map = {};
for (const c of [...homeCards, ...tvCards, ...mobCards]) {
  if (!map[c.slug]) {
    map[c.slug] = c;
  }
}
const list = Object.values(map);
console.log('Extracted cards count:', list.length);
console.log('Sample extracted:', list.slice(0, 5));
fs.writeFileSync('extracted_catalog.json', JSON.stringify(list, null, 2));
