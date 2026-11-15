const fs = require('fs');

const js = fs.readFileSync('haier2025_product_list.js', 'utf8');

const regex = /listUrl/g;
let match;
while ((match = regex.exec(js)) !== null) {
  console.log('Match at index:', match.index);
  console.log(js.slice(Math.max(0, match.index - 100), Math.min(js.length, match.index + 200)));
  console.log('-------------------------');
}
