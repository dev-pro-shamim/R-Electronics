const fs = require('fs');
const html = fs.readFileSync('eb_homepage.html', 'utf8');

// Let's find all headers, navs, sections, footers
console.log('--- HTML TAGS OVERVIEW ---');
const headerMatch = html.match(/<header[\s\S]*?<\/header>/gi);
console.log('Headers found:', headerMatch ? headerMatch.length : 0);
if (headerMatch) {
  fs.writeFileSync('extracted_header.html', headerMatch[0]);
  console.log('Header length:', headerMatch[0].length);
}

const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/gi);
console.log('Footers found:', footerMatch ? footerMatch.length : 0);
if (footerMatch) {
  fs.writeFileSync('extracted_footer.html', footerMatch[0]);
  console.log('Footer length:', footerMatch[0].length);
}

const mainMatch = html.match(/<main[\s\S]*?<\/main>/gi);
console.log('Main found:', mainMatch ? mainMatch.length : 0);
if (mainMatch) {
  fs.writeFileSync('extracted_main.html', mainMatch[0]);
  console.log('Main length:', mainMatch[0].length);
}

// Let's inspect sections in main
if (mainMatch) {
  const sections = [...mainMatch[0].matchAll(/<section[^>]*>([\s\S]*?)<\/section>/gi)];
  console.log('Sections in main:', sections.length);
}
