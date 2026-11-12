const fs = require('fs');
const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new"
  });
  const page = await browser.newPage();
  const files = [
    "public/banners/slider_ac_big_sale.webp",
    "public/banners/slider_smart_tv.webp",
    "public/banners/slider_smart_fridge.webp",
    "public/banners/slider_deep_fridge.webp",
    "public/banners/slider_washing_machine.webp",
    "public/banners/slider_water_purifier.webp",
    "public/banners/slider_geyser.webp"
  ];
  for (const f of files) {
    const fullPath = 'file:///' + require('path').resolve(f).replace(/\\/g, '/');
    await page.goto(fullPath);
    const dims = await page.evaluate(() => {
      const img = document.querySelector('img');
      return img ? { width: img.naturalWidth, height: img.naturalHeight } : null;
    });
    console.log(f, dims, dims ? (dims.width / dims.height).toFixed(3) : '');
  }
  await browser.close();
})();
