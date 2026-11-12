const puppeteer = require("puppeteer-core");
const path = require("path");

const ARTIFACTS_DIR = "C:\\Users\\DITS-USER\\.gemini\\antigravity\\brain\\116bd0ad-cecc-4623-88e6-f061cd011624";

async function run() {
  console.log("Launching browser via Chrome...");
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log("Navigating to http://localhost:3000...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 2000));

  // 1. Capture Header
  console.log("Capturing Header...");
  const headerElem = await page.$("header");
  if (headerElem) {
    await headerElem.screenshot({
      path: path.join(ARTIFACTS_DIR, "header_updated_nav.png")
    });
    console.log("Saved header_updated_nav.png");
  }

  // 2. Capture Footer (with contact, socials, and Google Map)
  console.log("Capturing Footer...");
  await page.evaluate(() => {
    // Hide sticky header while capturing footer so it doesn't overlap
    const header = document.querySelector("header");
    if (header) header.style.display = "none";
    window.scrollTo(0, document.body.scrollHeight);
  });
  await new Promise(r => setTimeout(r, 1500));

  const footerElem = await page.$("footer");
  if (footerElem) {
    await footerElem.screenshot({
      path: path.join(ARTIFACTS_DIR, "footer_contacts_and_map.png")
    });
    console.log("Saved footer_contacts_and_map.png");
  }

  // Restore header
  await page.evaluate(() => {
    const header = document.querySelector("header");
    if (header) header.style.display = "";
  });

  // 3. Open Chatbot and capture
  console.log("Capturing Chatbot...");
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await new Promise(r => setTimeout(r, 1000));
  const chatBtn = await page.$("button[aria-label='Open Rango Live Chat']");
  if (chatBtn) {
    await chatBtn.click();
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "chatbot_contacts_view.png")
    });
    console.log("Saved chatbot_contacts_view.png");
  }

  // 4. Capture Contact Page (/page/contact-us)
  console.log("Navigating to http://localhost:3000/page/contact-us...");
  await page.goto("http://localhost:3000/page/contact-us", { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, "contact_us_page_verified.png"),
    fullPage: true
  });
  console.log("Saved contact_us_page_verified.png");

  await browser.close();
  console.log("Done all verifications successfully!");
}

run().catch(err => {
  console.error("Error during verification:", err);
  process.exit(1);
});
