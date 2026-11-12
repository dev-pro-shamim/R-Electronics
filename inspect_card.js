const fs = require('fs');
const html = fs.readFileSync('analysis/eb_homepage.html', 'utf8');
const articleIdx = html.indexOf('</article>', 159078);
console.log(html.slice(articleIdx - 300, articleIdx + 20));
