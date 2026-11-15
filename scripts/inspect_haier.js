const fs = require('fs');

async function inspectHaier() {
  const url = 'https://www.haier.com/bd/air-conditioners/?spm=bd.Homepage_pc.headerLeft-20261020.1';
  console.log('Fetching Haier page:', url);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const html = await res.text();
  fs.writeFileSync('analysis_haier.html', html);
  console.log('Saved analysis_haier.html. Length:', html.length);

  // Search for product cards, scripts, json data
  const scripts = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
  console.log('Haier script count:', scripts.length);
  for (const s of scripts) {
    if (s.includes('CleanCool') || s.includes('HSU-') || s.includes('product') || s.includes('price')) {
      if (s.length < 5000) {
        console.log('Interesting script snippet:', s.slice(0, 300));
      } else {
        console.log('Large script with keyword, length:', s.length);
      }
    }
  }

  // Search for product links
  const links = html.match(/href=["'][^"']*air-conditioners\/[^"']*["']/gi) || [];
  console.log('Product links matching air-conditioners:', Array.from(new Set(links)).slice(0, 20));

  // Search for any product card blocks
  const cards = html.match(/class=["'][^"']*product[^"']*["']/gi) || [];
  console.log('Product class occurrences:', cards.length);
}

inspectHaier();
