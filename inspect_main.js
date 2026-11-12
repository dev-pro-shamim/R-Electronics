const fs = require('fs');
const html = fs.readFileSync('analysis/extracted_main.html', 'utf8');
const idx = html.indexOf('homepage-seo-content');
const endIdx = html.indexOf('</main>', idx);
console.log(html.slice(idx - 10, endIdx));
