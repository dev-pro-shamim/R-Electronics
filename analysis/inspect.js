const fs = require('fs');
const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
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
  console.log('Fetching homepage...');
  const res = await fetchUrl('https://electronicsbangladesh.com/');
  console.log('Status:', res.status);
  fs.writeFileSync('eb_homepage.html', res.body);
  console.log('eb_homepage.html saved, size:', res.body.length);

  // Check sitemap
  console.log('Fetching sitemap.xml...');
  try {
    const sitemap = await fetchUrl('https://electronicsbangladesh.com/sitemap.xml');
    console.log('Sitemap status:', sitemap.status, 'size:', sitemap.body.length);
    fs.writeFileSync('eb_sitemap.xml', sitemap.body);
  } catch (e) {
    console.log('Sitemap error:', e.message);
  }

  // Check robots.txt
  console.log('Fetching robots.txt...');
  try {
    const robots = await fetchUrl('https://electronicsbangladesh.com/robots.txt');
    console.log('robots.txt status:', robots.status, 'content:\n', robots.body);
  } catch (e) {}
}

main().catch(console.error);
