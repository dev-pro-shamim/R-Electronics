const fs = require('fs');

async function auditSource() {
  console.log('--- Starting Source Audit of https://rangoelectronics.com/ ---');

  // 1. Check Store API
  try {
    const res = await fetch('https://rangoelectronics.com/wp-json/wc/store/v1/products?per_page=1');
    console.log('wc/store/v1/products HTTP status:', res.status);
    console.log('X-WP-Total:', res.headers.get('x-wp-total'));
    console.log('X-WP-TotalPages:', res.headers.get('x-wp-totalpages'));
  } catch (e) {
    console.log('wc/store/v1/products error:', e.message);
  }

  // 2. Check WP REST API
  try {
    const res = await fetch('https://rangoelectronics.com/wp-json/wp/v2/product?per_page=1');
    console.log('wp/v2/product HTTP status:', res.status);
    console.log('X-WP-Total:', res.headers.get('x-wp-total'));
    console.log('X-WP-TotalPages:', res.headers.get('x-wp-totalpages'));
  } catch (e) {
    console.log('wp/v2/product error:', e.message);
  }

  // 3. Check Categories
  try {
    const res = await fetch('https://rangoelectronics.com/wp-json/wc/store/v1/products/categories?per_page=100');
    if (res.ok) {
      const cats = await res.json();
      console.log('Store Categories count:', cats.length);
      fs.writeFileSync('scripts/source_categories.json', JSON.stringify(cats, null, 2));
    }
  } catch (e) {
    console.log('Categories error:', e.message);
  }

  // 4. Check Brands / Attributes
  try {
    const res = await fetch('https://rangoelectronics.com/wp-json/wc/store/v1/products/attributes');
    if (res.ok) {
      const attrs = await res.json();
      console.log('Attributes count:', attrs.length);
    }
  } catch (e) {
    console.log('Attributes error:', e.message);
  }

  // 5. Check Sitemap
  try {
    const res = await fetch('https://rangoelectronics.com/wp-sitemap.xml');
    if (res.ok) {
      const xml = await res.text();
      fs.writeFileSync('scripts/wp_sitemap.xml', xml);
      console.log('Saved wp_sitemap.xml, length:', xml.length);
    }
  } catch (e) {
    console.log('Sitemap error:', e.message);
  }
}

auditSource();
