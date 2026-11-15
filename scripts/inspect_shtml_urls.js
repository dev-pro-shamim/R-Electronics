const fs = require('fs');
const catalogUrls = JSON.parse(fs.readFileSync('haier_catalog_urls.json', 'utf8'));

function listShtml(urls) {
  return urls.filter(u => u.endsWith('.shtml'));
}

console.log('Sample Fridge URLs:');
console.log(listShtml(catalogUrls.fridges).slice(0, 15));

console.log('Sample Oven URLs:');
console.log(listShtml(catalogUrls.ovens));

console.log('Sample Freezer URLs:');
console.log(listShtml(catalogUrls.freezers).slice(0, 15));
