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

  // Navigate to slide 3 (smart fridge - which was in user screenshot)
  const dots = await page.$$('button[aria-label^="Go to slide"]');
  if (dots.length >= 3) {
    await dots[2].click(); // slide 3: smart fridge
    await new Promise(r => setTimeout(r, 600));
  }

  // 1. Current state
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'test_current_fridge.png'),
    clip: { x: 50, y: 120, width: 850, height: 480 }
  });

  // 2. Test object-top
  await page.evaluate(() => {
    document.querySelectorAll('div[aria-label="Hero Slider"] img').forEach(img => {
      img.className = "w-full h-full object-cover object-top rounded-lg";
    });
  });
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'test_object_top.png'),
    clip: { x: 50, y: 120, width: 850, height: 480 }
  });

  // 3. Test aspect ratio matching
  await page.evaluate(() => {
    const slider = document.querySelector('div[aria-label="Hero Slider"]');
    if (slider) {
      slider.style.height = 'auto';
      slider.style.aspectRatio = '1024 / 588';
    }
    document.querySelectorAll('div[aria-label="Hero Slider"] img').forEach(img => {
      img.className = "w-full h-full object-contain rounded-lg";
    });
  });
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'test_aspect_ratio.png'),
    clip: { x: 50, y: 120, width: 850, height: 480 }
  });

  await browser.close();
  console.log('Tested!');
})();
