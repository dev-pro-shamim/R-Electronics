const fs = require('fs');

async function testSitemap() {
  const sitemaps = [
    'https://www.haier.com/robots.txt',
    'https://www.haier.com/bd/sitemap.xml',
    'https://www.haier.com/sitemap.xml',
    'https://www.haier.com/bd/sitemap_index.xml',
    'https://www.haier.com/bd/air-conditioners/sitemap.xml'
  ];

  for (const s of sitemaps) {
    try {
      const res = await fetch(s);
      console.log(s, 'Status:', res.status);
      if (res.ok) {
        const text = await res.text();
        console.log(s, 'Length:', text.length, 'Sample:', text.slice(0, 300));
        fs.writeFileSync('haier_sitemap_sample.txt', text);
      }
    } catch (e) {
      console.error(s, e.message);
    }
  }
}

testSitemap();
