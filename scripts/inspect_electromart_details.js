const fs = require('fs');

const html = fs.readFileSync('analysis_electromart.html', 'utf8');

// Find all matches for https://admin.electromart.store/api
const apiMatches = html.match(/https?:\/\/admin\.electromart\.store\/api[^\s"']+/gi) || [];
console.log('API endpoints found:', Array.from(new Set(apiMatches)));

// Search for product card links or titles
const productLinks = html.match(/\/product\/[^\s"']+/gi) || html.match(/\/products\/[^\s"']+/gi) || [];
console.log('Product links:', Array.from(new Set(productLinks)).slice(0, 20));

// Search for script tags or initial data
const scripts = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
console.log('Script tags count:', scripts.length);
for (const s of scripts) {
  if (s.includes('products') || s.includes('air-conditioner') || s.includes('Gree') || s.includes('Konka')) {
    console.log('Found script with keyword! Length:', s.length);
    console.log(s.slice(0, 300));
  }
}
