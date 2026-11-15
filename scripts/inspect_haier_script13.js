const fs = require('fs');

const html = fs.readFileSync('analysis_haier.html', 'utf8');
const bodyScripts = html.match(/<script[\s\S]*?<\/script>/gi) || [];
console.log('Script 13 full content:');
console.log(bodyScripts[13]);
