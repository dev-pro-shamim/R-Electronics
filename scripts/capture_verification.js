const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  const artifactDir = 'C:/Users/DITS-USER/.gemini/antigravity/brain/116bd0ad-cecc-4623-88e6-f061cd011624';
  
  console.log('Capturing target_home_updated.png ...');
  await page.screenshot({ path: path.join(artifactDir, 'target_home_updated.png') });

  // Get first product link from homepage
  const productHref = await page.evaluate(() => {
    const a = document.querySelector('a[href^="/product/"]');
    return a ? a.getAttribute('href') : null;
  });

  console.log('Product link found:', productHref);
  if (productHref) {
    console.log(`Navigating to http://localhost:3000${productHref} ...`);
    await page.goto(`http://localhost:3000${productHref}`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    console.log('Capturing target_product_updated.png ...');
    await page.screenshot({ path: path.join(artifactDir, 'target_product_updated.png') });
  }

  await browser.close();
  console.log('Done capturing screenshots!');
}

main().catch(console.error);
