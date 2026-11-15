const fs = require('fs');

async function checkSpecs(url) {
  const res = await fetch(url);
  const html = await res.text();

  // Find specifications
  const tableRows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const specs = [];
  for (const r of tableRows) {
    const tds = [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
    if (tds.length >= 2 && tds[0] && tds[1]) {
      specs.push({ key: tds[0], value: tds[1] });
    }
  }

  // Also check divs with spec
  const divSpecs = [...html.matchAll(/<div[^>]*class="[^"]*(?:spec-item|param-item|item)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi)];

  // Look for product image carousel
  const imgs = (html.match(/https:\/\/image\.haier\.com\/bd\/[^"'\s>]+\.(?:png|jpg|jpeg)/gi) || []);
  const mainImgs = [...new Set(imgs)].filter(u => 
    (u.includes('_600.png') || u.includes('_1200_q.png') || u.includes('_800.')) &&
    !u.includes('header') && !u.includes('footer')
  );

  console.log(`\nURL: ${url}`);
  console.log(`Specs found (${specs.length}):`, specs.slice(0, 5));
  console.log(`Main product images (${mainImgs.length}):`, mainImgs);
}

async function run() {
  await checkSpecs('https://www.haier.com/bd/water-heaters/es30h-ck3-bd-.shtml');
  await checkSpecs('https://www.haier.com/bd/tvs/h32s80gfx.shtml');
}

run();
