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

  // Apply object-top to all hero slider images
  await page.evaluate(() => {
    document.querySelectorAll('div[aria-label="Hero Slider"] img').forEach(img => {
      img.className = "w-full h-full object-cover object-top rounded-lg";
    });
  });

  const dots = await page.$$('button[aria-label^="Go to slide"]');
  for (let i = 0; i < dots.length; i++) {
    await dots[i].click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `verify_slide_${i + 1}.png`),
      clip: { x: 50, y: 120, width: 850, height: 480 }
    });
    console.log(`Captured slide ${i + 1}`);
  }

  await browser.close();
  console.log('All slides verified!');
})();
