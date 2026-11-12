const fs = require('fs');
const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': '*/*'
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

async function main() {
  console.log('Fetching category sitemap...');
  const catSitemap = await fetchUrl('https://electronicsbangladesh.com/category/sitemap.xml');
  fs.writeFileSync('eb_category_sitemap.xml', catSitemap.body);
  console.log('Category sitemap saved, size:', catSitemap.body.length);

  console.log('Fetching product sitemap...');
  const prodSitemap = await fetchUrl('https://electronicsbangladesh.com/product/sitemap.xml');
  fs.writeFileSync('eb_product_sitemap.xml', prodSitemap.body);
  console.log('Product sitemap saved, size:', prodSitemap.body.length);

  // Fetch CSS files
  const css1 = await fetchUrl('https://electronicsbangladesh.com/_next/static/css/e67ce5b235a26378.css');
  fs.writeFileSync('style1.css', css1.body);
  console.log('style1.css saved, size:', css1.body.length);

  const css2 = await fetchUrl('https://electronicsbangladesh.com/_next/static/css/382e634dcab93ea5.css');
  fs.writeFileSync('style2.css', css2.body);
  console.log('style2.css saved, size:', css2.body.length);
}

main().catch(console.error);
