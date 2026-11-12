const fs = require('fs');

const rsc = fs.readFileSync('rsc_data.txt', 'utf8');
const unescaped = rsc.replace(/\\"/g, '"');

// Find all matches for "name":{"en":"..."}
const names = [...unescaped.matchAll(/"name":\{"en":"([^"]+)"\}/g)].map(m => m[1]);
console.log('Total entity names count:', names.length);
console.log('Sample names:\n', names.slice(0, 40));

// Find products with prices, images, slugs
const slugs = [...new Set([...unescaped.matchAll(/"slug":"([^"]+)"/g)].map(m => m[1]))];
console.log('Total slugs count:', slugs.length);
console.log('Sample slugs:\n', slugs.slice(0, 30));

// Find image urls
const images = [...new Set([...unescaped.matchAll(/https?:\/\/[^\s"']+\.(?:jpg|png|webp|gif)/g)].map(m => m[0]))];
console.log('Total image URLs count:', images.length);
console.log('Sample images:\n', images.slice(0, 15));
fs.writeFileSync('all_image_urls.json', JSON.stringify(images, null, 2));
