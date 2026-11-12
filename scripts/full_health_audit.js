const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ROUTES = [
  '/',
  '/category/television',
  '/category/air-conditioner',
  '/category/refrigerator',
  '/category/washing-machine',
  '/category/microwave-oven',
  '/category/water-purifiers',
  '/category/geyser-water-heaters',
  '/category/home-appliance',
  '/category/all',
  '/product/panasonic-mixer-grinder-mxge3750-black',
  '/compare',
  '/cart',
  '/checkout',
  '/offer',
  '/track-order',
  '/invoice/RE-104921',
  '/account',
  '/account/order',
  '/account/wishlist',
  '/admin',
  '/our-contacts',
  '/page/about-us',
  '/page/warranty-policy'
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new"
  });

  const report = {
    routesChecked: [],
    totalErrors: 0,
    totalBrokenImages: 0,
    overflowIssues: [],
    interactiveChecks: {}
  };

  for (const route of ROUTES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', err => {
      pageErrors.push(err.message);
    });
    page.on('requestfailed', req => {
      failedRequests.push({ url: req.url(), error: req.failure()?.errorText });
    });

    let status = 0;
    try {
      const response = await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle2', timeout: 20000 });
      status = response ? response.status() : 0;
      await new Promise(r => setTimeout(r, 600));

      // Check broken images
      const brokenImages = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs
          .filter(img => {
            // Skip tracking pixels or empty src if intentionally handled
            if (!img.src) return true;
            return img.complete && img.naturalWidth === 0;
          })
          .map(img => ({ alt: img.alt, src: img.src }));
      });

      // Check horizontal overflow on desktop
      const desktopOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      // Check horizontal overflow on mobile (375px)
      await page.setViewport({ width: 375, height: 812 });
      await new Promise(r => setTimeout(r, 200));
      const mobileOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      const entry = {
        route,
        status,
        consoleErrors,
        pageErrors,
        failedRequests,
        brokenImages,
        desktopOverflow,
        mobileOverflow
      };

      report.routesChecked.push(entry);
      report.totalErrors += consoleErrors.length + pageErrors.length;
      report.totalBrokenImages += brokenImages.length;
      if (desktopOverflow || mobileOverflow) {
        report.overflowIssues.push({ route, desktopOverflow, mobileOverflow });
      }
    } catch (err) {
      report.routesChecked.push({ route, status: 'TIMEOUT_OR_FAIL', error: err.message });
      report.totalErrors++;
    }
    await page.close();
  }

  // Interactive Flows Check
  const flowPage = await browser.newPage();
  await flowPage.setViewport({ width: 1400, height: 900 });
  await flowPage.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  // 1. Test Search Autocomplete
  const searchInput = await flowPage.$('input[placeholder*="Search"]');
  if (searchInput) {
    await searchInput.type('Samsung');
    await new Promise(r => setTimeout(r, 400));
    const hasDropdown = await flowPage.evaluate(() => {
      return document.body.innerText.includes('Crystal') || document.body.innerText.includes('Samsung');
    });
    report.interactiveChecks.searchAutocomplete = hasDropdown;
  }

  // 2. Test Add to Cart -> Toast -> Cart Drawer
  const cartAddBtn = await flowPage.$('button[aria-label="Add to cart"]');
  if (cartAddBtn) {
    await cartAddBtn.click();
    await new Promise(r => setTimeout(r, 400));
    await flowPage.evaluate(() => {
      const viewCartBtn = document.querySelector('button[aria-label="View Cart"]');
      if (viewCartBtn) viewCartBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));
    const drawerOpen = await flowPage.evaluate(() => {
      return document.body.innerText.includes('Shopping Cart (1)') || document.body.innerText.includes('Proceed to Checkout');
    });
    report.interactiveChecks.addToCartDrawer = drawerOpen;
    // Close drawer via backdrop or close button
    await flowPage.keyboard.press('Escape').catch(() => {});
    await flowPage.evaluate(() => {
      const closeBtn = Array.from(document.querySelectorAll('div.fixed button')).find(b => b.querySelector('svg.lucide-x'));
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 300));
  }

  // 3. Test Add to Compare -> Badge update
  const compareBtn = await flowPage.$('button[aria-label="Add to compare"]');
  if (compareBtn) {
    await compareBtn.click();
    await new Promise(r => setTimeout(r, 300));
    const inCompareText = await flowPage.evaluate(() => {
      return document.body.innerText.includes('Added') || document.querySelector('a[href="/compare"]')?.textContent?.includes('1');
    });
    report.interactiveChecks.addToCompare = inCompareText;
  }

  // 4. Test Auth Modal
  await flowPage.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('header button')).find(b => b.getAttribute('aria-label')?.includes('Account') || b.innerHTML.includes('M12 12'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 400));
  const authModalOpen = await flowPage.evaluate(() => {
    return document.body.innerText.includes('Welcome to') && document.body.innerText.includes('Rango Electronics');
  });
  report.interactiveChecks.authModal = authModalOpen;

  // 5. Test Chatbot
  await flowPage.evaluate(() => {
    const botBtn = document.querySelector('button[aria-label="Toggle Rango Assistant"]');
    if (botBtn) botBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));
  const chatbotOpen = await flowPage.evaluate(() => {
    return document.body.innerText.includes('Rango Assistant');
  });
  report.interactiveChecks.chatbot = chatbotOpen;

  await flowPage.close();
  await browser.close();

  const totalFailedRequests = report.routesChecked.reduce((sum, r) => sum + (r.failedRequests ? r.failedRequests.length : 0), 0);
  report.totalFailedRequests = totalFailedRequests;

  fs.writeFileSync('scripts/audit_report.json', JSON.stringify(report, null, 2));
  console.log('Full Health Audit Finished!');
  console.log('Summary:', {
    routesTotal: report.routesChecked.length,
    non200Routes: report.routesChecked.filter(r => r.status !== 200).map(r => ({ route: r.route, status: r.status })),
    totalErrors: report.totalErrors,
    totalFailedRequests,
    totalBrokenImages: report.totalBrokenImages,
    overflowIssuesCount: report.overflowIssues.length,
    interactiveChecks: report.interactiveChecks
  });
})();
