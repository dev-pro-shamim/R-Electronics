const fs = require('fs');

async function inspectElectromart() {
  const res = await fetch('https://electromart.store/products?category=air-conditioner', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const html = await res.text();
  fs.writeFileSync('analysis_electromart.html', html);
  console.log('Saved analysis_electromart.html. Searching for product links, Next.js props or script tags...');
  const nextData = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextData) {
    console.log('Found __NEXT_DATA__!');
    const data = JSON.parse(nextData[1]);
    console.log('Keys in pageProps:', Object.keys(data.props?.pageProps || {}));
    console.log('pageProps summary:', JSON.stringify(data.props?.pageProps).slice(0, 500));
  } else {
    console.log('No __NEXT_DATA__, searching for hrefs:');
    const hrefs = html.match(/href=["'][^"']*product[^"']*["']/gi);
    console.log('Found hrefs count:', hrefs ? hrefs.length : 0);
    if (hrefs) console.log('Sample hrefs:', hrefs.slice(0, 10));
    // also search for any json or api links
    const apis = html.match(/https?:\/\/[^"'\s]+/gi);
    const apiMatches = (apis || []).filter(u => u.includes('api') || u.includes('product'));
    console.log('Api or product matches:', apiMatches.slice(0, 10));
  }
}

inspectElectromart();
