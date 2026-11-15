const fs = require('fs');

const html = fs.readFileSync('analysis_haier.html', 'utf8');

const idx = html.indexOf('var siteConfig');
console.log(html.slice(idx, idx + 1000));
