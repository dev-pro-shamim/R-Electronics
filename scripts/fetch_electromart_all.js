const fs = require('fs');

async function fetchElectromart() {
  console.log('--- Scraping Electromart ACs ---');
  const allProducts = [];
  const headers = {
    'Accept': 'application/json, text/plain, */*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  for (let page = 1; page <= 9; page++) {
    const listUrl = `https://admin.electromart.store/api/products?category=air-conditioner&page=${page}`;
    try {
      const res = await fetch(listUrl, { headers });
      if (!res.ok) {
        console.warn(`Page ${page} failed: ${res.status}`);
        continue;
      }
      const data = await res.json();
      const items = data?.data?.products?.data || [];
      console.log(`Page ${page}: found ${items.length} items`);
      for (const item of items) {
        allProducts.push(item);
      }
    } catch (err) {
      console.error(`Error page ${page}:`, err.message);
    }
  }

  console.log(`Total Electromart items found in list: ${allProducts.length}`);

  // Now fetch details for each to get full specifications & descriptions
  const detailedProducts = [];
  for (let i = 0; i < allProducts.length; i++) {
    const p = allProducts[i];
    const slug = p.slug;
    console.log(`[${i + 1}/${allProducts.length}] Fetching details: ${p.name}`);
    try {
      const dRes = await fetch(`https://admin.electromart.store/api/products/${encodeURIComponent(slug)}`, { headers });
      if (dRes.ok) {
        const dJson = await dRes.json();
        detailedProducts.push(dJson.data || p);
      } else {
        console.warn(`Detail failed for ${slug}, using summary`);
        detailedProducts.push(p);
      }
    } catch (err) {
      console.warn(`Detail error for ${slug}: ${err.message}`);
      detailedProducts.push(p);
    }
    // Tiny delay to be gentle
    await new Promise(r => setTimeout(r, 50));
  }

  fs.writeFileSync('electromart_acs_raw.json', JSON.stringify(detailedProducts, null, 2), 'utf8');
  console.log(`Saved ${detailedProducts.length} Electromart products to electromart_acs_raw.json`);
}

fetchElectromart();
