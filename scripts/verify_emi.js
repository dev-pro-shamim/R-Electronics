const puppeteer = require("puppeteer-core");
const path = require("path");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:/Users/DITS-USER/.gemini/antigravity/brain/116bd0ad-cecc-4623-88e6-f061cd011624";

async function verifyEmi() {
  console.log("Verifying updated EMI...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Product Detail Page EMI Modal
  console.log("1. Opening Product Page...");
  await page.goto("http://localhost:3000/product/hisense-43-inch-bezelless-dolby-vision-4k-uhd-smart-led-voice-control-google-dts-tv-43a6f3", { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 1000));

  // Find and click the EMI View Plans button
  console.log("Opening EMI Modal...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const emiBtn = buttons.find(b => b.textContent && (b.textContent.includes("View Plans") || b.textContent.includes("EMI")));
    if (emiBtn) emiBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Verify banks in modal
  const modalBankInfo = await page.evaluate(() => {
    const select = document.querySelector("select");
    const options = select ? Array.from(select.options).map(o => o.text) : [];
    const hasCityBank = options.some(t => t.toLowerCase().includes("city bank"));
    const hasBracBank = options.some(t => t.toLowerCase().includes("brac bank"));
    return { optionsCount: options.length, hasCityBank, hasBracBank, firstFew: options.slice(0, 5) };
  });

  console.log("Modal Bank Check:", modalBankInfo);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "target_emi_modal_updated.png") });
  console.log("Saved target_emi_modal_updated.png");

  // 2. Checkout Page EMI
  console.log("2. Opening Checkout Page...");
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
  await new Promise(r => setTimeout(r, 1000));

  // Select EMI Radio
  await page.evaluate(() => {
    const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
    const emiRadio = radios.find(r => r.value === "emi" || (r.parentElement && r.parentElement.textContent.includes("EMI")));
    if (emiRadio) emiRadio.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, "target_checkout_emi_updated.png") });
  console.log("Saved target_checkout_emi_updated.png");

  await browser.close();
  console.log("EMI verification finished!");
}

verifyEmi().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
