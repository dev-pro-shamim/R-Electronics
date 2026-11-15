const fs = require('fs');
const path = require('path');

function run() {
  const prodFilePath = path.join(process.cwd(), 'src/data/products.ts');
  const code = fs.readFileSync(prodFilePath, 'utf8');

  // Load products array from products.ts
  const marker = 'export const PRODUCTS: Product[] = ';
  const idx = code.indexOf(marker);
  if (idx === -1) throw new Error('PRODUCTS array not found');

  const prefix = code.slice(0, idx + marker.length);
  const jsonStr = code.slice(idx + marker.length).trim().replace(/;\s*$/, '');
  
  let products;
  try {
    products = eval(jsonStr);
  } catch (e) {
    // If eval fails due to imports or formatting, read with json parse fallback
    console.log('Eval error, using custom extraction');
    throw e;
  }

  console.log(`Loaded ${products.length} products.`);

  let acCount = 0;
  for (const p of products) {
    if (p.category === 'air-conditioner') {
      acCount++;
      const title = (p.title || '').toLowerCase();
      const model = (p.model || '').toLowerCase();
      const desc = (p.shortDescription || p.description || '').toLowerCase();
      const combined = `${title} ${model} ${desc}`;

      // Re-classify accurately into official category slugs
      if (combined.includes('cassette')) {
        p.subcategory = '3-ton-cassette-4-ton-cassette-5-ton-cassette-type-ac';
      } else if (combined.includes('ceiling')) {
        p.subcategory = '3-ton-ceiling-4-ton-ceiling-5-ton-ceiling-type-ac';
      } else if (combined.includes('portable') || combined.includes('floor stand') || combined.includes('floor type')) {
        p.subcategory = 'portable-ac-and-floor-stand-ac';
      } else if (combined.includes('2.5 ton') || combined.includes('2.5ton')) {
        p.subcategory = '2-5-ton-inverter-and-non-inverter-ac';
      } else if (
        combined.includes('2 ton') ||
        combined.includes('2.0 ton') ||
        combined.includes('24000') ||
        combined.includes('24k') ||
        combined.includes('hsu-24') ||
        combined.includes('gs-24') ||
        combined.includes('2.0ton')
      ) {
        p.subcategory = '2-ton-inverter-and-non-inverter-ac';
      } else if (
        combined.includes('1.5 ton') ||
        combined.includes('1.6 ton') ||
        combined.includes('18000') ||
        combined.includes('19000') ||
        combined.includes('18k') ||
        combined.includes('19k') ||
        combined.includes('hsu-18') ||
        combined.includes('hsu-19') ||
        combined.includes('gs-18') ||
        combined.includes('1.5ton')
      ) {
        p.subcategory = '1-5-ton-inverter-and-non-inverter-ac';
      } else {
        // 1 Ton default
        p.subcategory = '1-ton-inverter-and-non-inverter-ac';
      }

      // Mark top residential split ACs as featured / hot deals for clean homepage presentation
      const isCleanSplit =
        !combined.includes('cassette') &&
        !combined.includes('ceiling') &&
        !combined.includes('floor type') &&
        (title.includes('Fairy') ||
         title.includes('Clivia') ||
         title.includes('Airy') ||
         title.includes('Shimo') ||
         title.includes('CleanCool') ||
         title.includes('TurboAqua') ||
         title.includes('AntiRust') ||
         title.includes('Cosmo') ||
         title.includes('Inverna'));

      if (isCleanSplit) {
        p.featured = true;
      }
    }
  }

  console.log(`Reassigned subcategories for ${acCount} AC products.`);

  // Write back to products.ts
  const newContent = `${prefix}${JSON.stringify(products, null, 2)};\n`;
  fs.writeFileSync(prodFilePath, newContent, 'utf8');
  console.log('Saved updated products.ts');
}

run();
