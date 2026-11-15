const fs = require('fs');

async function inspectNuxtData() {
  const html = fs.readFileSync('analysis_electromart.html', 'utf8');
  const nuxtMatch = html.match(/<script type="application\/json" data-nuxt-data="nuxt-app"[^>]*>([\s\S]*?)<\/script>/);
  if (nuxtMatch) {
    const raw = nuxtMatch[1];
    fs.writeFileSync('electromart_nuxt.json', raw);
    console.log('Saved electromart_nuxt.json. Length:', raw.length);
    const parsed = JSON.parse(raw);
    console.log('Array length:', parsed.length);
    
    // Search for strings or objects with product titles, slugs, prices
    const products = [];
    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        if (item.name || item.title || item.slug || item.mrp || item.price) {
          products.push({ idx: i, item });
        }
      }
    }
    console.log('Candidates found in Nuxt array:', products.length);
    if (products.length > 0) {
      console.log('Sample candidate:', JSON.stringify(products[0], null, 2));
    }
  }
}

inspectNuxtData();
