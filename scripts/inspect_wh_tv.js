const fs = require('fs');

async function run() {
  const [resWH, resTV] = await Promise.all([
    fetch('https://www.haier.com/bd/water-heaters/'),
    fetch('https://www.haier.com/bd/tvs/')
  ]);

  const wh = await resWH.text();
  const tv = await resTV.text();

  const m1 = wh.match(/var\s+listurl\s*=\s*'([^']+)'/);
  console.log('WH listurl:', m1 ? m1[1] : 'none');
  const m2 = tv.match(/var\s+listurl\s*=\s*'([^']+)'/);
  console.log('TV listurl:', m2 ? m2[1] : 'none');

  // Let's also check for product links or JSON
  const shtmlWh = (wh.match(/href="([^"]*water-heaters[^"]*\.shtml)"/g) || []).map(s => s.replace(/href="|"/g, ''));
  console.log('WH shtml links count:', shtmlWh.length);

  const shtmlTv = (tv.match(/href="([^"]*tvs?[^"]*\.shtml)"/g) || []).map(s => s.replace(/href="|"/g, ''));
  console.log('TV shtml links count:', shtmlTv.length);

  // Let's also fetch the sitemap to find all WH and TV URLs
  const sitemapRes = await fetch('https://www.haier.com/bd/sitemap.xml');
  const sitemapXml = await sitemapRes.text();
  const allUrls = (sitemapXml.match(/<loc>([^<]+)<\/loc>/g) || []).map(s => s.replace(/<\/?loc>/g, ''));
  
  const whUrls = allUrls.filter(u => u.includes('water-heaters') && u.endsWith('.shtml'));
  const tvUrls = allUrls.filter(u => (u.includes('/tv/') || u.includes('/tvs/')) && u.endsWith('.shtml'));

  console.log('\nSitemap WH URLs (' + whUrls.length + '):', whUrls);
  console.log('\nSitemap TV URLs (' + tvUrls.length + '):', tvUrls);

  fs.writeFileSync('haier_wh_urls.json', JSON.stringify(whUrls, null, 2));
  fs.writeFileSync('haier_tv_urls.json', JSON.stringify(tvUrls, null, 2));
}

run();
