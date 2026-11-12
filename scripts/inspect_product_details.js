const fs = require('fs');
const html = fs.readFileSync('analysis/extracted_product_main.html', 'utf8');

const fixedIdx = html.indexOf('fixed z-50 xl:hidden');
if (fixedIdx !== -1) {
  console.log(html.slice(fixedIdx - 50, fixedIdx + 1000));
} else {
  // search for bottom bar
  const bbar = html.match(/class="[^"]*fixed[^"]*bottom[^"]*"/);
  console.log('Fixed bottom bar:', bbar ? bbar[0] : 'None');
}
