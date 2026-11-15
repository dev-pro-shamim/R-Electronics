const fs = require('fs');

const sitemap = fs.readFileSync('haier_sitemap_sample.txt', 'utf8');

// Extract all <loc>...</loc>
const locs = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)).map(m => m[1]);
console.log('Total URLs in Haier BD sitemap:', locs.length);

const acUrls = locs.filter(u => u.includes('air-conditioner') || u.includes('/ac/'));
console.log('AC URLs in sitemap:', acUrls.length);
console.log('All AC URLs:');
acUrls.forEach(u => console.log(u));
fs.writeFileSync('haier_ac_urls.json', JSON.stringify(acUrls, null, 2));
