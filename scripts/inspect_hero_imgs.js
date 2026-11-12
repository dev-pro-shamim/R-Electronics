const fs = require('fs');
const html = fs.readFileSync('analysis/extracted_hero.html', 'utf8');

// Find all <img> tags in extracted_hero.html
const imgs = html.match(/<img[^>]+>/g);
console.log('Total images in hero:', imgs.length);
imgs.forEach((img, idx) => {
  const alt = img.match(/alt="([^"]*)"/)?.[1];
  const src = img.match(/src="([^"]*)"/)?.[1];
  console.log(`Image ${idx + 1}: alt="${alt}"`);
  console.log(`src="${src}"\n`);
});
