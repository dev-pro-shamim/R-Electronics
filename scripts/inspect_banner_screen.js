const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new"
  });
  const page = await browser.newPage();
  const imgPath = 'file:///' + path.resolve('C:/Users/DITS-USER/.gemini/antigravity/brain/116bd0ad-cecc-4623-88e6-f061cd011624/.user_uploaded/media_1794321989190_7889af81.png').replace(/\\/g, '/');
  await page.goto(imgPath);
  const dims = await page.evaluate(() => {
    const img = document.querySelector('img');
    return { w: img.naturalWidth, h: img.naturalHeight };
  });
  console.log('Banner dims:', dims);
  await browser.close();
})();
