const puppeteer = require('puppeteer-core');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\DITS-USER\\.gemini\\antigravity\\brain\\116bd0ad-cecc-4623-88e6-f061cd011624';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new"
  });

  const viewports = [
    { w: 1280, h: 800, name: '1280' },
    { w: 1440, h: 900, name: '1440' },
    { w: 1920, h: 1080, name: '1920' },
    { w: 390, h: 844, name: 'mobile' }
  ];

  for (const vp of viewports) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.w, height: vp.h });
    await page.goto("http://localhost:3000", { waitUntil: 'networkidle2' });

    // Test with object-fill
    await page.evaluate(() => {
      document.querySelectorAll('div[aria-label="Hero Slider"] img').forEach(img => {
        img.className = "w-full h-full object-fill rounded-lg";
      });
      // Pause slider
      const highestTimeoutId = setTimeout(() => {});
      for (let i = 0; i < highestTimeoutId; i++) clearTimeout(i);
    });

    // Go to slide 3 (Smart Fridge)
    const dots = await page.$$('button[aria-label^="Go to slide"]');
    if (dots.length >= 3) {
      await dots[2].click();
      await new Promise(r => setTimeout(r, 600));
    }

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `test_fill_fridge_${vp.name}.png`),
      clip: vp.name === 'mobile' 
        ? { x: 0, y: 100, width: vp.w, height: 260 }
        : { x: 0, y: 120, width: vp.w, height: 480 }
    });

    // Also test with object-cover object-top
    await page.evaluate(() => {
      document.querySelectorAll('div[aria-label="Hero Slider"] img').forEach(img => {
        img.className = "w-full h-full object-cover object-top rounded-lg";
      });
    });
    await new Promise(r => setTimeout(r, 200));

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `test_objtop_fridge_${vp.name}.png`),
      clip: vp.name === 'mobile' 
        ? { x: 0, y: 100, width: vp.w, height: 260 }
        : { x: 0, y: 120, width: vp.w, height: 480 }
    });

    await page.close();
  }

  await browser.close();
  console.log('Done multi-viewport test!');
})();
