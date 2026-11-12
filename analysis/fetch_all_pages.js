const fs = require('fs');
const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    }, (res) => {
      let data = '';
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          const u = new URL(url);
          redirectUrl = u.origin + redirectUrl;
        }
        return resolve(fetchUrl(redirectUrl));
      }
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

const pagesToFetch = [
  { name: 'product_tv.html', url: 'https://electronicsbangladesh.com/product/samsung-43-inch-crystal-uhd-4k-smart-tv-43u8510h' },
  { name: 'product_ac.html', url: 'https://electronicsbangladesh.com/product/viomi-a2-1-ton-split-type-non-inverter-ac' },
  { name: 'category_tv.html', url: 'https://electronicsbangladesh.com/category/television' },
  { name: 'category_mobile.html', url: 'https://electronicsbangladesh.com/category/mobile-phone' },
  { name: 'cart.html', url: 'https://electronicsbangladesh.com/cart' },
  { name: 'checkout.html', url: 'https://electronicsbangladesh.com/checkout' },
  { name: 'compare.html', url: 'https://electronicsbangladesh.com/compare' }
];

async function main() {
  for (const p of pagesToFetch) {
    console.log(`Fetching ${p.url}...`);
    try {
      const res = await fetchUrl(p.url);
      console.log(`  -> status: ${res.status}, size: ${res.body.length}`);
      fs.writeFileSync(p.name, res.body);
    } catch (e) {
      console.log(`  -> error: ${e.message}`);
    }
  }
}

main().catch(console.error);
