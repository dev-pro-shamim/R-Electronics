const puppeteer = require("puppeteer-core");
const path = require("path");

const ARTIFACT_DIR =
  "C:/Users/DITS-USER/.gemini/antigravity/brain/116bd0ad-cecc-4623-88e6-f061cd011624";
const BASE_URL = "http://localhost:3000";

const GROUP_AND_ITEM_TESTS = [
  { group: "OVERVIEW", label: "Dashboard Overview" },
  { group: "SALES & FULFILLMENT", label: "Orders" },
  { group: "SALES & FULFILLMENT", label: "Payments" },
  { group: "SALES & FULFILLMENT", label: "Invoices" },
  { group: "SALES & FULFILLMENT", label: "Courier Management" },
  { group: "SALES & FULFILLMENT", label: "Order Tracking" },
  { group: "CATALOG", label: "All Products" },
  { group: "CATALOG", label: "Add New Product" },
  { group: "CATALOG", label: "Categories" },
  { group: "CATALOG", label: "Brands" },
  { group: "CATALOG", label: "Reviews" },
  { group: "CATALOG", label: "Q&A" },
  { group: "INVENTORY", label: "Stock Overview" },
  { group: "INVENTORY", label: "Stock Adjustment" },
  { group: "INVENTORY", label: "Stock History" },
  { group: "INVENTORY", label: "Low Stock Alerts" },
  { group: "MARKETING & TRACKING", label: "Coupons" },
  { group: "MARKETING & TRACKING", label: "Offers & Campaigns" },
  { group: "MARKETING & TRACKING", label: "Banners & Sliders" },
  { group: "MARKETING & TRACKING", label: "Popups" },
  { group: "MARKETING & TRACKING", label: "Meta Pixel & CAPI" },
  { group: "MARKETING & TRACKING", label: "Google Tag Manager" },
  { group: "CUSTOMERS & SUPPORT", label: "Customers" },
  { group: "CUSTOMERS & SUPPORT", label: "Contact Inquiries" },
  { group: "CUSTOMERS & SUPPORT", label: "Chatbot Inbox" },
  { group: "CUSTOMERS & SUPPORT", label: "FAQs & Knowledge" },
  { group: "FINANCE & ACCOUNTS", label: "Accounts Overview" },
  { group: "FINANCE & ACCOUNTS", label: "Income Management" },
  { group: "FINANCE & ACCOUNTS", label: "Expense Management" },
  { group: "FINANCE & ACCOUNTS", label: "Debit & Credit" },
  { group: "FINANCE & ACCOUNTS", label: "Account Ledger" },
  { group: "FINANCE & ACCOUNTS", label: "Account Transfers" },
  { group: "FINANCE & ACCOUNTS", label: "Financial Reports" },
  { group: "WEBSITE MANAGEMENT", label: "Pages (CMS)" },
  { group: "WEBSITE MANAGEMENT", label: "Homepage Sections" },
  { group: "WEBSITE MANAGEMENT", label: "EMI Settings" },
  { group: "WEBSITE MANAGEMENT", label: "Delivery & Courier Fee" },
  { group: "WEBSITE MANAGEMENT", label: "Payment Gateways" },
  { group: "SYSTEM & SECURITY", label: "Global Settings" },
  { group: "SYSTEM & SECURITY", label: "Admin Users" },
  { group: "SYSTEM & SECURITY", label: "Roles & Permissions" },
  { group: "SYSTEM & SECURITY", label: "Activity Logs" },
  { group: "SYSTEM & SECURITY", label: "Database & SQL Sync" },
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("requestfailed", (req) => {
    failedRequests.push(`${req.method()} ${req.url()}: ${req.failure()?.errorText || "failed"}`);
  });

  const report = {
    authApiCheck: {},
    loginPage: {},
    overviewChecks: {},
    tabs: [],
    functionalTests: {},
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
  };

  try {
    // 1. Check unauthenticated API behavior
    const authUnauth = await fetch(`${BASE_URL}/api/admin/auth`);
    const authUnauthJson = await authUnauth.json();
    const storeUnauth = await fetch(`${BASE_URL}/api/admin/store`);
    report.authApiCheck = {
      authGetStatus: authUnauth.status,
      authAuthenticated: authUnauthJson.authenticated,
      storeUnauthStatus: storeUnauth.status,
    };

    // 2. Load /admin at Desktop and check storefront isolation
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 500));

    report.loginPage = await page.evaluate(() => ({
      hasLoginForm: Boolean(document.querySelector("#admin-login-submit")),
      storefrontHeaderHidden: !document.querySelector("header nav"),
      hasEmailInput: Boolean(document.querySelector('input[type="email"]')),
      hasPasswordInput: Boolean(document.querySelector('input[type="password"]')),
    }));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "verify_ent_login.png") });

    // 3. Log in with seeded Super Admin credentials
    const passInput = await page.$('input[type="password"]');
    await passInput.type("Rango@2026");
    await page.click("#admin-login-submit");
    await new Promise((r) => setTimeout(r, 1800));

    report.overviewChecks = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return {
        hasWelcomeHero: text.includes("welcome to rango electronics"),
        hasKpiCards:
          text.includes("today's sales") &&
          text.includes("total revenue") &&
          text.includes("net profit") &&
          text.includes("low stock items"),
        hasAnalyticsSection:
          text.includes("sales") ||
          text.includes("payment method") ||
          text.includes("top selling products"),
        hasRecentActivities: text.includes("recent orders"),
      };
    });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "verify_ent_overview.png") });

    // 4. Test all 42 sidebar modules across Desktop (1440px) and Mobile (375px)
    const expandAllGroups = async () => {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("aside nav button"));
        for (const btn of btns) {
          const txt = btn.innerText.trim().toUpperCase();
          if (
            [
              "INVENTORY",
              "MARKETING & TRACKING",
              "WEBSITE MANAGEMENT",
              "SYSTEM & SECURITY",
            ].includes(txt)
          ) {
            btn.click();
          }
        }
      });
    };
    await expandAllGroups();
    await new Promise((r) => setTimeout(r, 300));

    for (const item of GROUP_AND_ITEM_TESTS) {
      await page.setViewport({ width: 1440, height: 900 });
      const clicked = await page.evaluate((targetLabel) => {
        const navBtns = Array.from(document.querySelectorAll("aside nav button"));
        const match = navBtns.find((b) => {
          const span = b.querySelector("span.truncate");
          return span && span.innerText.trim() === targetLabel;
        });
        if (match) {
          match.click();
          return true;
        }
        return false;
      }, item.label);

      await new Promise((r) => setTimeout(r, 250));
      const desktopOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
      );

      if (item.label === "Orders") {
        await page.screenshot({ path: path.join(ARTIFACT_DIR, "verify_ent_orders.png") });
      }
      if (item.label === "All Products") {
        await new Promise((r) => setTimeout(r, 900));
        await page.screenshot({ path: path.join(ARTIFACT_DIR, "verify_ent_products.png") });
      }
      if (item.label === "Accounts Overview") {
        await page.screenshot({ path: path.join(ARTIFACT_DIR, "verify_ent_accounts.png") });
      }

      await page.setViewport({ width: 375, height: 812 });
      await new Promise((r) => setTimeout(r, 150));
      const mobileOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
      );

      if (item.label === "Accounts Overview") {
        await page.screenshot({ path: path.join(ARTIFACT_DIR, "verify_ent_mobile.png") });
      }

      report.tabs.push({
        label: item.label,
        clicked,
        desktopOverflow,
        mobileOverflow,
      });
    }

    await page.setViewport({ width: 1440, height: 900 });

    // 5. Functional E2E tests (Coupons, Accounting transfer, Payment Verify Idempotency, Contact Inquiry sync)
    // 5a. Ensure fake/non-DB coupon is rejected & seeded DB coupon works; create temp coupon -> validate -> remove
    const fakeCouponRes = await page.evaluate(async () => {
      const r = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "FAKEHARDCODED999", subtotal: 50000 }),
      });
      return await r.json();
    });

    // Create temporary coupon TESTENT15 via Admin store PATCH, validate it, then remove it
    const couponLifecycle = await page.evaluate(async () => {
      const sRes = await fetch("/api/admin/store");
      const sData = await sRes.json();
      const origCoupons = sData.coupons || [];
      const testCoupon = {
        id: "cpn-test-ent",
        code: "TESTENT15",
        name: "Temp Verify Coupon",
        description: "E2E automated verification coupon",
        type: "percent",
        value: 15,
        minOrder: 10000,
        maxDiscount: 5000,
        usageLimit: 10,
        usageCount: 0,
        perCustomerLimit: 2,
        startDate: "2026-01-01",
        expiryDate: "2028-12-31",
        applicableCategories: [],
        applicableProducts: [],
        active: true,
        usageByCustomer: {},
      };
      await fetch("/api/admin/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "Coupons",
          permissionKey: "coupons",
          actionDescription: "E2E test coupon added",
          patch: { coupons: [...origCoupons, testCoupon] },
        }),
      });
      const valRes = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "TESTENT15", subtotal: 30000 }),
      });
      const valData = await valRes.json();

      // Restore original coupons cleanly
      await fetch("/api/admin/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "Coupons",
          permissionKey: "coupons",
          actionDescription: "E2E test coupon cleaned up",
          patch: { coupons: origCoupons },
        }),
      });
      return { valid: valData.valid, discountAmount: valData.discountAmount };
    });

    // 5b. Balanced Inter-Account Transfer test (+100 Cash->Bank, then -100 Bank->Cash to keep net clean)
    const transferTest = await page.evaluate(async () => {
      const beforeRes = await fetch("/api/admin/store");
      const beforeData = await beforeRes.json();
      const origTx = beforeData.financialTransactions || [];
      const origAcc = beforeData.accounts || [];
      const totalBefore = origAcc.reduce((s, a) => s + Number(a.currentBalance || 0), 0);

      const t1 = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "record_transfer",
          fromAccountId: "acc-cash",
          toAccountId: "acc-bank",
          amount: 100,
          note: "E2E verification transfer",
        }),
      });
      const t1Json = await t1.json();
      const midAccs = t1Json.accounts || [];
      const totalMid = midAccs.reduce((s, a) => s + Number(a.currentBalance || 0), 0);
      const cashDeltaMid =
        Number(midAccs.find((a) => a.id === "acc-cash")?.currentBalance || 0) -
        Number(origAcc.find((a) => a.id === "acc-cash")?.currentBalance || 0);
      const bankDeltaMid =
        Number(midAccs.find((a) => a.id === "acc-bank")?.currentBalance || 0) -
        Number(origAcc.find((a) => a.id === "acc-bank")?.currentBalance || 0);

      // Reverse transfer so seeded data remains pristine
      const t2 = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "record_transfer",
          fromAccountId: "acc-bank",
          toAccountId: "acc-cash",
          amount: 100,
          note: "E2E verification reversal",
        }),
      });
      const t2Json = await t2.json();
      const totalAfter = (t2Json.accounts || []).reduce(
        (s, a) => s + Number(a.currentBalance || 0),
        0
      );

      // Clean up temporary transfer ledger entries
      await fetch("/api/admin/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "Accounts",
          permissionKey: "acc-transfers",
          actionDescription: "Cleaned up synthetic E2E transfer rows",
          patch: { financialTransactions: origTx, accounts: origAcc },
        }),
      });

      return {
        ok: t1.ok && t2.ok,
        cashDeltaMid,
        bankDeltaMid,
        totalBefore,
        totalMid,
        totalAfter,
        balanced:
          cashDeltaMid === -100 &&
          bankDeltaMid === 100 &&
          totalBefore === totalMid &&
          totalBefore === totalAfter,
      };
    });

    // 5c. Submit Contact Us Inquiry on /page/contact-us & verify it appears in Admin DB, then clean up
    await page.goto(`${BASE_URL}/page/contact-us`, { waitUntil: "networkidle2" });
    await page.waitForSelector('input[placeholder*="Name"], input[name="name"], form input', {
      timeout: 5000,
    });
    const inquirySubmit = await page.evaluate(async () => {
      const r = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "E2E Verification Guest",
          phone: "01711000000",
          email: "verify@rangoelectronics.com",
          subject: "Enterprise E2E Test Inquiry",
          message: "Automated verification check for Contact Inquiries persistence.",
        }),
      });
      return { status: r.status, data: await r.json() };
    });

    const inquiryCleanup = await page.evaluate(async (createdId) => {
      if (!createdId) return { foundInAdmin: false };
      const storeRes = await fetch("/api/admin/store");
      const storeJson = await storeRes.json();
      const found = (storeJson.contactInquiries || []).some((i) => i.id === createdId);
      const delRes = await fetch(`/api/inquiries?id=${encodeURIComponent(createdId)}`, {
        method: "DELETE",
      });
      return { foundInAdmin: found, cleanedUp: delRes.ok };
    }, inquirySubmit.data?.inquiryId);

    // 5d. Verify Payment Idempotency (calling verify_payment twice yields only 1 accounting transaction)
    const paymentIdempotency = await page.evaluate(async () => {
      const beforeRes = await fetch("/api/admin/store");
      const beforeDb = await beforeRes.json();
      const testOrderId = `RE-E2E-PAY-${Date.now()}`;
      const syntheticOrder = {
        id: testOrderId,
        date: "2026-11-11",
        total: 5000,
        subtotal: 5000,
        deliveryCharge: 0,
        status: "Pending",
        paymentStatus: "Pending Verification",
        paymentMethod: "bKash",
        bkashTrxId: "TRX-E2E-999",
        items: [],
        shippingAddress: {
          fullName: "E2E Verify User",
          phone: "01700000000",
          address: "Dhaka",
          area: "Inside Dhaka",
        },
      };
      const r1 = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_payment",
          order: syntheticOrder,
          paymentStatus: "Paid",
          gatewayReference: "GW-E2E-999",
          notes: "E2E first verification",
        }),
      });
      const j1 = await r1.json();
      const countAfterFirst = (j1.financialTransactions || []).filter(
        (t) => t.orderId === testOrderId || t.referenceNo === testOrderId
      ).length;

      const r2 = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_payment",
          order: syntheticOrder,
          paymentStatus: "Paid",
          gatewayReference: "GW-E2E-999",
          notes: "E2E duplicate verification",
        }),
      });
      const j2 = await r2.json();
      const countAfterSecond = (j2.financialTransactions || []).filter(
        (t) => t.orderId === testOrderId || t.referenceNo === testOrderId
      ).length;

      // Verify /api/orders/lookup reflects the verified payment & auto-invoice live
      const lookupRes = await fetch(`/api/orders/lookup?orderId=${encodeURIComponent(testOrderId)}`);
      const lookupJson = await lookupRes.json();

      // Clean up synthetic test artifacts
      await fetch("/api/admin/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "Payments",
          permissionKey: "payments",
          actionDescription: "Cleaned up synthetic E2E payment test",
          patch: {
            orderOverrides: beforeDb.orderOverrides,
            payments: beforeDb.payments,
            invoices: beforeDb.invoices,
            financialTransactions: beforeDb.financialTransactions,
            accounts: beforeDb.accounts,
          },
        }),
      });

      return {
        ok: r1.ok && r2.ok,
        countAfterFirst,
        countAfterSecond,
        idempotent: countAfterFirst === 1 && countAfterSecond === 1,
        lookupStatus: lookupJson.override?.paymentStatus || null,
      };
    });

    report.functionalTests = {
      nonexistentCouponRejected: fakeCouponRes.valid === false,
      dbCouponLifecycle: couponLifecycle,
      balancedAccountTransfer: transferTest,
      paymentVerificationIdempotency: paymentIdempotency,
      contactInquirySubmitted: inquirySubmit.status === 200 || inquirySubmit.status === 201,
      contactInquirySyncedAndCleaned: inquiryCleanup,
    };
  } catch (err) {
    report.fatalError = err.message;
  } finally {
    report.consoleErrors = consoleErrors;
    report.pageErrors = pageErrors;
    report.failedRequests = failedRequests;
    await browser.close();
    console.log(JSON.stringify(report, null, 2));
  }
})();
