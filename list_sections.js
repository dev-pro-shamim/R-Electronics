const fs = require('fs');
const html = fs.readFileSync('analysis/extracted_main.html', 'utf8');

const sectionRe = /<section[^>]*class="([^"]*)"[^>]*>([\s\S]*?)<\/section>/g;
let match;
let i = 1;
while ((match = sectionRe.exec(html)) !== null) {
  const cls = match[1];
  const content = match[2];
  const h2 = content.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
  const heading = h2 ? h2[1].replace(/<[^>]+>/g, '').trim() : '(No H2)';
  const articleCount = (content.match(/<article/g) || []).length;
  console.log(`Section ${i++}: [${heading}] class="${cls.slice(0, 50)}" articles=${articleCount}`);
}
