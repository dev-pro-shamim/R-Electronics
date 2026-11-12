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

  // Open AuthModal
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('header button, header a')).find(el => el.textContent && (el.textContent.includes('Login') || el.textContent.includes('Sign In') || el.textContent.includes('Account')));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'rango_exact_reference_auth_modal.png') });
  await browser.close();
  console.log('Saved rango_exact_reference_auth_modal.png');
})();
