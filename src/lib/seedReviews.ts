import { PRODUCTS } from "@/data/products";
import { ProductReviewRecord } from "@/types/admin";

export interface ReviewableProduct {
  id: string;
  title: string;
  brand?: string;
  category?: string;
  thumbnail?: string;
  images?: string[];
}

const REVIEWER_NAMES = [
  "Tanvir Hasan",
  "Nusrat Jahan",
  "Mahmudul Karim",
  "Farhana Akter",
  "Sabbir Ahmed",
  "Tasnim Tabassum",
  "Rakibul Islam",
  "Mehedi Hasan",
  "Sadia Afrin",
  "Rafiqul Islam",
  "Nafisa Chowdhury",
  "Arifur Rahman",
  "Jannatul Ferdous",
  "Kamrul Hasan",
  "Sumaiya Khatun",
  "Ashraful Alam",
  "Tariqul Islam",
  "Maliha Rahman",
  "Shafiqur Rahman",
  "Lamia Islam",
  "Imran Hossain",
  "Fahmida Sultana",
  "Zayed Khan",
  "Sharmin Akter",
  "Nazmul Haque",
  "Tania Sultana",
  "Rezaul Karim",
  "Mousumi Yasmin",
  "Faisal Mahmud",
  "Kazi Nabil",
  "Rashedul Islam",
  "Nadia Islam",
  "Tahmid Chowdhury",
  "Tanjina Akter",
  "Mushfiqur Rahman",
  "Sabina Yasmin",
  "Habibur Rahman",
  "Farzana Kabir",
  "Asif Iqbal",
  "Shamima Nasrin",
  "Sajjad Hossain",
  "Anika Tabassum",
  "Masud Rana",
  "Samira Haque",
  "Noman Siddiqui",
  "Ruma Akter",
  "Shahriar Kabir",
  "Ishrat Jahan",
  "Jahidul Islam",
  "Tarek Aziz",
  "Mehnaz Karim",
  "Rubel Mia",
  "Shorifa Khatun",
  "Naimur Rahman",
  "Zarin Tasnim",
  "Mahbubur Rahman",
  "Sultana Razia",
  "Shakil Ahmed",
  "Lubna Jahan",
  "Saiful Islam",
];

const BD_LOCATIONS = [
  "Uttara, Dhaka",
  "Mirpur, Dhaka",
  "Dhanmondi, Dhaka",
  "Banani, Dhaka",
  "Badda, Dhaka",
  "Mohammadpur, Dhaka",
  "Gulshan, Dhaka",
  "Bashundhara R/A, Dhaka",
  "Motijheel, Dhaka",
  "Chattogram",
  "Sylhet",
  "Rajshahi",
  "Khulna",
  "Gazipur",
  "Narayanganj",
  "Cumilla",
  "Bogura",
  "Barishal",
];

interface CategoryTemplateSet {
  titles: string[];
  comments: string[];
}

const CATEGORY_TEMPLATES: Record<string, CategoryTemplateSet> = {
  "air-conditioner": {
    titles: [
      "Fast cooling & very low noise",
      "Saves electricity even in peak summer",
      "Original warranty card & quick installation",
      "Excellent inverter performance",
      "Value for money AC from Rango",
      "Smooth delivery inside Dhaka",
    ],
    comments: [
      "Using this {brand} AC for a few weeks now. Cools our bedroom within minutes and the outdoor unit runs surprisingly quiet.",
      "Ordered from Rango Electronics with 0% EMI. Same-day delivery in Dhaka and technician completed installation cleanly.",
      "Very happy with the cooling power of {shortTitle}. Even during 38°C afternoons the airflow stays strong and consistent.",
      "Genuine official {brand} unit with sealed warranty papers. Electricity bill increase has been noticeably lower than our old AC.",
      "Solid build quality and fast turbo cool mode. Customer care explained the warranty terms clearly before dispatch.",
      "Indoor display looks clean at night and sleep mode keeps the room comfortable without getting too cold.",
    ],
  },
  refrigerator: {
    titles: [
      "Spacious interior & rapid chilling",
      "Silent compressor operation",
      "Stylish finish fits our kitchen well",
      "Deep freezer freezes fast",
      "Authentic unit with brand warranty",
      "Delivered safely with zero scratches",
    ],
    comments: [
      "The cooling uniformity in {shortTitle} keeps vegetables fresh much longer. Zero frost buildup in the freezer compartment.",
      "Purchased this {brand} refrigerator for our family. Compressor barely makes any sound and door seals feel sturdy.",
      "Delivery team carried it carefully up to the 4th floor and unboxed it for inspection before signing off.",
      "Lots of bottle and vegetable rack space inside. Power consumption looks very reasonable on inverter mode.",
      "Genuine {brand} official product with proper VAT invoice and warranty card. Very satisfied with Rango Electronics.",
      "Color and glass door finish look premium in person. Cools water bottles fast even when loaded after Eid shopping.",
    ],
  },
  television: {
    titles: [
      "Sharp picture quality & rich colors",
      "Loud clear speakers for living room",
      "Smooth smart TV apps & WiFi",
      "Great brightness and viewing angle",
      "Original {brand} TV at best price",
      "Wall mount setup was super smooth",
    ],
    comments: [
      "Watching cricket and YouTube 4K on {shortTitle} looks super crisp. Remote response is quick without lag.",
      "Bought this {brand} TV via Rango Electronics. Picture contrast and Dolby sound easily fill a medium living room.",
      "Screen casting from phone and HDMI ports work flawlessly. Packaging arrived factory sealed with warranty card.",
      "Colors look natural out of the box without washing out. Great deal compared to local market showrooms.",
      "WiFi stays stable and built-in speakers have good dialogue clarity for news and dramas.",
      "Very thin bezel and clean design. Rango support confirmed official warranty registration right away.",
    ],
  },
  "washing-machine": {
    titles: [
      "Super quiet spin & clean wash",
      "Huge time saver for busy family",
      "Gentle on delicate clothes",
      "Low vibration even at high RPM",
      "Reliable {brand} quality",
      "Fast delivery & demo support",
    ],
    comments: [
      "Using {shortTitle} almost every day now. Clothes come out clean and almost dry after the spin cycle.",
      "Barely vibrates during spin mode once leveled properly. Water consumption feels economical as well.",
      "Bought from Rango Electronics on 0% bank EMI. Very helpful phone support helped us pick the right capacity.",
      "Multiple wash programs work well for cottons and bedsheets. Digital timer and child lock are very handy.",
      "Authentic {brand} machine with sealed accessories and inlet hose included inside the box.",
      "Installation was straightforward and the drum runs smoothly without loud banging.",
    ],
  },
  "microwave-oven": {
    titles: [
      "Heats evenly and fast",
      "Easy control panel for daily use",
      "Compact yet spacious turntable",
      "Great for grilling & reheating",
      "Sturdy build & clean design",
    ],
    comments: [
      "Using {shortTitle} daily for reheating, defrosting, and quick baking. Heats food evenly without cold spots.",
      "Very intuitive buttons so everyone at home can operate it easily. Exterior wipes clean in seconds.",
      "Genuine {brand} microwave delivered within 24 hours in Dhaka with intact packaging and official warranty.",
      "Quiet turntable motor and solid door latch. Definitely worth the price for a busy kitchen.",
      "Pre-set menu options save time every morning. Glass tray feels thick and durable.",
    ],
  },
  "water-purifiers": {
    titles: [
      "Water tastes crisp & fresh",
      "Smooth RO flow & compact size",
      "Free installation was very helpful",
      "Peace of mind for family health",
      "Reliable filtration quality",
    ],
    comments: [
      "After installing {shortTitle}, water taste improved dramatically with zero odor. TDS reading dropped right where it should be.",
      "Technician installed it neatly under our kitchen sink and explained when to service the sediment and RO cartridges.",
      "Tank capacity is plenty for our family of four and auto shut-off works quietly when full.",
      "Original {brand} purifier with complete filter kit and warranty card from Rango Electronics.",
      "Noticeably cleaner tea and cooking water since day one. Smooth customer service experience.",
    ],
  },
  "geyser-water-heaters": {
    titles: [
      "Heats water quickly in winter",
      "Holds temperature well overnight",
      "Safe auto cut-off feature",
      "Compact wall fit for bathroom",
      "Great {brand} build quality",
    ],
    comments: [
      "Installed {shortTitle} before winter and hot water is ready within minutes every morning. Thermostat cuts off reliably.",
      "Insulation retains warm water for hours without constantly turning on the heating element.",
      "Delivered safely to our home with mounting bracket and safety valve included inside the carton.",
      "Compact body fits cleanly above the shower corner and runs with zero leakage.",
      "Official {brand} warranty card was stamped cleanly. Happy with both price and quick delivery.",
    ],
  },
  "home-appliance": {
    titles: [
      "Strong motor & everyday durability",
      "Essential appliance at fair price",
      "Genuine {brand} product",
      "Works smoothly out of the box",
      "Fast delivery from Rango",
    ],
    comments: [
      "Been using {shortTitle} regularly at home and performance has been consistently strong without overheating.",
      "Build quality feels much sturdier than generic local options. Delivered sealed with warranty card.",
      "Handles tough daily tasks easily and cleans up fast after use. Great value from Rango Electronics.",
      "Ordered online in the afternoon and received it promptly next day with proper invoice.",
      "Solid {brand} reliability, quiet operation, and neat finish that looks good on the counter.",
    ],
  },
  "service-repair": {
    titles: [
      "Skilled & punctual technician",
      "Solved cooling issue on first visit",
      "Transparent service charge",
      "Neat work without mess",
      "Recommended Rango service team",
    ],
    comments: [
      "Booked {shortTitle} through Rango Electronics. Technician arrived on schedule with proper tools and tested everything thoroughly.",
      "Very polite engineer, diagnosed the exact fault instead of guessing, and shared clear pricing upfront.",
      "Accomplished the job cleanly and checked gas pressure and wiring safety before leaving.",
      "Quick turnaround within Dhaka. Appliance is running like new again after servicing.",
    ],
  },
};

const STORE_REPLIES = [
  "Thank you for choosing Rango Electronics! Wishing you years of reliable performance.",
  "We appreciate your valuable feedback and continued trust in our official warranty products.",
  "Glad our delivery and support team met your expectations. Reach out anytime at +88 01798-565001!",
];

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function createRng(seed: number) {
  let state = seed || 1;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shortenTitle(title: string): string {
  const clean = title.split("|")[0].trim();
  return clean.length > 48 ? `${clean.slice(0, 45).trim()}...` : clean;
}

export function generateSeedReviewsForProduct(
  product: ReviewableProduct,
  anchorMs = Date.UTC(2026, 10, 10, 12, 0, 0)
): ProductReviewRecord[] {
  const seed = hashString(product.id || product.title);
  const rand = createRng(seed);
  // Strict inclusive range: 20 to 60 reviews per product
  const count = 20 + (seed % 41);

  const catKey = (product.category || "home-appliance").toLowerCase();
  const templateSet =
    CATEGORY_TEMPLATES[catKey] || CATEGORY_TEMPLATES["home-appliance"];
  const brand = product.brand || "Official Brand";
  const shortTitle = shortenTitle(product.title);
  const candidateImages = [
    ...(Array.isArray(product.images) ? product.images : []),
    ...(product.thumbnail ? [product.thumbnail] : []),
  ]
    .map((src) => (typeof src === "string" ? src.trim() : ""))
    .filter(
      (src) =>
        src &&
        !src.toLowerCase().includes("/logo.png") &&
        !src.toLowerCase().includes("placeholder")
    );
  const uniqueImages = Array.from(new Set(candidateImages));

  const items: ProductReviewRecord[] = [];
  for (let i = 0; i < count; i++) {
    rand();
    const rating = 5;

    const nameIdx = Math.floor(rand() * REVIEWER_NAMES.length);
    const locIdx = Math.floor(rand() * BD_LOCATIONS.length);
    const titleTpl =
      templateSet.titles[Math.floor(rand() * templateSet.titles.length)];
    const commentTpl =
      templateSet.comments[Math.floor(rand() * templateSet.comments.length)];

    const title = titleTpl.replace(/\{brand\}/g, brand);
    const comment = commentTpl
      .replace(/\{brand\}/g, brand)
      .replace(/\{shortTitle\}/g, shortTitle);

    // Stagger timestamps over past ~220 days so dates feel organic; keep first couple recent
    const daysAgo = i === 0 ? 1 : i === 3 ? 4 : Math.floor(rand() * 220) + 1;
    const minsOffset = Math.floor(rand() * 1440);
    const createdAt = new Date(
      anchorMs - (daysAgo * 86400 + minsOffset * 60) * 1000
    ).toISOString();

    const includeReply = rand() < 0.12;
    const reply = includeReply
      ? STORE_REPLIES[Math.floor(rand() * STORE_REPLIES.length)]
      : undefined;

    const includeImage =
      uniqueImages.length > 0 && (i === 0 || i === 3 || rand() < 0.22);
    const reviewImages = includeImage
      ? [uniqueImages[i % uniqueImages.length]]
      : [];

    items.push({
      id: `rev-seed-${product.id}-${i + 1}`,
      productId: product.id,
      productTitle: product.title,
      userName: REVIEWER_NAMES[nameIdx],
      customerName: REVIEWER_NAMES[nameIdx],
      customerLocation: BD_LOCATIONS[locIdx],
      rating,
      title,
      comment,
      images: reviewImages,
      status: "Approved",
      verifiedPurchase: rand() < 0.88,
      adminReply: reply,
      createdAt,
    });
  }

  return items;
}

export function generateSeedReviewsForCatalog(
  products: ReviewableProduct[] = PRODUCTS
): ProductReviewRecord[] {
  const all: ProductReviewRecord[] = [];
  for (const prod of products) {
    all.push(...generateSeedReviewsForProduct(prod));
  }
  return all;
}
