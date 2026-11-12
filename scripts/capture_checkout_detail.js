const puppeteer = require('puppeteer-core');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\DITS-USER\\.gemini\\antigravity\\brain\\116bd0ad-cecc-4623-88e6-f061cd011624';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new"
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });

  await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.scrollTo(0, 420));
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'checkout_payment_methods_detail.png') });
  await browser.close();
})();
