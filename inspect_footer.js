const fs = require('fs');
const html = fs.readFileSync('analysis/extracted_footer.html', 'utf8');
console.log(html.slice(10000));
