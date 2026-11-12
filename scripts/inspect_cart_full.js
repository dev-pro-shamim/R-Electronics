const fs = require('fs');
const html = fs.readFileSync('analysis/cart_content.html', 'utf8');

const svgIdx = html.indexOf('viewBox="0 0 40 40"');
console.log('--- CART MAIN CONTENT ---');
console.log(html.slice(svgIdx, svgIdx + 4000));
