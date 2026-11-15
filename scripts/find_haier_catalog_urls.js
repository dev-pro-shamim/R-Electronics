async function getHaierUrls() {
  const res = await fetch('https://www.haier.com/bd/sitemap.xml');
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>(https:\/\/www\.haier\.com\/bd\/[^<]+)<\/loc>/g)].map(m => m[1]);
  console.log('Total URLs in sitemap:', urls.length);

  const fridges = urls.filter(u => u.includes('/refrigerators/'));
  const freezers = urls.filter(u => u.includes('/freezers/'));
  const ovens = urls.filter(u => u.includes('/oven/'));

  console.log('Fridges:', fridges.length);
  console.log('Freezers:', freezers.length);
  console.log('Ovens:', ovens.length);

  require('fs').writeFileSync('haier_catalog_urls.json', JSON.stringify({ fridges, freezers, ovens }, null, 2), 'utf8');
}
getHaierUrls();
