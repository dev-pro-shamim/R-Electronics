const fs = require('fs');

async function checkSitemap() {
  const res = await fetch('https://rangoelectronics.com/wp-sitemap-posts-product-1.xml');
  const xml = await res.text();
  const urls = [];
  const matches = xml.matchAll(/<loc>(.*?)<\/loc>/g);
  for (const m of matches) {
    urls.push(m[1]);
  }
  console.log(`Total URLs in wp-sitemap-posts-product-1.xml: ${urls.length}`);
  fs.writeFileSync('scripts/sitemap_product_urls.json', JSON.stringify(urls, null, 2));

  // Let's also fetch all products via WooCommerce Store API
  let allApiProducts = [];
  let page = 1;
  while (true) {
    const pRes = await fetch(`https://rangoelectronics.com/wp-json/wc/store/v1/products?per_page=100&page=${page}`);
    if (!pRes.ok) break;
    const items = await pRes.json();
    if (!Array.isArray(items) || items.length === 0) break;
    allApiProducts = allApiProducts.concat(items);
    console.log(`Page ${page}: got ${items.length} items (Total: ${allApiProducts.length})`);
    const totalPages = parseInt(pRes.headers.get('x-wp-totalpages') || '1', 10);
    if (page >= totalPages) break;
    page++;
  }
  console.log(`Total via Store API: ${allApiProducts.length}`);
  fs.writeFileSync('scripts/all_raw_153_products.json', JSON.stringify(allApiProducts, null, 2));

  // Check if any sitemap URLs are missing from API
  const apiSlugs = new Set(allApiProducts.map(p => p.slug));
  const missingFromApi = urls.filter(u => {
    const slug = u.replace(/\/$/, '').split('/').pop();
    return !apiSlugs.has(slug);
  });
  console.log(`Sitemap URLs missing from API: ${missingFromApi.length}`);
  if (missingFromApi.length > 0) {
    console.log("Missing slugs:", missingFromApi);
  }
}

checkSitemap().catch(console.error);
