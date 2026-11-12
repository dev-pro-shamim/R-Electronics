const fs = require('fs');
const html = fs.readFileSync('analysis/eb_homepage.html', 'utf8');

const navIdx = html.indexOf('class="fixed xl:hidden bg-white backdrop-blur shadow-[0px_0px_10px_rgb(0_0_0_/_10%)] bottom-0 left-0 right-0"');
const afterOffer = html.indexOf('/offer', navIdx);
const afterImg = html.indexOf('</image>', afterOffer);
console.log(html.slice(afterImg, afterImg + 3000));
