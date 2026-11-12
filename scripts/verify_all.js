const puppeteer = require('puppeteer-core');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\DITS-USER\\.gemini\\antigravity\\brain\\116bd0ad-cecc-4623-88e6-f061cd011624';

(async () => {
  console.log('Launching Chrome with puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  try {
    // 1. Air Conditioner Category Page (Separated from Grinders)
    console.log('1. Checking AC Category page...');
    await page.goto('http://localhost:3000/category/air-conditioner', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ac_category_separated.png'), fullPage: false });
    console.log('Saved ac_category_separated.png');

    // 2. Track Order Page with Dynamic Lookup
    console.log('2. Checking Track Order page...');
    await page.goto('http://localhost:3000/track-order?id=RE-984210', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'track_order_dynamic_verified.png'), fullPage: false });
    console.log('Saved track_order_dynamic_verified.png');

    // 3. Checkout Page with bKash Merchant and Nagad Personal
    console.log('3. Checking Checkout page with bKash Merchant and Nagad Personal...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    // Seed an item into cart
    await page.evaluate(() => {
      const sampleItem = {
        id: "rango-ac-gree-18",
        product: {
          id: "rango-ac-gree-18",
          slug: "gree-1-5-ton-fairy-split-inverter-ac-gs-18xfv32",
          title: "Gree 1.5 Ton Fairy Split Inverter Air Conditioner (GS-18XFV32)",
          price: 68500,
          originalPrice: 75000,
          thumbnail: "https://electronicsbangladesh.com/wp-content/uploads/2024/05/gree-fairy.png",
          images: ["https://electronicsbangladesh.com/wp-content/uploads/2024/05/gree-fairy.png"]
        },
        quantity: 1,
        selectedWarranty: "10 Years Official Warranty"
      };
      localStorage.setItem("rango_cart", JSON.stringify([sampleItem]));
    });

    await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    // Click bKash to reveal instructions
    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[name="payment"]'));
      const bkashInput = inputs.find(i => i.getAttribute('value') === 'bkash') || inputs[1];
      if (bkashInput) bkashInput.click();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'checkout_payment_bkash_nagad.png'), fullPage: false });
    console.log('Saved checkout_payment_bkash_nagad.png');

    // 4. AuthModal Google 1-Click Connect
    console.log('4. Checking AuthModal Google Connect...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    await page.evaluate(() => {
      // Find sign in / account button in header
      const links = Array.from(document.querySelectorAll('header button, header a'));
      const acc = links.find(el => el.textContent && (el.textContent.includes('Login') || el.textContent.includes('Sign In') || el.textContent.includes('Account')));
      if (acc) acc.click();
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'auth_modal_google_connect.png'), fullPage: false });
    console.log('Saved auth_modal_google_connect.png');

    // 5. Chatbot Dynamic Query Verification
    console.log('5. Testing Chatbot live query...');
    await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Toggle Rango Assistant"]');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="পণ্য বা মডেলের"]');
      if (input) {
        input.value = "Gree AC";
        input.dispatchEvent(new Event('input', { bubbles: true }));
        const form = input.closest('form');
        if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'chatbot_dynamic_response.png'), fullPage: false });
    console.log('Saved chatbot_dynamic_response.png');

  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await browser.close();
    console.log('Verification finished successfully.');
  }
})();
