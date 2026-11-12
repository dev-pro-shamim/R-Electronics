const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:/Users/DITS-USER/.gemini/antigravity/brain/116bd0ad-cecc-4623-88e6-f061cd011624';

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Capturing Target Home Desktop...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'screenshots/target_home_desktop.png', fullPage: false });
  fs.copyFileSync('screenshots/target_home_desktop.png', path.join(ARTIFACT_DIR, 'target_home_desktop.png'));

  console.log('Capturing Target Product Desktop (TV)...');
  await page.goto('http://localhost:3000/product/hisense-43-inch-bezelless-dolby-vision-4k-uhd-smart-led-voice-control-google-dts-tv-43a6f3', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'screenshots/target_product_desktop.png', fullPage: false });
  fs.copyFileSync('screenshots/target_product_desktop.png', path.join(ARTIFACT_DIR, 'target_product_desktop.png'));

  console.log('Capturing Target Home Mobile...');
  await page.setViewport({ width: 375, height: 812 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'screenshots/target_home_mobile.png', fullPage: false });
  fs.copyFileSync('screenshots/target_home_mobile.png', path.join(ARTIFACT_DIR, 'target_home_mobile.png'));

  await browser.close();
  console.log('All screenshots captured and saved successfully!');
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
