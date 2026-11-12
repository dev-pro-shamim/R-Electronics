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

  await page.goto("http://localhost:3000", { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));

  // Navigate to slide 3 (Smart Fridge - the exact slide user highlighted)
  const dots = await page.$$('button[aria-label^="Go to slide"]');
  if (dots.length >= 3) {
    await dots[2].click();
    await new Promise(r => setTimeout(r, 600));
  }

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'preview_rango_fixed_logo_fridge.png'),
    clip: { x: 0, y: 0, width: 1400, height: 680 }
  });

  await browser.close();
  console.log('Saved fixed fridge screenshot!');
})();
