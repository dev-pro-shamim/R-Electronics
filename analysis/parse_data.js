const fs = require('fs');

const catXml = fs.readFileSync('eb_category_sitemap.xml', 'utf8');
const catUrls = [...catXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
console.log('Total categories found:', catUrls.length);
console.log('Sample categories:', catUrls.slice(0, 20));

const prodXml = fs.readFileSync('eb_product_sitemap.xml', 'utf8');
const prodUrls = [...prodXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
console.log('Total products found:', prodUrls.length);
console.log('Sample products:', prodUrls.slice(0, 10));

// Let's inspect the categories structure: e.g. how many levels, path segments
const catPaths = catUrls.map(u => new URL(u).pathname);
fs.writeFileSync('all_categories.json', JSON.stringify(catPaths, null, 2));

// Check rsc_data.txt to extract JSON objects
const rsc = fs.readFileSync('rsc_data.txt', 'utf8');
console.log('RSC size:', rsc.length);

// Search for API URLs or backend domain in rsc
const apiMatches = [...new Set([...rsc.matchAll(/https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s"'\\]*/g)].map(m => m[0]))];
console.log('External/Internal URLs in RSC:', apiMatches.filter(u => !u.includes('electronicsbangladesh.com')).slice(0, 20));

// Search for backend endpoints
const endpoints = [...new Set([...rsc.matchAll(/\/api\/[a-zA-Z0-9_\-\/]+/g)].map(m => m[0]))];
console.log('API endpoints found:', endpoints);
