const fs = require('fs');
const catalogUrls = JSON.parse(fs.readFileSync('haier_catalog_urls.json', 'utf8'));

const targets = ['578', '622', '386', '362', '500', '475'];
const matched = catalogUrls.fridges.filter(u => targets.some(t => u.includes(t)));
console.log('Target fridge matches:', matched);
