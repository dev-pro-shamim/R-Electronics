const fs = require('fs');
const css = fs.readFileSync('analysis/style2.css', 'utf8');

// Find custom media queries / screens
const screens = [...new Set([...css.matchAll(/@media[^{]+/g)].map(m => m[0].trim()))];
console.log('Sample media queries:', screens.slice(0, 10));

// Find primary color uses
const primaryMatches = [...new Set([...css.matchAll(/#006a4e|#006A4E/g)].map(m => m[0]))];
console.log('Primary hex found:', primaryMatches);
