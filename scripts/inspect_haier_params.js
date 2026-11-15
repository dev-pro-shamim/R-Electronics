const fs = require('fs');

const html = fs.readFileSync('analysis_haier.html', 'utf8');

// Find all occurrences of getProduct or getMerge or searchParams in analysis_haier.html
const matches = html.match(/.{0,100}(?:searchParams|filterJsonUrl|getProduct|getMerge).{0,200}/gi) || [];
console.log('Matches in analysis_haier.html count:', matches.length);
matches.forEach((m, idx) => console.log(`--- Match ${idx+1} ---:\n${m}`));
