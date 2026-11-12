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

  // 1. Mobile Home Viewport (Showing Mobile Bottom Navigation Bar)
  console.log('1. Capturing Mobile Home Bottom Nav...');
  await page.setViewport({ width: 375, height: 812 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_home_bottom_nav.png') });

  // 2. Desktop Cart Page
  console.log('2. Capturing Cart Page...');
  await page.setViewport({ width: 1440, height: 900 });
  // Add item to cart via localStorage
  await page.evaluate(() => {
    const item = {
      product: {
        id: "sample-1",
        slug: "hisense-43-inch-bezelless-dolby-vision-4k-uhd-smart-led-voice-control-google-dts-tv-43a6f3",
        title: "Hisense 43 Inch Bezelless Dolby Vision 4K UHD Smart LED Voice Control Google DTS TV 43A6F3",
        price: 34900,
        originalPrice: 44900,
        brand: "Hisense",
        warranty: "(Official) 3 Years Panel, Spare Parts & 4 Years Free Service Warranty.",
        thumbnail: "https://rangoelectronics.com/wp-content/uploads/2025/10/128.webp"
      },
      quantity: 1
    };
    localStorage.setItem("rango_cart", JSON.stringify([item]));
  });
  await page.goto('http://localhost:3000/cart', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'target_cart_page.png') });

  // 3. Desktop Checkout Page
  console.log('3. Capturing Checkout Page...');
  await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'target_checkout_page.png') });

  // 4. Desktop Account Order Page
  console.log('4. Capturing Account Order Page...');
  await page.goto('http://localhost:3000/account/order', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'target_account_order_page.png') });

  // 5. Desktop Product Reviews with Images & Badges
  console.log('5. Capturing Product Reviews...');
  await page.goto('http://localhost:3000/product/hisense-43-inch-bezelless-dolby-vision-4k-uhd-smart-led-voice-control-google-dts-tv-43a6f3', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  // Click on Reviews tab
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const revBtn = buttons.find(b => b.textContent && b.textContent.includes('Reviews'));
    if (revBtn) revBtn.click();
    window.scrollBy(0, 950);
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'target_product_reviews_images.png') });

  await browser.close();
  console.log('All screenshots captured and saved to artifact directory!');
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
