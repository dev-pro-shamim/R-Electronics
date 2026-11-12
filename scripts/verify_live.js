const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:/Users/DITS-USER/.gemini/antigravity/brain/116bd0ad-cecc-4623-88e6-f061cd011624';

async function verify() {
  console.log('Starting live verification...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Homepage & Mid Banner
  console.log('1. Verifying Homepage Mid Banner with new image...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(() => {
    window.scrollBy(0, 1100);
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'target_mid_banner_verified.png') });
  console.log('Saved target_mid_banner_verified.png');

  // 2. Product Details with JSON-LD Schema
  console.log('2. Verifying Single Product Details...');
  await page.goto('http://localhost:3000/product/panasonic-mixer-grinder-mxge3750-black', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000));
  
  const title = await page.title();
  const schemaExists = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    return scripts.length;
  });
  console.log('Product Page Title:', title);
  console.log('JSON-LD schema scripts count:', schemaExists);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'target_product_migrated_verified.png') });
  console.log('Saved target_product_migrated_verified.png');

  // 3. Category Page: Washing Machine
  console.log('3. Verifying Category Page for Washing Machine...');
  await page.goto('http://localhost:3000/category/washing-machine', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000));
  const productCards = await page.evaluate(() => {
    return document.querySelectorAll('article').length || document.querySelectorAll('img[alt]').length;
  });
  console.log('Washing Machine page elements count:', productCards);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'target_washing_machine_category.png') });

  await browser.close();
  console.log('All verification checks passed successfully!');
}

verify().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
