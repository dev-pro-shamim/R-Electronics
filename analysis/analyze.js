const fs = require('fs');

console.log('--- SITEMAP ---');
console.log(fs.readFileSync('eb_sitemap.xml', 'utf8'));

const html = fs.readFileSync('eb_homepage.html', 'utf8');

// Check script tags
const scripts = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m => m[1]);
console.log('Scripts count:', scripts.length);
console.log('Scripts:', scripts.slice(0, 15));

// Check css links
const css = [...html.matchAll(/<link[^>]*href="([^"]+\.css[^"]*)"/g)].map(m => m[1]);
console.log('CSS count:', css.length);
console.log('CSS links:', css);

// Check inline scripts
const inlineMatches = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
console.log('Inline scripts count:', inlineMatches.length);

let rscCount = 0;
let rscContent = [];
for (const m of inlineMatches) {
  const content = m[1];
  if (content.includes('__NEXT_DATA__')) {
    console.log('Found __NEXT_DATA__!');
    fs.writeFileSync('next_data.json', content);
  }
  if (content.includes('self.__next_f.push')) {
    rscCount++;
    rscContent.push(content);
  }
}
console.log('Found self.__next_f.push chunks:', rscCount);
if (rscContent.length > 0) {
  fs.writeFileSync('rsc_data.txt', rscContent.join('\n\n---CHUNK---\n\n'));
  console.log('Saved rsc_data.txt');
}
