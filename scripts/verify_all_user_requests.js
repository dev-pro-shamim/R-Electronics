const puppeteer = require('puppeteer-core');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\DITS-USER\\.gemini\\antigravity\\brain\\116bd0ad-cecc-4623-88e6-f061cd011624';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new"
  });

  // 1. Verify 11.11 Mega Sale Banner with Rango preview
  const page1 = await browser.newPage();
  await page1.setViewport({ width: 1400, height: 900 });
  await page1.goto("http://localhost:3000", { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  // Scroll to PromoBannerFull
  await page1.evaluate(() => {
    const banner = document.querySelector('img[alt*="11-11"]');
    if (banner) banner.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 500));

  await page1.screenshot({
    path: path.join(ARTIFACT_DIR, 'verify_11_11_banner_live.png'),
    clip: { x: 50, y: 350, width: 1300, height: 260 }
  });
  console.log('Captured 11.11 banner live');
  await page1.close();

  // 2. Verify Compare Page
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 1400, height: 900 });
  await page2.goto("http://localhost:3000/compare", { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));

  await page2.screenshot({
    path: path.join(ARTIFACT_DIR, 'verify_compare_empty_state.png'),
    fullPage: false
  });
  console.log('Captured compare empty state');

  // Click on "Compare 4K Smart TVs" preset
  const presetBtn = await page2.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const tvBtn = btns.find(b => b.textContent && b.textContent.includes('Compare 4K Smart TVs'));
    if (tvBtn) {
      tvBtn.click();
      return true;
    }
    return false;
  });
  console.log('Clicked preset TV button:', presetBtn);
  await new Promise(r => setTimeout(r, 800));

  await page2.screenshot({
    path: path.join(ARTIFACT_DIR, 'verify_compare_table_live.png'),
    fullPage: false
  });
  console.log('Captured compare table live');
  await page2.close();

  // 3. Verify Print Invoice Single Page
  const page3 = await browser.newPage();
  await page3.setViewport({ width: 1200, height: 900 });
  await page3.goto("http://localhost:3000/invoice/RE-104921", { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));

  // Emulate print media
  await page3.emulateMediaType('print');
  await page3.screenshot({
    path: path.join(ARTIFACT_DIR, 'verify_invoice_print_emulated.png'),
    fullPage: true
  });
  console.log('Captured print emulated invoice');
  await page3.close();

  await browser.close();
  console.log('All verifications complete!');
})();
