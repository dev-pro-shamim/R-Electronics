const fs = require('fs');
const navHtml = fs.readFileSync('header_nav.html', 'utf8');

// Parse the menu items
// Let's see the structure of navHtml
console.log('Nav HTML sample:\n', navHtml.substring(0, 1500));

// Let's find top-level categories and subcategories
const regex = /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
const links = [];
let match;
while ((match = regex.exec(navHtml)) !== null) {
  const href = match[1];
  const text = match[2].replace(/<[^>]+>/g, '').trim();
  if (text) {
    links.push({ href, text });
  }
}
console.log('Total nav links:', links.length);
console.log('Nav links:', JSON.stringify(links, null, 2));
fs.writeFileSync('nav_categories.json', JSON.stringify(links, null, 2));
