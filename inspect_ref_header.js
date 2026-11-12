const fs = require('fs');
const header = fs.readFileSync('analysis/extracted_header.html', 'utf8');

// Find top bar container
const topBarMatch = header.match(/<div class="bg-primary[^"]*"[\s\S]*?<\/nav>/i);
if (topBarMatch) {
  console.log('Top bar + Nav HTML length:', topBarMatch[0].length);
  fs.writeFileSync('ref_header_exact.html', topBarMatch[0]);
  console.log('Saved ref_header_exact.html');
}
