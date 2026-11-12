const fs = require('fs');
const html = fs.readFileSync('analysis/checkout_content.html', 'utf8');

const formIdx = html.indexOf('<form') !== -1 ? html.indexOf('<form') : html.indexOf('Shipping');
console.log('--- CHECKOUT FORM ---');
console.log(html.slice(1000, 5000));
