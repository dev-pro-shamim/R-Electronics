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

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // Open chatbot
  await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Toggle Rango Assistant"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Type and submit "Gree AC"
  const inputSelector = 'input[placeholder*="পণ্য বা মডেলের"]';
  await page.waitForSelector(inputSelector);
  await page.type(inputSelector, 'Gree AC');
  await page.keyboard.press('Enter');

  // Wait for dynamic search response
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'chatbot_product_card_reply.png') });
  await browser.close();
})();
