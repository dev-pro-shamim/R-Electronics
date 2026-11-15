const fs = require('fs');

const html = fs.readFileSync('analysis_haier.html', 'utf8');

// Find script tags at the bottom of the page
const bodyScripts = html.match(/<script[\s\S]*?<\/script>/gi) || [];
console.log('Total scripts:', bodyScripts.length);
bodyScripts.forEach((s, idx) => {
  if (s.includes('siteConfig') || s.includes('product') || s.includes('Vue') || s.includes('window.')) {
    console.log(`Script ${idx} (len ${s.length}):`, s.slice(0, 300));
  }
});
