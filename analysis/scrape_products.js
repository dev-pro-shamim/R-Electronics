const fs = require('fs');

function extractProductsFromHtml(html, sourceName) {
  // In the HTML, find product items
  // Look for links to /product/
  const items = [];
  const regex = /<a[^>]*href="(https:\/\/electronicsbangladesh\.com\/product\/[^"]+|\/product\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    const inner = match[2];
    // extract image
    const imgMatch = inner.match(/srcSet="([^"]+)"|src="([^"]+)"/i);
    let img = '';
    if (imgMatch) {
      const srcVal = imgMatch[1] || imgMatch[2];
      const urlParam = srcVal.match(/url=([^&]+)/);
      if (urlParam) {
        img = decodeURIComponent(urlParam[1]);
      } else {
        img = srcVal.split(' ')[0];
      }
    }
    // extract alt
    const altMatch = inner.match(/alt="([^"]+)"/i);
    const alt = altMatch ? altMatch[1] : '';

    items.push({ href, img, alt, source: sourceName });
  }
  return items;
}

const homeHtml = fs.readFileSync('eb_homepage.html', 'utf8');
const catTv = fs.readFileSync('category_tv.html', 'utf8');
const catMob = fs.readFileSync('category_mobile.html', 'utf8');

const allProds = [
  ...extractProductsFromHtml(homeHtml, 'homepage'),
  ...extractProductsFromHtml(catTv, 'category_tv'),
  ...extractProductsFromHtml(catMob, 'category_mob')
];

console.log('Total product link items matched:', allProds.length);

// Deduplicate by href
const uniqueProds = {};
for (const p of allProds) {
  const slug = p.href.replace('https://electronicsbangladesh.com', '');
  if (!uniqueProds[slug]) {
    uniqueProds[slug] = p;
  } else if (!uniqueProds[slug].img && p.img) {
    uniqueProds[slug].img = p.img;
  }
}
const list = Object.values(uniqueProds);
console.log('Unique products matched:', list.length);
console.log('Sample unique products:', list.slice(0, 10));
fs.writeFileSync('scraped_products.json', JSON.stringify(list, null, 2));
