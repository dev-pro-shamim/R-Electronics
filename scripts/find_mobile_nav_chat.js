const fs = require('fs');
const html = fs.readFileSync('analysis/eb_homepage.html', 'utf8');

// Find fixed bottom navigation bar
const lines = html.split('\n');
console.log('Searching for fixed bottom elements...');
const bottomNavRegex = /<nav[^>]*fixed[^>]*bottom|class="[^"]*fixed[^"]*bottom[^"]*"/gi;
let m;
while ((m = bottomNavRegex.exec(html)) !== null) {
  console.log('Found fixed bottom at index:', m.index);
  console.log(html.slice(m.index, m.index + 1200));
  console.log('-------------------------------');
}

// Search for chat or bot
console.log('Searching for chat widget...');
const chatRegex = /chatbot|tawk|crisp|botman|livechat|whatsapp/gi;
const foundTerms = new Set();
while ((m = chatRegex.exec(html)) !== null) {
  foundTerms.add(m[0].toLowerCase());
}
console.log('Chat terms found:', Array.from(foundTerms));
