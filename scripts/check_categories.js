const fs = require('fs');
const content = fs.readFileSync('src/data/products.ts', 'utf8');

// Match JSON objects inside PRODUCTS
const productBlocks = content.split(/\n\s*\{\s*\n\s*"id":/);
console.log('Total product blocks:', productBlocks.length - 1);

const acList = [];
const homeAppList = [];

for (let i = 1; i < productBlocks.length; i++) {
  const b = productBlocks[i];
  const id = (b.match(/"id":\s*"([^"]+)"/) || [])[1] || '';
  const title = (b.match(/"title":\s*"([^"]+)"/) || [])[1] || '';
  const cat = (b.match(/"category":\s*"([^"]+)"/) || [])[1] || '';
  const subcat = (b.match(/"subcategory":\s*"([^"]+)"/) || [])[1] || '';

  if (cat === 'air-conditioner') {
    acList.push({ id, title, subcat });
  } else if (cat === 'home-appliance') {
    homeAppList.push({ id, title, subcat });
  }
}

console.log(`\nAir Conditioner count: ${acList.length}`);
acList.forEach(a => console.log(`  AC: [${a.subcat}] ${a.title}`));

console.log(`\nHome Appliance count: ${homeAppList.length}`);
homeAppList.forEach(h => console.log(`  HomeApp: [${h.subcat}] ${h.title}`));
