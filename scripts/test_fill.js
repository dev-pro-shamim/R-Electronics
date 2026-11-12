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

  // Apply object-fill to all hero slider images
  await page.evaluate(() => {
    document.querySelectorAll('div[aria-label="Hero Slider"] img').forEach(img => {
      img.className = "w-full h-full object-fill rounded-lg";
    });
  });

  const dots = await page.$$('button[aria-label^="Go to slide"]');
  // Check slide 1 (AC), slide 3 (Fridge - user issue), slide 6 (Water purifier), slide 7 (Geyser)
  const toCheck = [0, 2, 5, 6];
  for (const idx of toCheck) {
    await dots[idx].click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `test_fill_slide_${idx + 1}.png`),
      clip: { x: 50, y: 120, width: 850, height: 480 }
    });
    console.log(`Captured fill slide ${idx + 1}`);
  }

  await browser.close();
  console.log('Done fill testing!');
})();
