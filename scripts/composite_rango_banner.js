const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\DITS-USER\\.gemini\\antigravity\\brain\\116bd0ad-cecc-4623-88e6-f061cd011624';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new"
  });

  // 1. Capture clean mobile preview of Rango Electronics
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 375, height: 750, deviceScaleFactor: 2 });
  await mobilePage.goto("http://localhost:3000", { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  const mobileShotBuffer = await mobilePage.screenshot({
    clip: { x: 0, y: 0, width: 375, height: 700 }
  });
  await mobilePage.close();

  const mobileShotBase64 = 'data:image/png;base64,' + mobileShotBuffer.toString('base64');

  // Read clean 11.11 banner
  const bannerBuf = fs.readFileSync('public/banners/clean-11-11-banner.gif');
  const bannerBase64 = 'data:image/gif;base64,' + bannerBuf.toString('base64');

  // 2. Open canvas page to composite
  const compositePage = await browser.newPage();
  await compositePage.setViewport({ width: 1024, height: 146 });

  await compositePage.setContent(`
    <!DOCTYPE html>
    <html>
      <body style="margin:0; overflow:hidden;">
        <canvas id="canvas" width="1024" height="146"></canvas>
      </body>
    </html>
  `);

  const resultBase64 = await compositePage.evaluate(async (bannerSrc, mobileSrc) => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const loadImg = (src) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = src;
    });

    const [bannerImg, mobileImg] = await Promise.all([loadImg(bannerSrc), loadImg(mobileSrc)]);

    // Draw background banner
    ctx.drawImage(bannerImg, 0, 0, 1024, 146);

    // The phone screen area:
    // Phone display: x = 325, y = 46, width = 35, height = 96
    const phoneX = 325;
    const phoneY = 46;
    const phoneW = 35;
    const phoneH = 96;
    const radius = 3;

    ctx.save();
    // Rounded rect clip for the phone screen
    ctx.beginPath();
    ctx.moveTo(phoneX + radius, phoneY);
    ctx.lineTo(phoneX + phoneW - radius, phoneY);
    ctx.quadraticCurveTo(phoneX + phoneW, phoneY, phoneX + phoneW, phoneY + radius);
    ctx.lineTo(phoneX + phoneW, phoneY + phoneH - radius);
    ctx.quadraticCurveTo(phoneX + phoneW, phoneY + phoneH, phoneX + phoneW - radius, phoneY + phoneH);
    ctx.lineTo(phoneX + radius, phoneY + phoneH);
    ctx.quadraticCurveTo(phoneX, phoneY + phoneH, phoneX, phoneY + phoneH - radius);
    ctx.lineTo(phoneX, phoneY + radius);
    ctx.quadraticCurveTo(phoneX, phoneY, phoneX + radius, phoneY);
    ctx.closePath();
    ctx.clip();

    // Draw mobile screenshot inside the phone screen
    ctx.drawImage(mobileImg, phoneX, phoneY, phoneW, phoneH);

    // Subtle screen glass shine/border overlay
    ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();

    return canvas.toDataURL('image/png');
  }, bannerBase64, mobileShotBase64);

  // Save composite image
  const base64Data = resultBase64.replace(/^data:image\/png;base64,/, "");
  fs.writeFileSync('public/banners/11-11-mega-sale-rango.png', base64Data, 'base64');
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_rango_11_11_banner.png'), base64Data, 'base64');

  console.log('Successfully composited Rango mobile preview into 11.11 banner!');
  await browser.close();
})();
