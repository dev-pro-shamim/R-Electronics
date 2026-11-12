const puppeteer = require('puppeteer-core');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/DITS-USER/.gemini/antigravity/brain/116bd0ad-cecc-4623-88e6-f061cd011624';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new"
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => pageErrors.push(err.message));

  // 1. Verify unauthenticated store API is protected via Node fetch (no browser console noise)
  const unauthRes = await fetch('http://localhost:3000/api/admin/store');
  const apiUnauthStatus = unauthRes.status;

  // Visit /admin -> Login Screen
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 500));

  const loginVisible = await page.evaluate(() =>
    document.body.innerText.includes('Sign In to Admin Panel')
  );

  // Screenshot login page
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_admin_login.png') });

  // 2. Log in with admin credentials
  const passInput = await page.$('input[type="password"]');
  await passInput.type('Rango@2026');
  await page.click('#admin-login-submit');
  await new Promise(r => setTimeout(r, 1500));

  const dashboardLoaded = await page.evaluate(() =>
    document.body.innerText.includes('Rango Electronics Admin Control') &&
    document.body.innerText.includes('Overview & Analytics')
  );

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_admin_overview.png') });

  // 3. Test all 11 tabs for errors & horizontal overflow at Desktop (1400) & Mobile (375)
  const tabs = [
    'Overview & Analytics',
    'Orders & Fulfillment',
    'Product Catalog',
    'Inventory Control',
    'Categories & Brands',
    'Coupons & Offers',
    'Banners & Sliders',
    'Customers',
    'Reviews & Q&A',
    'EMI & Gateways',
    'CMS & Settings'
  ];

  const tabResults = [];
  for (const label of tabs) {
    await page.setViewport({ width: 1400, height: 900 });
    await page.evaluate((tabLabel) => {
      const btn = Array.from(document.querySelectorAll('aside button')).find(b =>
        b.innerText.includes(tabLabel)
      );
      if (btn) btn.click();
    }, label);
    await new Promise(r => setTimeout(r, 350));

    const desktopOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );

    if (label === 'Orders & Fulfillment') {
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_admin_orders.png') });
    }
    if (label === 'Product Catalog') {
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_admin_products.png') });
    }

    await page.setViewport({ width: 375, height: 812 });
    await new Promise(r => setTimeout(r, 250));
    const mobileOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );

    tabResults.push({ label, desktopOverflow, mobileOverflow });
  }

  // 4. Test reloading /admin preserves authenticated session cookie
  await page.setViewport({ width: 1400, height: 900 });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));
  const persistedSession = await page.evaluate(() =>
    document.body.innerText.includes('Rango Electronics Admin Control') &&
    !document.body.innerText.includes('Sign In to Admin Panel')
  );

  await browser.close();

  console.log('ADMIN E2E VERIFICATION:', JSON.stringify({
    apiUnauthStatus,
    loginVisible,
    dashboardLoaded,
    persistedSession,
    consoleErrorsCount: consoleErrors.length,
    consoleErrors,
    pageErrorsCount: pageErrors.length,
    pageErrors,
    overflowTabs: tabResults.filter(t => t.desktopOverflow || t.mobileOverflow),
    tabsChecked: tabResults.length
  }, null, 2));
})();
