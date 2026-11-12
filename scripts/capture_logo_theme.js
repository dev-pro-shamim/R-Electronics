const puppeteer = require('puppeteer-core');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\DITS-USER\\.gemini\\antigravity\\brain\\116bd0ad-cecc-4623-88e6-f061cd011624';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new"
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // 1. Homepage Header & Hero
  console.log('Capturing Homepage Header...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'preview_rango_homepage_header.png'), fullPage: false });

  // 2. Product Details Page
  console.log('Capturing Product Details Page...');
  await page.goto('http://localhost:3000/product/panasonic-mixer-grinder-mxge3750-black', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'preview_rango_product_details.png'), fullPage: false });

  // 3. AuthModal with New Theme
  console.log('Capturing AuthModal...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('header button, header a')).find(el => el.textContent && (el.textContent.includes('Login') || el.textContent.includes('Sign In') || el.textContent.includes('Account')));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'preview_rango_auth_modal.png'), fullPage: false });

  // 4. Footer
  console.log('Capturing Footer...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'preview_rango_footer.png'), fullPage: false });

  await browser.close();
  console.log('All theme preview screenshots captured!');
})();
