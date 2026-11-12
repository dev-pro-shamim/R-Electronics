const puppeteer = require('puppeteer-core');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\DITS-USER\\.gemini\\antigravity\\brain\\116bd0ad-cecc-4623-88e6-f061cd011624';

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new"
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  // Slide 1 screenshot
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'preview_rango_new_hero_slider_1.png'),
    clip: { x: 0, y: 0, width: 1400, height: 680 }
  });
  console.log('Captured slide 1');

  // Click next arrow on slider to show slide 2
  const nextBtn = await page.$('button[aria-label="Next Slide"]');
  if (nextBtn) {
    await nextBtn.click();
    await new Promise(r => setTimeout(r, 700));
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'preview_rango_new_hero_slider_2.png'),
      clip: { x: 0, y: 0, width: 1400, height: 680 }
    });
    console.log('Captured slide 2');

    await nextBtn.click();
    await new Promise(r => setTimeout(r, 700));
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'preview_rango_new_hero_slider_3.png'),
      clip: { x: 0, y: 0, width: 1400, height: 680 }
    });
    console.log('Captured slide 3');
  }

  await browser.close();
  console.log('Done captures!');
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
