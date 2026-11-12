const fs = require('fs');

const mainHtml = fs.readFileSync('extracted_main.html', 'utf8');
const headerHtml = fs.readFileSync('extracted_header.html', 'utf8');
const footerHtml = fs.readFileSync('extracted_footer.html', 'utf8');

// Inspect Header elements
console.log('=== HEADER ANALYSIS ===');
const headerLines = headerHtml.split('\n');
console.log('Header preview (first 500 chars):');
console.log(headerHtml.substring(0, 500));

// Find phone numbers, text, links in header
const headerLinks = [...headerHtml.matchAll(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)].map(m => ({
  href: m[1],
  text: m[2].replace(/<[^>]+>/g, '').trim()
})).filter(l => l.text);
console.log('Header text links:', headerLinks.slice(0, 30));

// Inspect Sections in Main
console.log('\n=== MAIN SECTIONS (15) ===');
const sections = [...mainHtml.matchAll(/<section([^>]*)>([\s\S]*?)<\/section>/gi)];
sections.forEach((sec, idx) => {
  const attrs = sec[1];
  const body = sec[2];
  // extract h1, h2, h3, h4 or titles
  const headings = [...body.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);
  const imgCount = [...body.matchAll(/<img/gi)].length;
  const linkCount = [...body.matchAll(/<a/gi)].length;
  const classMatch = attrs.match(/class="([^"]*)"/i);
  const className = classMatch ? classMatch[1] : '';
  console.log(`\nSection #${idx + 1}:`);
  console.log(`  Classes: ${className.substring(0, 80)}...`);
  console.log(`  Headings:`, headings.slice(0, 5));
  console.log(`  Images: ${imgCount}, Links: ${linkCount}, Size: ${body.length}`);
});
