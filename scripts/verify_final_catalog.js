const puppeteer = require("puppeteer-core");
const path = require("path");

const ARTIFACTS_DIR = "C:\\Users\\DITS-USER\\.gemini\\antigravity\\brain\\116bd0ad-cecc-4623-88e6-f061cd011624";

async function run() {
  console.log("Launching Chrome...");
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Capture Header showing all 9 Rango categories
  console.log("Navigating to http://localhost:3000...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 2000));

  const header = await page.$("header");
  if (header) {
    await header.screenshot({
      path: path.join(ARTIFACTS_DIR, "header_rango_categories.png")
    });
    console.log("Saved header_rango_categories.png");
  }

  // 2. Capture Footer without map
  console.log("Capturing Footer without map...");
  await page.evaluate(() => {
    const hdr = document.querySelector("header");
    if (hdr) hdr.style.display = "none";
    window.scrollTo(0, document.body.scrollHeight);
  });
  await new Promise(r => setTimeout(r, 1500));

  const footer = await page.$("footer");
  if (footer) {
    await footer.screenshot({
      path: path.join(ARTIFACTS_DIR, "footer_without_map.png")
    });
    console.log("Saved footer_without_map.png");
  }

  // 3. Capture Category: Home Appliance
  console.log("Navigating to http://localhost:3000/category/home-appliance...");
  await page.goto("http://localhost:3000/category/home-appliance", { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, "category_home_appliance.png")
  });
  console.log("Saved category_home_appliance.png");

  // 4. Capture Category: Service & Repair
  console.log("Navigating to http://localhost:3000/category/service-repair...");
  await page.goto("http://localhost:3000/category/service-repair", { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, "category_service_repair.png")
  });
  console.log("Saved category_service_repair.png");

  await browser.close();
  console.log("All verifications captured successfully!");
}

run().catch(err => {
  console.error("Verification error:", err);
  process.exit(1);
});
