const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new"
  });
  const page = await browser.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });
  page.on('pageerror', err => console.log('PAGE ERROR:', err.stack));
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));
  const text = await page.evaluate(() => document.body.innerText.slice(0, 500));
  console.log('BODY TEXT:', text);
  await browser.close();
})();
