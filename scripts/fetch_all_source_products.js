const fs = require('fs');

async function fetchAllProducts() {
  console.log('Fetching all products from https://rangoelectronics.com/wp-json/wc/store/v1/products...');
  
  let allProducts = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    console.log(`Fetching page ${page}...`);
    const url = `https://rangoelectronics.com/wp-json/wc/store/v1/products?per_page=${perPage}&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`Page ${page} returned status ${res.status}`);
      break;
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      console.log(`Page ${page} empty or not array, ending.`);
      break;
    }
    allProducts = allProducts.concat(data);
    console.log(`Fetched ${data.length} products (Cumulative: ${allProducts.length})`);
    
    const totalPages = parseInt(res.headers.get('x-wp-totalpages') || '1', 10);
    if (page >= totalPages) break;
    page++;
  }

  console.log(`\nSuccessfully fetched total ${allProducts.length} raw products.`);
  fs.writeFileSync('scripts/raw_source_products.json', JSON.stringify(allProducts, null, 2));
  console.log('Saved to scripts/raw_source_products.json');
}

fetchAllProducts().catch(err => {
  console.error('Fetch error:', err);
  process.exit(1);
});
