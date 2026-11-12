const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function checkTargetStyles() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });

  const styles = await page.evaluate(() => {
    const getElStyles = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const cs = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        className: el.className,
        bg: cs.backgroundColor,
        color: cs.color,
        fontSize: cs.fontSize,
        fontFamily: cs.fontFamily,
        height: cs.height,
        width: cs.width,
        padding: cs.padding,
      };
    };

    return {
      header: getElStyles('header'),
      headerTop: getElStyles('header > div'),
      nav: getElStyles('header > nav'),
      card: getElStyles('article'),
      price: getElStyles('article span.text-primary'),
      searchInput: getElStyles('input#search-desktop'),
      searchBtn: getElStyles('form button[type="submit"]'),
    };
  });

  console.log('Target Computed Styles:');
  console.log(JSON.stringify(styles, null, 2));

  await browser.close();
}

checkTargetStyles().catch(console.error);
