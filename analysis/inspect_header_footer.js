const fs = require('fs');

const headerHtml = fs.readFileSync('extracted_header.html', 'utf8');

// Look for category menu structure in header
console.log('--- HEADER NAV STRUCTURE ---');
// Let's find nav links and dropdowns
const navItems = [...headerHtml.matchAll(/<nav[^>]*>([\s\S]*?)<\/nav>/gi)];
console.log('Nav tags count:', navItems.length);
if (navItems.length > 0) {
  fs.writeFileSync('header_nav.html', navItems[0][0]);
  console.log('Saved header_nav.html, size:', navItems[0][0].length);
}

// Find top bar elements
const topBar = headerHtml.match(/<div class="[^"]*bg-primary[^"]*"[\s\S]*?<\/div>\s*<\/div>/i);
if (topBar) {
  console.log('Found top bar / header bar');
}

// Check footer content
const footerHtml = fs.readFileSync('extracted_footer.html', 'utf8');
const footerLinks = [...footerHtml.matchAll(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)].map(m => ({
  href: m[1],
  text: m[2].replace(/<[^>]+>/g, '').trim()
})).filter(l => l.text);
console.log('\n--- FOOTER LINKS ---');
console.log(footerLinks);

// Footer columns and text
const footerText = footerHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
console.log('\n--- FOOTER TEXT SAMPLE ---');
console.log(footerText.substring(0, 1000));
