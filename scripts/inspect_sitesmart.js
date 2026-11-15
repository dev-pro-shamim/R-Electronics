const fs = require('fs');

const html = fs.readFileSync('analysis_haier.html', 'utf8');

const idx = html.indexOf('siteSmartSearchId');
if (idx !== -1) {
  console.log(html.slice(idx - 50, idx + 200));
} else {
  console.log('siteSmartSearchId not found, looking in siteConfig:');
  const sIdx = html.indexOf('var siteConfig');
  console.log(html.slice(sIdx, sIdx + 1200));
}
