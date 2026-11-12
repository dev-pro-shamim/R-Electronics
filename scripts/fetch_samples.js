const fs = require('fs');

async function test() {
  const rStore = await fetch("https://rangoelectronics.com/wp-json/wc/store/v1/products?per_page=1");
  const pStore = await rStore.json();
  fs.writeFileSync("scripts/sample_store_product.json", JSON.stringify(pStore[0], null, 2));

  const rWp = await fetch("https://rangoelectronics.com/wp-json/wp/v2/product?per_page=1");
  const pWp = await rWp.json();
  fs.writeFileSync("scripts/sample_wp_product.json", JSON.stringify(pWp[0], null, 2));

  console.log("Saved samples.");
  console.log("Store fields:", Object.keys(pStore[0]));
  console.log("WP fields:", Object.keys(pWp[0]));
}

test().catch(console.error);
