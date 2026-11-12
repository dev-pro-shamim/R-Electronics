const fs = require('fs');

const cats = JSON.parse(fs.readFileSync('scripts/live_all_categories.json', 'utf8'));

console.log(`Total categories: ${cats.length}`);

// Build parent map
const catMap = new Map();
cats.forEach(c => catMap.set(c.id, { ...c, children: [] }));

const rootCats = [];
cats.forEach(c => {
  if (c.parent === 0) {
    rootCats.push(catMap.get(c.id));
  } else if (catMap.has(c.parent)) {
    catMap.get(c.parent).children.push(catMap.get(c.id));
  } else {
    rootCats.push(catMap.get(c.id));
  }
});

function printTree(cat, indent = "") {
  console.log(`${indent}📁 [ID: ${cat.id}] ${cat.name} (slug: ${cat.slug}, count: ${cat.count})`);
  for (const child of cat.children) {
    printTree(child, indent + "   └── ");
  }
}

console.log("\n=== CATEGORY HIERARCHY OF RANGOELECTRONICS.COM ===");
rootCats.forEach(rc => printTree(rc));
