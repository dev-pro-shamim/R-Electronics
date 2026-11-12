const fs = require('fs');
const path = require('path');

const srcDir = path.resolve('src');
const patterns = [
  /electronics\s*bangladesh/i,
  /electronicsbangladesh\.com/i,
  /eb-logo/i
];

function searchDir(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      searchDir(fullPath, results);
    } else if (/\.(tsx?|jsx?|json|css|html)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        for (const pat of patterns) {
          if (pat.test(line)) {
            results.push({
              file: path.relative(process.cwd(), fullPath),
              line: idx + 1,
              match: line.trim().substring(0, 150)
            });
            break;
          }
        }
      });
    }
  }
  return results;
}

const found = searchDir(srcDir);
console.log(`Found ${found.length} matches:`);
console.log(JSON.stringify(found, null, 2));
