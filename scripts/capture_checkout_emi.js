const puppeteer = require("puppeteer-core");
const path = require("path");

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto("http://localhost:3000", { waitUntil: "networkidle2" });
  await page.evaluate(() => {
    const item = {
      product: {
        id: "rango-sample",
        slug: "hisense-43-inch-bezelless-dolby-vision-4k-uhd-smart-led-voice-control-google-dts-tv-43a6f3",
        title: "Hisense 43 Inch Bezelless Dolby Vision 4K UHD Smart TV",
        price: 34900,
        originalPrice: 44900,
        brand: "Hisense",
        warranty: "3 Years Panel Warranty",
        thumbnail: "https://rangoelectronics.com/wp-content/uploads/2025/10/128.webp"
      },
      quantity: 1
    };
    localStorage.setItem("rango_cart", JSON.stringify([item]));
  });

  await page.goto("http://localhost:3000/checkout", { waitUntil: "networkidle2" });
  await page.evaluate(() => {
    const radios = Array.from(document.querySelectorAll("input[type=radio]"));
    const emi = radios.find(r => r.parentElement && r.parentElement.textContent.includes("EMI"));
    if (emi) {
      emi.click();
      emi.scrollIntoView({ block: "center" });
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join("C:/Users/DITS-USER/.gemini/antigravity/brain/116bd0ad-cecc-4623-88e6-f061cd011624", "target_checkout_emi_view.png") });
  await browser.close();
  console.log("Captured checkout EMI view!");
})();
