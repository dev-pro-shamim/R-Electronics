import fs from "fs";
import path from "path";
import { AdminDatabase, AdminOrderRecord } from "@/types/admin";
import { DEFAULT_ROLES, hashPassword } from "@/lib/adminAuth";
import { recomputeAccountBalances } from "@/lib/accountingEngine";
import { CATEGORIES } from "@/data/categories";
import { BRANDS } from "@/data/brands";
import { EMI_BANKS, EMI_RATES, EMI_MIN_AMOUNT } from "@/data/emiData";
import { POLICIES } from "@/data/policies";
import { HERO_SIDE_BANNERS, MID_PAGE_BANNERS } from "@/data/banners";
import { PRODUCTS } from "@/data/products";
import { generateSeedReviewsForCatalog } from "@/lib/seedReviews";
import { buildSeedProductQuestions } from "@/lib/seedQna";
import { buildSeedLandingPages } from "@/lib/seedLandingPages";
import { supabase } from "@/lib/supabase";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "admin-db.json");
const REVIEWS_PATH = path.join(DB_DIR, "admin-reviews.json");
let lastWrittenReviewsRef: unknown = null;

export function createSeedDatabase(): AdminDatabase {
  const defaultEmail = process.env.ADMIN_EMAIL || "admin@rangoelectronics.com";
  const defaultPass = process.env.ADMIN_PASSWORD || "Rango@2026";
  const nowIso = new Date().toISOString();

  const heroBanners = [
    {
      id: "hero-1",
      placement: "hero" as const,
      title: "All Types of Deep Fridge Available",
      subtitle: "Haier, Hisense, Jamuna & Sharp Deep Freezers",
      image: "/banners/slider_deep_fridge.webp",
      link: "/category/refrigerator",
      active: true,
      order: 1,
    },
    {
      id: "hero-2",
      placement: "hero" as const,
      title: "Smart TV Starting Price 12,999Tk",
      subtitle: "Crystal UHD & Google TV with Free Installation",
      image: "/banners/slider_smart_tv.webp",
      link: "/category/television",
      active: true,
      order: 2,
    },
    {
      id: "hero-3",
      placement: "hero" as const,
      title: "Cool & Classy Smart Fridge",
      subtitle: "Starting 29,999Tk with 0% EMI Facility",
      image: "/banners/slider_smart_fridge.webp",
      link: "/category/refrigerator",
      active: true,
      order: 3,
    },
    {
      id: "hero-4",
      placement: "hero" as const,
      title: "Washing Machine Top/Front Loading",
      subtitle: "Starting Price 23,999Tk",
      image: "/banners/slider_washing_machine.webp",
      link: "/category/washing-machine",
      active: true,
      order: 4,
    },
    {
      id: "hero-5",
      placement: "hero" as const,
      title: "AC Big Sale — Inverter & Non-Inverter",
      subtitle: "Starting 32,999/- | Discount Up to 30,000/-",
      image: "/banners/slider_ac_big_sale.webp",
      link: "/category/air-conditioner",
      active: true,
      order: 5,
    },
    {
      id: "hero-6",
      placement: "hero" as const,
      title: "Water Purifier Collection",
      subtitle: "Starting Price 4,999Tk + Free Installation",
      image: "/banners/slider_water_purifier.webp",
      link: "/category/water-purifiers",
      active: true,
      order: 6,
    },
    {
      id: "hero-7",
      placement: "hero" as const,
      title: "Geyser Upto 5 Years Replacement",
      subtitle: "Starting Price 4,999Tk",
      image: "/banners/slider_geyser.webp",
      link: "/category/geyser-water-heaters",
      active: true,
      order: 7,
    },
  ];

  const sideBanners = HERO_SIDE_BANNERS.map((b, idx) => ({
    id: b.id,
    placement: "side" as const,
    title: b.title,
    subtitle: b.subtitle,
    image: b.image,
    link: b.url,
    active: true,
    order: idx + 1,
  }));

  const promoBanner = {
    id: "promo-11-11",
    placement: "promo_full" as const,
    title: "11.11 Mega Sale Campaign",
    subtitle: "Up to 57% Discount + Free Installation + 0% EMI",
    image: "/banners/11-11-mega-sale-rango.png",
    link: "/offer",
    active: true,
    order: 1,
  };

  const midBanners = MID_PAGE_BANNERS.map((b, idx) => ({
    id: b.id,
    placement: "mid" as const,
    title: b.title,
    subtitle: b.subtitle,
    image: b.image,
    link: b.url,
    active: true,
    order: idx + 1,
  }));

  const initialAccounts = [
    {
      id: "acc-cash",
      name: "Showroom Cash Drawer",
      accountType: "Cash" as const,
      accountNumber: "CASH-MAIN",
      openingBalance: 0,
      currentBalance: 0,
      active: true,
    },
    {
      id: "acc-bank",
      name: "City / SCB Corporate Bank Account",
      accountType: "Bank" as const,
      accountNumber: "AC-1098422019",
      openingBalance: 0,
      currentBalance: 0,
      active: true,
    },
    {
      id: "acc-bkash",
      name: "bKash Merchant Wallet",
      accountType: "bKash" as const,
      accountNumber: "01798565001",
      openingBalance: 0,
      currentBalance: 0,
      active: true,
    },
    {
      id: "acc-nagad",
      name: "Nagad Business Wallet",
      accountType: "Nagad" as const,
      accountNumber: "01911116359",
      openingBalance: 0,
      currentBalance: 0,
      active: true,
    },
    {
      id: "acc-other",
      name: "Petty Cash & Reserve",
      accountType: "Other" as const,
      accountNumber: "RES-01",
      openingBalance: 0,
      currentBalance: 0,
      active: true,
    },
  ];

  const basePolicies = Object.fromEntries(
    Object.entries(POLICIES).map(([k, v]) => [
      k,
      {
        ...v,
        seoTitle: `${v.title} | Rango Electronics`,
        metaDescription: `${v.title} - Official Rango Electronics policy & information.`,
        published: true,
      },
    ])
  );

  // Ensure standard e-commerce CMS pages exist
  const extraPolicies: Record<string, { title: string; content: string }> = {
    "return-policy": {
      title: "Return & Replacement Policy",
      content:
        "<h2>7-Day Easy Return & Replacement</h2><p>Products with manufacturing defects or Transit damage are eligible for official replacement within 7 days with original packaging and warranty card.</p>",
    },
    "refund-policy": {
      title: "Refund Policy",
      content:
        "<h2>Refund Processing Timeline</h2><p>Approved refunds are processed within 5-7 working days to your original bKash, Nagad, or bank card account.</p>",
    },
    "delivery-policy": {
      title: "Delivery & Installation Policy",
      content:
        "<h2>Fast Express Delivery Across 64 Districts</h2><p>Same-day or 24-48 hour delivery inside Dhaka (৳60) and 2-4 business days across Bangladesh.</p>",
    },
    faq: {
      title: "Frequently Asked Questions (FAQ)",
      content:
        "<h2>Customer FAQ</h2><p><strong>Do all products include official brand warranty?</strong> Yes, 100% genuine warranty cards included.</p><p><strong>Is 0% EMI available?</strong> Yes, up to 36 months across 30 partner commercial banks.</p>",
    },
  };
  for (const [slug, info] of Object.entries(extraPolicies)) {
    if (!basePolicies[slug]) {
      basePolicies[slug] = {
        slug,
        title: info.title,
        lastUpdated: "November 2026",
        content: info.content,
        seoTitle: `${info.title} | Rango Electronics`,
        metaDescription: info.title,
        published: true,
      };
    }
  }

  return {
    adminUsers: [
      {
        id: "adm-1",
        name: "Rango Super Admin",
        email: defaultEmail,
        passwordHash: hashPassword(defaultPass),
        role: "Super Admin",
        active: true,
        createdAt: nowIso,
      },
    ],
    roles: DEFAULT_ROLES,
    customProducts: [],
    productOverrides: {},
    deletedProductIds: [],
    categories: CATEGORIES.map((c, idx) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      displayOrder: idx + 1,
      seoTitle: `${c.name} Price in Bangladesh | Rango Electronics`,
      seoDescription: `Shop authentic ${c.name} at best price in Bangladesh with official warranty and 0% EMI.`,
      subcategories: c.subcategories.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
      })),
    })),
    brands: BRANDS.map((b) => ({
      ...b,
      authorized: true,
      description: `Official authorized ${b.name} dealer in Bangladesh with genuine warranty.`,
      seoTitle: `${b.name} Electronics Price in Bangladesh | Rango Electronics`,
      seoDescription: `Buy genuine ${b.name} products with official warranty & 0% EMI.`,
    })),
    coupons: [
      {
        id: "cpn-1",
        code: "RANGO2026",
        name: "Rango Welcome 10% Voucher",
        type: "percent",
        value: 10,
        minOrder: 5000,
        maxDiscount: 5000,
        startDate: "2026-01-01",
        expiryDate: "2026-12-31",
        usageLimit: 500,
        perCustomerLimit: 2,
        usageCount: 0,
        usageByCustomer: {},
        applicableCategories: [],
        applicableProducts: [],
        description: "10% flat discount on orders above ৳5,000 (max ৳5,000 off)",
        active: true,
      },
      {
        id: "cpn-2",
        code: "EIDSPECIAL",
        name: "Eid Festival 10% Off",
        type: "percent",
        value: 10,
        minOrder: 10000,
        maxDiscount: 8000,
        startDate: "2026-01-01",
        expiryDate: "2026-12-31",
        usageLimit: 300,
        perCustomerLimit: 2,
        usageCount: 0,
        usageByCustomer: {},
        applicableCategories: [],
        applicableProducts: [],
        description: "Eid Special 10% festival savings on electronics & appliances",
        active: true,
      },
      {
        id: "cpn-3",
        code: "OFFER10",
        name: "Campaign 10% Promo",
        type: "percent",
        value: 10,
        minOrder: 3000,
        maxDiscount: 4000,
        startDate: "2026-01-01",
        expiryDate: "2026-12-31",
        usageLimit: 500,
        perCustomerLimit: 3,
        usageCount: 0,
        usageByCustomer: {},
        applicableCategories: [],
        applicableProducts: [],
        description: "10% storewide campaign promo voucher",
        active: true,
      },
      {
        id: "cpn-4",
        code: "FREE60",
        name: "Free Dhaka Delivery",
        type: "fixed",
        value: 60,
        minOrder: 1000,
        startDate: "2026-01-01",
        expiryDate: "2026-12-31",
        usageLimit: 1000,
        perCustomerLimit: 5,
        usageCount: 0,
        usageByCustomer: {},
        applicableCategories: [],
        applicableProducts: [],
        description: "৳60 instant delivery fee discount",
        active: true,
      },
    ],
    banners: [...heroBanners, ...sideBanners, promoBanner, ...midBanners],
    popups: [
      {
        id: "popup-11-11",
        title: "11.11 Mega Electronics Carnival",
        description:
          "Use promo code RANGO2026 at checkout for 10% extra savings + Free Installation on Inverter ACs & 4K TVs!",
        desktopImage: "/banners/slider_ac_big_sale.webp",
        mobileImage: "/banners/slider_ac_big_sale.webp",
        buttonText: "Shop Mega Deals",
        buttonLink: "/offer",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
        displayPosition: "center",
        targetPages: "homepage",
        selectedPaths: ["/"],
        visitorRule: "first_visit",
        frequency: "once_per_session",
        delaySeconds: 4,
        active: false,
      },
    ],
    trackingSettings: {
      metaPixelId: "",
      metaPixelEnabled: false,
      metaCapiEnabled: false,
      metaTestEventCode: "",
      metaEvents: [
        "PageView",
        "ViewContent",
        "Search",
        "AddToCart",
        "InitiateCheckout",
        "AddPaymentInfo",
        "Purchase",
        "CompleteRegistration",
      ],
      gtmContainerId: "",
      gtmEnabled: false,
      ga4MeasurementId: "",
      consentRequired: false,
    },
    paymentChannels: [
      {
        id: "cod",
        name: "Cash on Delivery (COD)",
        enabled: true,
        instructions: "Pay cash upon product inspection & delivery",
      },
      {
        id: "bkash",
        name: "bKash Merchant Payment",
        enabled: true,
        accountNumber: "01798565001",
        instructions: "Send Payment to bKash Merchant and enter TrxID",
      },
      {
        id: "nagad",
        name: "Nagad Payment",
        enabled: true,
        accountNumber: "01911116359",
        instructions: "Send Money to Nagad Personal/Merchant and verify TrxID",
      },
      {
        id: "sslcommerz",
        name: "SSLCommerz Online Gateway",
        enabled: true,
        instructions: "Visa, Mastercard, AMEX & Net Banking checkout",
      },
      {
        id: "card",
        name: "Debit / Credit Card",
        enabled: true,
        instructions: "Online & POS card payments",
      },
      {
        id: "emi",
        name: "0% Interest EMI Facility",
        enabled: true,
        instructions: "Available up to 36 months across 30 commercial banks",
      },
    ],
    payments: [],
    recordedPaymentOrderIds: [],
    invoices: [],
    couriers: [
      {
        id: "rango_express",
        name: "Rango Express Own Delivery",
        enabled: true,
        sandboxMode: false,
        defaultCharge: 60,
      },
      {
        id: "pathao",
        name: "Pathao Courier",
        enabled: true,
        sandboxMode: true,
        baseUrl: "https://api-hermes.pathao.com",
        defaultCharge: 100,
      },
      {
        id: "steadfast",
        name: "Steadfast Courier",
        enabled: true,
        sandboxMode: true,
        baseUrl: "https://portal.packzy.com/api/v1",
        defaultCharge: 120,
      },
      {
        id: "redx",
        name: "RedX Logistics",
        enabled: true,
        sandboxMode: true,
        baseUrl: "https://openapi.redx.com.bd/v1.0.0-beta",
        defaultCharge: 110,
      },
      {
        id: "paperfly",
        name: "Paperfly Express",
        enabled: false,
        sandboxMode: true,
        baseUrl: "https://api.paperfly.com.bd",
        defaultCharge: 130,
      },
      {
        id: "custom",
        name: "Custom Courier API",
        enabled: false,
        sandboxMode: true,
        baseUrl: "",
        trackingUrlPattern: "",
        defaultCharge: 120,
      },
    ],
    courierBookings: [],
    reviews: generateSeedReviewsForCatalog(PRODUCTS),
    productQuestions: buildSeedProductQuestions(PRODUCTS),
    offers: [],
    landingPages: buildSeedLandingPages(),
    customerUsers: [],
    emailLogs: [],
    stockMovements: [],
    stockDeductedOrderIds: [],
    accounts: initialAccounts,
    financialTransactions: [],
    customExpenseCategories: [
      "Product Purchase",
      "Office Rent",
      "Employee Salary",
      "Marketing",
      "Advertising",
      "Courier",
      "Packaging",
      "Electricity",
      "Internet",
      "Software",
      "Hosting",
      "Maintenance",
      "Transportation",
      "Other Expenses",
    ],
    accountsPayable: 0,
    accountsReceivable: 0,
    emiBanks: EMI_BANKS.map((b) => ({
      ...b,
      processingFeePercent: 0,
      interestRate: 0,
      zeroEmiEligible: true,
      minOrderAmount: EMI_MIN_AMOUNT,
      applicableCategories: [],
      enabled: true,
    })),
    emiRates: EMI_RATES.map((r) => ({ ...r })),
    policies: basePolicies,
    productModeration: {},
    chatConversations: [],
    chatbotFaqs: [
      {
        id: "faq-emi",
        keywords: "emi, কিস্তি, installment, bank",
        question: "০% ইএমআই (EMI) সুবিধা কীভাবে পাওয়া যায়?",
        answer:
          "৳৫,০০০+ মূল্যের যেকোনো প্রোডাক্টে ৩০টি বাণিজ্যিক ব্যাংকের ক্রেডিট কার্ডে ৩ থেকে ৩৬ মাস পর্যন্ত ০% ইন্টারেস্টে EMI সুবিধা রয়েছে।",
        productLink: "/page/emi-policy",
        active: true,
      },
      {
        id: "faq-payment",
        keywords: "bkash, nagad, payment, বিকাশ, নগদ, পেমেন্ট",
        question: "বিকাশ ও নগদ পেমেন্ট নম্বর কী?",
        answer:
          "বিকাশ মার্চেন্ট: 01798565001 এবং নগদ: 01911116359। এছাড়াও Cash on Delivery ও SSLCommerz কার্ড পেমেন্ট চালু রয়েছে।",
        productLink: "/checkout",
        active: true,
      },
      {
        id: "faq-location",
        keywords: "location, showroom, address, ঠিকানা, শোরুম",
        question: "রঙ্গ ইলেকট্রনিক্স শোরুমের ঠিকানা কোথায়?",
        answer:
          "H-11, R-11, DIT Project, Merul Badda, Dhaka। হটলাইন: +88 01798-565001 (প্রতিদিন সকাল ৯টা – রাত ১০টা)।",
        productLink: "/page/contact-us",
        active: true,
      },
    ],
    predefinedReplies: [
      "ধন্যবাদ! আপনার প্রোডাক্টটি স্টকে আছে এবং আজই ডেলিভারির জন্য প্রস্তুত।",
      "৩০টি বাণিজ্যিক ব্যাংকের ক্রেডিট কার্ডে ৩ থেকে ৩৬ মাস পর্যন্ত ০% EMI সুবিধা পাবেন।",
      "অফিশিয়াল ব্র্যান্ড ওয়ারেন্টি কার্ড এবং ঢাকার ভেতরে ফ্রি ইন্সটলেশন সহ ডেলিভারি করা হয়।",
    ],
    contactInquiries: [],
    customerOverrides: {},
    orderOverrides: {},
    settings: {
      storeName: "Rango Electronics",
      logoUrl: "/logo.png",
      faviconUrl: "/favicon.ico",
      hotlinePrimary: "+88 01798-565001",
      hotlineSecondary: "+88 01554-565001",
      whatsappNumber: "+88 01798-565001",
      supportEmail: "electronics.rango@gmail.com",
      officeAddress: "H-11 R-11 DIT Project, Merul Badda, Dhaka, Bangladesh",
      currencySymbol: "৳",
      insideDhakaShipping: 60,
      outsideDhakaShipping: 150,
      freeDeliveryThreshold: 50000,
      emiMinAmount: EMI_MIN_AMOUNT,
      lowStockThreshold: 5,
      stockDeductOnStatus: "Confirmed",
      defaultVatPercent: 0,
      invoicePrefix: "INV-RE",
      invoiceFooterNote: "Thank you for shopping genuine electronics at Rango Electronics!",
      autoInvoiceOnOrder: true,
      seoDefaultTitle: "Rango Electronics – Trusted Online Electronics Shop in Bangladesh",
      seoDefaultDescription:
        "Shop authentic 4K Smart TVs, Inverter Air Conditioners, Refrigerators & Washing Machines with 0% EMI.",
      socialLinks: {
        facebook: "https://www.facebook.com/rangoelectronics",
        instagram: "https://www.instagram.com/rangoelectronics",
        youtube: "https://www.youtube.com/@rangoelectronics",
      },
      homepageSections: [
        { id: "hero", label: "Hero Slider & Side Offer Banners", enabled: true, order: 1 },
        { id: "highlights", label: "Service Highlights Bar", enabled: true, order: 2 },
        { id: "promo_full", label: "11.11 Mega Sale Full Banner", enabled: true, order: 3 },
        { id: "featured_cats", label: "Featured Categories Grid", enabled: true, order: 4 },
        { id: "hot_deals", label: "Hot Deals Carousel", enabled: true, order: 5 },
        { id: "ac_section", label: "Air Conditioner Section", enabled: true, order: 6 },
        { id: "tv_section", label: "Smart Television Section", enabled: true, order: 7 },
        { id: "mid_banners", label: "Mid-Page Promotional Banners", enabled: true, order: 8 },
        { id: "brands", label: "Authorized Brands Strip", enabled: true, order: 9 },
      ],
      chatbotGreeting:
        "আসসালামু আলাইকুম! রঙ্গ ইলেকট্রনিক্স (Rango Electronics)-এর অফিশিয়াল অ্যাসিস্ট্যান্টে স্বাগতম।",
      emailAlertsEnabled: true,
      googleSiteVerification: "",
      smtpSettings: {
        provider: "smtp",
        host: "smtp.gmail.com",
        port: 465,
        username: "",
        senderName: "Rango Electronics",
        senderEmail: "electronics.rango@gmail.com",
        adminNotificationEmail: "electronics.rango@gmail.com",
      },
    },
    auditLogs: [
      {
        id: "log-init",
        timestamp: nowIso,
        actor: defaultEmail,
        actorRole: "Super Admin",
        section: "System",
        action: "Initialized Enterprise Admin Control Database",
      },
    ],
  };
}

let cachedSeedSnapshot: AdminDatabase | null = null;

function getSeedDatabase(): AdminDatabase {
  if (!cachedSeedSnapshot) {
    cachedSeedSnapshot = createSeedDatabase();
  }
  return cachedSeedSnapshot;
}

export function getAdminDbStatKey(): string {
  try {
    const dbKey = fs.existsSync(DB_PATH)
      ? (() => {
          const s = fs.statSync(DB_PATH);
          return `${s.mtimeMs}:${s.size}`;
        })()
      : "none";
    const revKey = fs.existsSync(REVIEWS_PATH)
      ? (() => {
          const s = fs.statSync(REVIEWS_PATH);
          return `${s.mtimeMs}:${s.size}`;
        })()
      : "none";
    if (dbKey !== "none" || revKey !== "none") {
      return `${dbKey}|${revKey}`;
    }
  } catch {
    // ignore stat error
  }
  return "seed";
}

export function readAdminDb(): AdminDatabase {
  const seed = getSeedDatabase();
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2), "utf8");
      return seed;
    }
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<AdminDatabase>;

    // Upgrade legacy admin-db cleanly without losing user edits
    const legacyEmail = (parsed as { adminEmail?: string }).adminEmail;
    const legacyHash = (parsed as { adminPasswordHash?: string }).adminPasswordHash;
    const adminUsers =
      Array.isArray(parsed.adminUsers) && parsed.adminUsers.length > 0
        ? parsed.adminUsers
        : [
            {
              ...seed.adminUsers[0],
              email: legacyEmail || seed.adminUsers[0].email,
              passwordHash: legacyHash || seed.adminUsers[0].passwordHash,
            },
          ];

    const accounts = recomputeAccountBalances(
      parsed.accounts?.length ? parsed.accounts : seed.accounts,
      parsed.financialTransactions || []
    );

    const existingCouriers = Array.isArray(parsed.couriers) ? parsed.couriers : [];
    const courierMap = new Map(seed.couriers.map((c) => [c.id, { ...c }]));
    for (const c of existingCouriers) {
      const base = courierMap.get(c.id);
      courierMap.set(c.id, base ? { ...base, ...c } : c);
    }

    const existingQuestions = Array.isArray(parsed.productQuestions) ? parsed.productQuestions : [];
    const hasSeededQna = existingQuestions.some((q) => String(q.id || "").startsWith("qa-seed-"));
    const mergedQuestions = hasSeededQna
      ? existingQuestions
      : [...existingQuestions, ...seed.productQuestions];

    const existingReviews = (() => {
      try {
        if (fs.existsSync(REVIEWS_PATH)) {
          const rawRev = fs.readFileSync(REVIEWS_PATH, "utf8");
          const parsedRev = JSON.parse(rawRev);
          if (Array.isArray(parsedRev)) return parsedRev;
        }
      } catch {
        // fallback to embedded reviews if split file is malformed
      }
      const inlineReviews = Array.isArray(parsed.reviews) ? parsed.reviews : [];
      if (inlineReviews.length > 0 && !fs.existsSync(REVIEWS_PATH)) {
        try {
          fs.writeFileSync(REVIEWS_PATH, JSON.stringify(inlineReviews), "utf8");
        } catch {
          // ignore migration write error on read
        }
      }
      return inlineReviews;
    })();
    lastWrittenReviewsRef = existingReviews;

    const merged: AdminDatabase = {
      ...seed,
      ...parsed,
      adminUsers,
      roles: parsed.roles?.length ? parsed.roles : seed.roles,
      accounts,
      couriers: Array.from(courierMap.values()),
      reviews: existingReviews,
      productQuestions: mergedQuestions,
      offers: Array.isArray(parsed.offers) ? parsed.offers : [],
      landingPages:
        Array.isArray(parsed.landingPages) && parsed.landingPages.length > 0
          ? parsed.landingPages
          : seed.landingPages,
      customerUsers: Array.isArray(parsed.customerUsers) ? parsed.customerUsers : [],
      emailLogs: Array.isArray(parsed.emailLogs) ? parsed.emailLogs : [],
      trackingSettings: {
        ...seed.trackingSettings,
        ...(parsed.trackingSettings || {}),
      },
      settings: {
        ...seed.settings,
        ...(parsed.settings || {}),
        smtpSettings: {
          ...seed.settings.smtpSettings,
          ...(parsed.settings?.smtpSettings || {}),
        },
        socialLinks: {
          ...seed.settings.socialLinks,
          ...(parsed.settings?.socialLinks || {}),
        },
        homepageSections:
          parsed.settings?.homepageSections?.length
            ? parsed.settings.homepageSections
            : seed.settings.homepageSections,
      },
      policies: {
        ...seed.policies,
        ...(parsed.policies || {}),
      },
    };
    return merged;
  } catch (err) {
    console.error("Failed reading admin-db.json, falling back to seed:", err);
    return seed;
  }
}

let cachedDbSnapshot: { key: string; db: AdminDatabase } | null = null;

export function readAdminDbCached(): AdminDatabase {
  try {
    if (fs.existsSync(DB_PATH)) {
      const key = getAdminDbStatKey();
      if (cachedDbSnapshot && cachedDbSnapshot.key === key) {
        return cachedDbSnapshot.db;
      }
      const fresh = readAdminDb();
      cachedDbSnapshot = {
        key: getAdminDbStatKey(),
        db: fresh,
      };
      return fresh;
    }
  } catch {
    // fall through
  }
  return readAdminDb();
}

export function writeAdminDb(db: AdminDatabase): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const reviewsArr = Array.isArray(db.reviews) ? db.reviews : [];
    if (!fs.existsSync(REVIEWS_PATH) || reviewsArr !== lastWrittenReviewsRef) {
      fs.writeFileSync(REVIEWS_PATH, JSON.stringify(reviewsArr), "utf8");
      lastWrittenReviewsRef = reviewsArr;
    }
    const { reviews: _omitReviews, ...coreDb } = db;
    fs.writeFileSync(DB_PATH, JSON.stringify(coreDb), "utf8");
    try {
      cachedDbSnapshot = {
        key: getAdminDbStatKey(),
        db,
      };
    } catch {
      cachedDbSnapshot = null;
    }
  } catch (err) {
    // In serverless environments (like Vercel read-only filesystem), disk writes may fail.
    // We update in-memory cache so subsequent reads within the lambda container stay valid.
    cachedDbSnapshot = {
      key: `mem-${Date.now()}`,
      db,
    };
    console.warn("writeAdminDb disk write skipped/failed (likely serverless readonly env):", err);
  }
}

export function appendAuditLog(
  db: AdminDatabase,
  actor: string,
  section: string,
  action: string,
  actorRole = "Super Admin",
  details?: string
): AdminDatabase {
  const entry = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    actor,
    actorRole,
    section,
    action,
    details,
  };
  return {
    ...db,
    auditLogs: [entry, ...(db.auditLogs || [])].slice(0, 250),
  };
}

/**
 * Best-effort sync helpers for existing live Supabase tables (orders, products, categories).
 */
export async function syncOrderToSupabase(orderId: string, fields: Record<string, unknown>) {
  try {
    const { error } = await supabase.from("orders").update(fields).eq("id", orderId);
    if (error) {
      // Fall back to updating core columns guaranteed to exist
      if (fields.status) {
        await supabase.from("orders").update({ status: fields.status }).eq("id", orderId);
      }
    }
  } catch {
    // Non-blocking fallback handled in server store
  }
}

export async function syncProductToSupabase(product: Record<string, unknown>) {
  try {
    await supabase.from("products").upsert(
      {
        id: product.id,
        slug: product.slug,
        title: product.title,
        category: product.category,
        subcategory: product.subcategory || product.category,
        brand: product.brand,
        model: product.model || "",
        price: Number(product.price || 0),
        original_price: Number(product.originalPrice || product.price || 0),
        discount: Number(product.discount || 0),
        in_stock: !product.isStockOut && Number(product.stock ?? 10) > 0,
        thumbnail: product.thumbnail,
        images: product.images || [product.thumbnail],
        description: product.description || "",
        specifications: product.specifications || [],
        warranty: product.warranty || "Official Brand Warranty",
        emi_available: product.emiAvailable !== false,
        reviews_count: typeof product.reviewsCount === "number" ? product.reviewsCount : 0,
        rating: typeof product.rating === "number" ? product.rating : 0,
      },
      { onConflict: "id" }
    );
  } catch {
    // Server JSON store persists any extended fields seamlessly
  }
}

export async function syncCategoryToSupabase(category: {
  id: string;
  name: string;
  slug: string;
  image?: string;
  icon?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  sortOrder?: number;
  active?: boolean;
}) {
  try {
    await supabase.from("categories").upsert(
      {
        id: category.id,
        name: category.name,
        slug: category.slug,
        image: category.image || "",
        icon: category.icon || "",
        description: category.description || "",
        seo_title: category.seoTitle || "",
        seo_description: category.seoDescription || "",
        sort_order: Number(category.sortOrder ?? 0),
        active: category.active !== false,
      },
      { onConflict: "id" }
    );
  } catch {
    // fallback handled by admin-db.json
  }
}

export async function syncReviewToSupabase(review: {
  id: string;
  productId: string;
  userName: string;
  userEmail?: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  status: string;
  adminReply?: string;
  verifiedPurchase?: boolean;
  isTestData?: boolean;
}) {
  try {
    await supabase.from("reviews").upsert(
      {
        id: review.id,
        product_id: review.productId,
        author: review.userName,
        rating: review.rating,
        title: review.title || "",
        comment: review.comment,
        status: review.status,
        verified_purchase: Boolean(review.verifiedPurchase),
      },
      { onConflict: "id" }
    );
  } catch {
    // fallback handled by admin-db.json
  }
}

let ordersRemoteCache: { fetchedAt: number; rows: AdminOrderRecord[] } | null = null;

export function prependCachedOrder(order: AdminOrderRecord) {
  if (!ordersRemoteCache) {
    ordersRemoteCache = { fetchedAt: Date.now(), rows: [order] };
    return;
  }
  const filtered = ordersRemoteCache.rows.filter((r) => r.id !== order.id);
  ordersRemoteCache = {
    fetchedAt: ordersRemoteCache.fetchedAt,
    rows: [order, ...filtered],
  };
}

export async function fetchAllOrdersUnified(
  db: AdminDatabase,
  options: { forceRemote?: boolean; skipRemote?: boolean } = {}
): Promise<AdminOrderRecord[]> {
  const map = new Map<string, AdminOrderRecord>();
  const cacheFresh =
    ordersRemoteCache && Date.now() - ordersRemoteCache.fetchedAt < 15000;

  if (!options.skipRemote && (options.forceRemote || !cacheFresh)) {
    try {
      const fetchPromise = supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      const timeoutPromise = new Promise<{ data: null }>((resolve) =>
        setTimeout(() => resolve({ data: null }), 1800)
      );
      const res = await Promise.race([fetchPromise, timeoutPromise]);
      const data = (res as { data?: any[] | null })?.data;
      if (Array.isArray(data)) {
        const mapped: AdminOrderRecord[] = [];
        for (const r of data) {
          mapped.push({
            id: r.id,
            date: r.created_at
              ? new Date(r.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Recent",
            createdAtIso: r.created_at,
            status: r.status || "Pending",
            paymentMethod: r.payment_method || "Cash On Delivery",
            paymentStatus:
              r.payment_status ||
              (r.payment_method?.toLowerCase().includes("ssl")
                ? "Paid"
                : r.bkash_trx_id || r.nagad_trx_id
                ? "Pending Verification"
                : "Unpaid"),
            subtotal: Number(r.subtotal || r.total || 0),
            discount: Number(r.discount || 0),
            shipping: Number(r.shipping || 0),
            total: Number(r.total || 0),
            bkashPhone: r.bkash_phone || undefined,
            bkashTrxId: r.bkash_trx_id || undefined,
            nagadPhone: r.nagad_phone || undefined,
            nagadTrxId: r.nagad_trx_id || undefined,
            shippingAddress: {
              fullName: r.customer_name || "Customer",
              phone: r.phone || "N/A",
              email: r.email || undefined,
              city: r.city || "Dhaka",
              address: r.address || "Dhaka",
            },
            items: Array.isArray(r.items) ? r.items : [],
            source: "supabase",
          });
        }
        ordersRemoteCache = { fetchedAt: Date.now(), rows: mapped };
      }
    } catch {
      // ignore offline supabase
    }
  }

  for (const row of ordersRemoteCache?.rows || []) {
    map.set(row.id, row);
  }

  for (const [id, ov] of Object.entries(db.orderOverrides || {})) {
    const existing = map.get(id);
    if (existing) {
      map.set(id, { ...existing, ...ov });
    } else if (
      typeof (ov as Partial<AdminOrderRecord>).total === "number" &&
      Array.isArray((ov as Partial<AdminOrderRecord>).items)
    ) {
      map.set(id, {
        id,
        date: "Recent",
        status: "Pending",
        paymentMethod: "Cash On Delivery",
        paymentStatus: "Unpaid",
        subtotal: 0,
        discount: 0,
        shipping: 0,
        total: 0,
        shippingAddress: {
          fullName: "Customer",
          phone: "N/A",
          city: "Dhaka",
          address: "Dhaka",
        },
        items: [],
        source: "local",
        ...(ov as AdminOrderRecord),
      });
    }
  }
  return Array.from(map.values());
}
