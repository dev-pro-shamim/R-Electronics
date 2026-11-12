const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function capture() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to reference homepage: https://electronicsbangladesh.com/ ...');
  try {
    await page.goto('https://electronicsbangladesh.com/', { waitUntil: 'networkidle2', timeout: 45000 });
  } catch (e) {
    console.log('Navigation warning:', e.message);
  }

  // Take reference homepage screenshot
  console.log('Capturing ref_home_desktop.png...');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'ref_home_desktop.png'), fullPage: false });

  // Get exact computed styles of Header, Nav, and Product Card
  const styles = await page.evaluate(() => {
    const header = document.querySelector('header');
    const headerTop = document.querySelector('header > div:first-child');
    const nav = document.querySelector('header nav');
    const card = document.querySelector('section a[href*="/product/"]')?.closest('div') || document.querySelector('[class*="group"]');
    const price = document.querySelector('[class*="text-primary"]');
    const searchInput = document.querySelector('header input[type="text"]');
    const searchBtn = document.querySelector('header button[type="submit"]') || document.querySelector('header form button');

    function getStyle(el) {
      if (!el) return null;
      const c = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        className: el.className,
        bg: c.backgroundColor,
        color: c.color,
        fontSize: c.fontSize,
        fontWeight: c.fontWeight,
        fontFamily: c.fontFamily,
        height: c.height,
        width: c.width,
        padding: c.padding,
        margin: c.margin,
        borderRadius: c.borderRadius,
        border: c.border,
        boxShadow: c.boxShadow
      };
    }

    return {
      header: getStyle(header),
      headerTop: getStyle(headerTop),
      nav: getStyle(nav),
      card: getStyle(card),
      price: getStyle(price),
      searchInput: getStyle(searchInput),
      searchBtn: getStyle(searchBtn)
    };
  });

  console.log('--- EXACT REFERENCE COMPUTED STYLES ---');
  console.log(JSON.stringify(styles, null, 2));
  fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'ref_styles.json'), JSON.stringify(styles, null, 2));

  // Capture Reference Category Page
  console.log('Navigating to reference category page...');
  try {
    await page.goto('https://electronicsbangladesh.com/category/television', { waitUntil: 'networkidle2', timeout: 45000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'ref_category_desktop.png'), fullPage: false });
  } catch (e) {
    console.log('Category error:', e.message);
  }

  // Capture Reference Product Page
  console.log('Navigating to reference product page...');
  try {
    await page.goto('https://electronicsbangladesh.com/product/samsung-43-inch-crystal-uhd-4k-smart-tv-43u8510h', { waitUntil: 'networkidle2', timeout: 45000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'ref_product_desktop.png'), fullPage: false });
  } catch (e) {
    console.log('Product error:', e.message);
  }

  // Capture Reference Cart Page
  console.log('Navigating to reference cart page...');
  try {
    await page.goto('https://electronicsbangladesh.com/cart', { waitUntil: 'networkidle2', timeout: 45000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'ref_cart_desktop.png'), fullPage: false });
  } catch (e) {
    console.log('Cart error:', e.message);
  }

  await browser.close();
  console.log('Reference capture complete!');
}

capture().catch(console.error);
