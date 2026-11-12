const https = require('https');
const fs = require('fs');
const path = require('path');

function getUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data, error: e.message });
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching products from rangoelectronics.com...');
  let page = 1;
  let allProducts = [];

  while (true) {
    const url = `https://rangoelectronics.com/wp-json/wc/store/v1/products?per_page=100&page=${page}`;
    console.log(`Fetching page ${page}...`);
    const res = await getUrl(url);

    if (res.status !== 200 || !Array.isArray(res.data)) {
      console.log(`Ended at page ${page}, status: ${res.status}`);
      break;
    }

    if (res.data.length === 0) {
      console.log(`Page ${page} is empty.`);
      break;
    }

    console.log(`Page ${page}: got ${res.data.length} products.`);
    allProducts.push(...res.data);
    page++;
  }

  console.log(`Total products fetched: ${allProducts.length}`);
  fs.writeFileSync(path.join(__dirname, 'raw_products.json'), JSON.stringify(allProducts, null, 2));

  if (allProducts.length > 0) {
    console.log('Sample product:', {
      id: allProducts[0].id,
      name: allProducts[0].name,
      slug: allProducts[0].slug,
      prices: allProducts[0].prices,
      images: allProducts[0].images?.map(img => img.src),
      categories: allProducts[0].categories?.map(c => c.name)
    });
  }
}

main().catch(console.error);
