const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new"
  });
  const page = await browser.newPage();
  const bannerBuf = fs.readFileSync('C:\\Users\\DITS-USER\\.gemini\\antigravity\\brain\\116bd0ad-cecc-4623-88e6-f061cd011624\\.user_uploaded\\media_1794321989190_7889af81.png');
  const base64 = 'data:image/png;base64,' + bannerBuf.toString('base64');

  const phoneBox = await page.evaluate(async (dataUri) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, img.width, img.height).data;

        // Scan for the phone screen
        // Phone screen has dark border / bezel around x=325 to 375, y=30 to 146
        // Let's find columns where pixels have green header (r < 50, g > 80, b > 50)
        let minX = 9999, maxX = -1, minY = 9999, maxY = -1;
        for (let y = 20; y < 140; y++) {
          for (let x = 310; x < 380; x++) {
            const idx = (y * img.width + x) * 4;
            const r = data[idx], g = data[idx+1], b = data[idx+2];
            if (g > 80 && g > r * 1.3 && g > b * 0.8 && r < 60) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        resolve({ minX, maxX, minY, maxY, w: img.width, h: img.height });
      };
      img.src = dataUri;
    });
  }, base64);

  console.log('Phone detection result:', phoneBox);
  await browser.close();
})();
