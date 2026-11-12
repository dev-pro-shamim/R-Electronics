const fs = require('fs');
const path = require('path');

async function runAudit() {
  console.log("=== Auditing rangoelectronics.com ===");

  // 1. Fetch categories
  console.log("1. Fetching all product categories...");
  let allCats = [];
  try {
    let catPage = 1;
    while (true) {
      const res = await fetch(`https://rangoelectronics.com/wp-json/wp/v2/product_cat?per_page=100&page=${catPage}`);
      if (!res.ok) break;
      const cats = await res.json();
      if (!Array.isArray(cats) || cats.length === 0) break;
      allCats = allCats.concat(cats);
      const totalPages = parseInt(res.headers.get('x-wp-totalpages') || '1', 10);
      console.log(`Cat Page ${catPage}: got ${cats.length} categories (Total: ${allCats.length}/${res.headers.get('x-wp-total')})`);
      if (catPage >= totalPages) break;
      catPage++;
    }
    fs.writeFileSync('scripts/live_all_categories.json', JSON.stringify(allCats, null, 2));
    console.log(`Saved ${allCats.length} categories to scripts/live_all_categories.json`);
  } catch (e) {
    console.error("Error fetching categories:", e.message);
  }

  // 2. Inspect WooCommerce Store API pagination & total count
  console.log("\n2. Checking Store API /wp-json/wc/store/v1/products...");
  try {
    const res = await fetch('https://rangoelectronics.com/wp-json/wc/store/v1/products?per_page=1');
    console.log("Store API headers:");
    console.log("x-wp-total:", res.headers.get('x-wp-total'));
    console.log("x-wp-totalpages:", res.headers.get('x-wp-totalpages'));
  } catch (e) {
    console.error("Store API check error:", e.message);
  }

  // 3. Inspect sitemaps
  console.log("\n3. Checking sitemaps...");
  const sitemapUrls = [
    'https://rangoelectronics.com/wp-sitemap-posts-product-1.xml',
    'https://rangoelectronics.com/wp-sitemap-posts-product-2.xml',
    'https://rangoelectronics.com/product-sitemap.xml',
    'https://rangoelectronics.com/product-sitemap1.xml',
    'https://rangoelectronics.com/sitemap_index.xml',
    'https://rangoelectronics.com/wp-sitemap.xml'
  ];

  for (const sm of sitemapUrls) {
    try {
      const res = await fetch(sm);
      console.log(`${sm} -> status ${res.status}, length: ${res.headers.get('content-length')}`);
    } catch (e) {
      console.log(`${sm} -> error: ${e.message}`);
    }
  }
}

runAudit().catch(console.error);
