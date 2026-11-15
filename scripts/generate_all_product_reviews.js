const fs = require('fs');
const path = require('path');

const REVIEWER_NAMES = [
  "Tanvir Hasan", "Nusrat Jahan", "Mahmudul Karim", "Farhana Akter", "Sabbir Ahmed",
  "Tasnim Tabassum", "Rakibul Islam", "Mehedi Hasan", "Sadia Afrin", "Rafiqul Islam",
  "Nafisa Chowdhury", "Arifur Rahman", "Jannatul Ferdous", "Kamrul Hasan", "Sumaiya Khatun",
  "Ashraful Alam", "Tariqul Islam", "Maliha Rahman", "Shafiqur Rahman", "Lamia Islam",
  "Imran Hossain", "Fahmida Sultana", "Zayed Khan", "Sharmin Akter", "Nazmul Haque",
  "Tania Sultana", "Rezaul Karim", "Mousumi Yasmin", "Faisal Mahmud", "Kazi Nabil",
  "Rashedul Islam", "Nadia Islam", "Tahmid Chowdhury", "Tanjina Akter", "Mushfiqur Rahman",
  "Sabina Yasmin", "Habibur Rahman", "Farzana Kabir", "Asif Iqbal", "Shamima Nasrin",
  "Sajjad Hossain", "Anika Tabassum", "Masud Rana", "Samira Haque", "Noman Siddiqui",
  "Ruma Akter", "Shahriar Kabir", "Ishrat Jahan", "Jahidul Islam", "Tarek Aziz",
  "Mehnaz Karim", "Rubel Mia", "Shorifa Khatun", "Naimur Rahman", "Zarin Tasnim",
  "Mahbubur Rahman", "Sultana Razia", "Shakil Ahmed", "Lubna Jahan", "Saiful Islam",
  "Shahinur Alam", "Tamanna Binte", "Mizanur Rahman", "Khadija Begum", "Enamul Haque",
  "Bipasha Sen", "Mustafizur Rahman", "Runa Laila", "Monir Hossain", "Pervin Akter"
];

const BD_LOCATIONS = [
  "Uttara, Dhaka", "Mirpur-10, Dhaka", "Dhanmondi, Dhaka", "Banani, Dhaka",
  "Badda, Dhaka", "Mohammadpur, Dhaka", "Gulshan-2, Dhaka", "Bashundhara R/A, Dhaka",
  "Motijheel, Dhaka", "Malibagh, Dhaka", "Khilgaon, Dhaka", "Chattogram GEC",
  "Agrabad, Chattogram", "Zindabazar, Sylhet", "Uposhohor, Rajshahi", "Boyra, Khulna",
  "Chashara, Narayanganj", "Tongi, Gazipur", "Kandirpar, Cumilla", "Jaleshwaritola, Bogura"
];

const CATEGORY_TEMPLATES = {
  "air-conditioner": {
    titles: [
      "Fast cooling & very low noise",
      "Saves electricity even in peak summer",
      "Original warranty card & quick installation",
      "Excellent inverter performance",
      "Value for money AC from Rango",
      "Smooth delivery inside Dhaka",
      "Sleep mode keeps room temperature perfect",
      "Best purchase for our master bedroom",
      "Air filter keeps the room fresh"
    ],
    comments: [
      "Using this {brand} AC for over a month now. Cools our bedroom within minutes and outdoor unit runs surprisingly quiet.",
      "Ordered from Rango Electronics with 0% EMI facility. Same-day delivery in Dhaka and official technician completed installation neatly.",
      "Very happy with the cooling power of {shortTitle}. Even during peak 38°C afternoons the airflow stays strong and consistent.",
      "Genuine official {brand} unit with sealed warranty papers. Electricity bill increase has been noticeably lower than our old non-inverter AC.",
      "Solid build quality and fast turbo cool mode. Customer care explained the warranty terms clearly before dispatch.",
      "Indoor LED display looks clean at night and sleep mode keeps the room comfortable without getting overly cold.",
      "Copper condenser quality feels premium. Remote control has good range and instant temperature response.",
      "100% genuine product. Tested with wattmeter, power consumption matches the official inverter specs."
    ]
  },
  "refrigerator": {
    titles: [
      "Spacious interior & rapid chilling",
      "Silent compressor operation",
      "Stylish finish fits our kitchen well",
      "Deep freezer freezes fast",
      "Authentic unit with brand warranty",
      "Delivered safely with zero scratches",
      "Keeps vegetables fresh for days",
      "Energy saving twin inverter"
    ],
    comments: [
      "The cooling uniformity in {shortTitle} keeps vegetables and fruits fresh much longer. Zero frost buildup in the compartment.",
      "Purchased this {brand} refrigerator for our family. Compressor barely makes any sound and door seals feel thick and sturdy.",
      "Rango delivery team carried it carefully up to our floor and unboxed it for physical inspection before signing off.",
      "Lots of bottle racks and large vegetable crisper space inside. Power consumption is very economical on inverter mode.",
      "Genuine {brand} official product with proper VAT invoice and 10-year compressor warranty card.",
      "Color and glass door finish look luxury in person. Cools water bottles fast even when loaded after grocery shopping.",
      "Freezer section is surprisingly deep and ice trays freeze within 90 minutes on quick freeze mode."
    ]
  },
  "television": {
    titles: [
      "Sharp picture quality & rich colors",
      "Loud clear speakers for living room",
      "Smooth Google TV apps & WiFi",
      "Great brightness and wide viewing angle",
      "Original {brand} 4K TV at best price",
      "Wall mount setup was super smooth",
      "Vibrant HDR10 display for movies"
    ],
    comments: [
      "Watching cricket and YouTube 4K on {shortTitle} looks super crisp. Google TV OS response is quick without lag.",
      "Bought this {brand} TV via Rango Electronics. Picture contrast and Dolby sound easily fill a medium living room.",
      "Screen casting from mobile phone and HDMI ports work flawlessly with gaming console. Packaging arrived factory sealed.",
      "Colors look natural out of the box without washing out. Great deal compared to local market showrooms.",
      "Dual band WiFi stays stable and built-in speakers have clear dialogue for news and drama series.",
      "Very thin bezel and premium modern aesthetics. Rango support confirmed official warranty registration right away."
    ]
  },
  "washing-machine": {
    titles: [
      "Super quiet spin & clean wash",
      "Huge time saver for our family",
      "Gentle on delicate fabric",
      "Low vibration even at high RPM",
      "Reliable {brand} quality",
      "Fast delivery & demo support",
      "Pillow drum protects clothes"
    ],
    comments: [
      "Using {shortTitle} almost every day now. Clothes come out squeaky clean and almost 80% dry after the spin cycle.",
      "Barely vibrates during spin mode once leveled properly. Water and detergent consumption feels very economical.",
      "Bought from Rango Electronics on 0% bank EMI. Very helpful phone support helped us pick the right drum capacity.",
      "Multiple wash programs work great for cottons, baby clothes, and heavy bedsheets. Digital timer and child lock are very handy.",
      "Authentic {brand} machine with sealed accessories and inlet hose included inside the box.",
      "Installation was straightforward and the inverter motor runs smoothly without loud banging sounds."
    ]
  },
  "microwave-oven": {
    titles: [
      "Heats evenly and super fast",
      "Easy touch panel for daily use",
      "Compact yet spacious turntable",
      "Great for grilling & baking snacks",
      "Sturdy build & clean design",
      "Auto cook menus are very convenient"
    ],
    comments: [
      "Using {shortTitle} daily for reheating, defrosting, and quick cooking. Heats food evenly without cold spots.",
      "Very intuitive buttons so everyone at home can operate it easily. Interior wipes clean in seconds.",
      "Genuine {brand} microwave delivered within 24 hours in Dhaka with intact packaging and official warranty card.",
      "Quiet turntable motor and solid door latch. Definitely worth the price for a busy kitchen.",
      "Pre-set menu options save time every morning. Glass tray feels thick and durable."
    ]
  },
  "water-purifiers": {
    titles: [
      "Water tastes crisp & clean",
      "Smooth RO flow & compact design",
      "Free installation was very helpful",
      "Peace of mind for family health",
      "Reliable multi-stage filtration"
    ],
    comments: [
      "After installing {shortTitle}, water taste improved dramatically with zero odor. TDS reading dropped right where it should be.",
      "Technician installed it neatly under our kitchen sink and explained when to service the sediment and RO cartridges.",
      "Tank capacity is plenty for our family and auto shut-off works quietly when full.",
      "Original {brand} purifier with complete filter kit and warranty card from Rango Electronics.",
      "Noticeably cleaner tea and cooking water since day one. Smooth customer service experience."
    ]
  },
  "geyser-water-heaters": {
    titles: [
      "Heats water quickly in winter",
      "Holds temperature well overnight",
      "Safe auto cut-off thermostat",
      "Compact wall fit for bathroom",
      "Great {brand} build quality"
    ],
    comments: [
      "Installed {shortTitle} before winter and hot water is ready within minutes every morning. Thermostat cuts off reliably.",
      "Insulation retains warm water for hours without constantly turning on the heating element.",
      "Delivered safely to our home with mounting bracket and safety valve included inside the carton.",
      "Compact body fits cleanly above the shower corner and runs with zero leakage.",
      "Official {brand} warranty card was stamped cleanly. Happy with both price and quick delivery."
    ]
  },
  "home-appliance": {
    titles: [
      "Strong motor & everyday durability",
      "Essential appliance at fair price",
      "Genuine {brand} product",
      "Works smoothly out of the box",
      "Fast delivery from Rango"
    ],
    comments: [
      "Been using {shortTitle} regularly at home and performance has been consistently strong without overheating.",
      "Build quality feels much sturdier than generic local options. Delivered sealed with warranty card.",
      "Handles tough daily cooking tasks easily and cleans up fast after use. Great value from Rango Electronics.",
      "Ordered online in the afternoon and received it promptly next day with proper invoice.",
      "Solid {brand} reliability, quiet operation, and neat finish that looks good on the counter."
    ]
  },
  "service-repair": {
    titles: [
      "Skilled & punctual technician",
      "Solved cooling issue on first visit",
      "Transparent service charge",
      "Neat work without mess",
      "Recommended Rango service team"
    ],
    comments: [
      "Booked {shortTitle} through Rango Electronics. Technician arrived on schedule with proper tools and tested everything thoroughly.",
      "Very polite engineer, diagnosed the exact fault instead of guessing, and shared clear pricing upfront.",
      "Accomplished the job cleanly and checked gas pressure and wiring safety before leaving."
    ]
  }
};

const STORE_REPLIES = [
  "ধন্যবাদ! রঙ্গ ইলেকট্রনিক্স (Rango Electronics) থেকে ১০০% আসল পণ্য বেছে নেওয়ার জন্য আপনাকে ধন্যবাদ। যেকোনো প্রয়োজনে আমাদের হটলাইন +88 01798-565001 এ যোগাযোগ করতে পারেন।",
  "আপনার ইতিবাচক পর্যালোচনার জন্য আন্তরিক ধন্যবাদ! আমরা সবসময় অফিশিয়াল ব্র্যান্ড ওয়ারেন্টি সহ বেস্ট সার্ভিস প্রদানে প্রতিশ্রুতিবদ্ধ।",
  "ধন্যবাদ আপনার চমৎকার ফিডব্যাকের জন্য! পণ্যটি আপনার পছন্দ হওয়ায় আমরা আনন্দিত। শুভকামনা!",
  "Thanks for choosing Rango Electronics! We are delighted to know that you are satisfied with your purchase."
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function createRng(seed) {
  let state = seed || 1;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function run() {
  const prodFilePath = path.join(process.cwd(), 'src/data/products.ts');
  const code = fs.readFileSync(prodFilePath, 'utf8');

  const marker = 'export const PRODUCTS: Product[] = ';
  const idx = code.indexOf(marker);
  const prefix = code.slice(0, idx + marker.length);
  const jsonStr = code.slice(idx + marker.length).trim().replace(/;\s*$/, '');
  const products = eval(jsonStr);

  console.log(`Processing reviews for ${products.length} products...`);

  // Fix 4 broken electronicsbangladesh images with high-res valid assets
  for (const p of products) {
    if (p.id === 'eb-ac-1' || p.id === 'eb-ac-12') {
      p.thumbnail = 'https://d2ttkd7jwwn4uz.cloudfront.net/public/media/602/GS-12XSMA4VBA.png';
      p.images = [
        'https://d2ttkd7jwwn4uz.cloudfront.net/public/media/602/GS-12XSMA4VBA.png',
        'https://d2ttkd7jwwn4uz.cloudfront.net/public/media/605/GS-18XSMA4VBA.png'
      ];
    } else if (p.id === 'eb-ac-8') {
      p.thumbnail = 'https://d2ttkd7jwwn4uz.cloudfront.net/public/media/605/GS-18XSMA4VBA.png';
      p.images = ['https://d2ttkd7jwwn4uz.cloudfront.net/public/media/605/GS-18XSMA4VBA.png'];
    } else if (p.id === 'eb-ac-18') {
      p.thumbnail = 'https://image.haier.com/bd/commercial-air-conditioners/W020250915659271322622_600.png';
      p.images = ['https://image.haier.com/bd/commercial-air-conditioners/W020250915659271322622_600.png'];
    }
  }

  const allDbReviews = [];
  const anchorMs = Date.UTC(2026, 10, 15, 12, 0, 0);

  for (let pIdx = 0; pIdx < products.length; pIdx++) {
    const p = products[pIdx];
    const seed = hashString(p.id || p.title || String(pIdx));
    const rand = createRng(seed);

    // USER REQUIREMENT: STRICTLY BETWEEN 30 AND 70 REVIEWS PER PRODUCT!
    const targetCount = 30 + (seed % 41); // 30 to 70 inclusive

    const catKey = (p.category || 'home-appliance').toLowerCase();
    const tpl = CATEGORY_TEMPLATES[catKey] || CATEGORY_TEMPLATES['home-appliance'];
    const brand = p.brand || 'Official Brand';
    const shortTitle = p.title.split('|')[0].trim().slice(0, 40);

    const candidateImgs = [...(p.images || []), p.thumbnail]
      .filter(s => s && !s.includes('logo.png') && !s.includes('placeholder'));

    const reviews = [];

    for (let i = 0; i < targetCount; i++) {
      const nameIdx = Math.floor(rand() * REVIEWER_NAMES.length);
      const locIdx = Math.floor(rand() * BD_LOCATIONS.length);
      const titleTpl = tpl.titles[Math.floor(rand() * tpl.titles.length)];
      const commentTpl = tpl.comments[Math.floor(rand() * tpl.comments.length)];

      const title = titleTpl.replace(/\{brand\}/g, brand);
      const comment = commentTpl.replace(/\{brand\}/g, brand).replace(/\{shortTitle\}/g, shortTitle);

      // Realistic rating: 85% chance 5-star, 15% chance 4-star
      const rating = rand() < 0.15 ? 4 : 5;

      // Stagger dates from 1 day ago to 280 days ago
      const daysAgo = i === 0 ? 1 : i === 1 ? 3 : Math.floor(rand() * 280) + 2;
      const dateStr = new Date(anchorMs - daysAgo * 86400000).toISOString().split('T')[0];

      // Optional admin reply on ~15%
      const adminReply = rand() < 0.15 ? STORE_REPLIES[Math.floor(rand() * STORE_REPLIES.length)] : undefined;

      // Review images on ~20% of reviews
      const reviewImages = (candidateImgs.length > 0 && rand() < 0.20) ? [candidateImgs[i % candidateImgs.length]] : [];

      const revRecord = {
        id: `rev-${p.id}-${i + 1}`,
        userName: REVIEWER_NAMES[nameIdx],
        userLocation: BD_LOCATIONS[locIdx],
        rating,
        date: dateStr,
        title,
        comment,
        verified: true,
        verifiedPurchase: true,
        verifiedBuyer: true,
        adminReply,
        images: reviewImages
      };

      reviews.push(revRecord);

      allDbReviews.push({
        id: `rev-${p.id}-${i + 1}`,
        productId: p.id,
        productTitle: p.title,
        userName: REVIEWER_NAMES[nameIdx],
        customerName: REVIEWER_NAMES[nameIdx],
        customerLocation: BD_LOCATIONS[locIdx],
        rating,
        title,
        comment,
        images: reviewImages,
        status: 'Approved',
        verifiedPurchase: true,
        adminReply,
        createdAt: new Date(anchorMs - daysAgo * 86400000).toISOString()
      });
    }

    p.reviews = reviews;
    p.rating = 4.9;
    p.ratingCount = targetCount;
    p.reviewsCount = targetCount;
  }

  console.log(`Generated ${allDbReviews.length} total approved reviews across ${products.length} products!`);
  console.log(`Sample product review count: ${products[0].reviews.length}, title: ${products[0].title}`);

  // Save back to products.ts
  const newContent = `${prefix}${JSON.stringify(products, null, 2)};\n`;
  fs.writeFileSync(prodFilePath, newContent, 'utf8');
  console.log('Saved updated products.ts with reviews!');

  // Save admin reviews
  const reviewsJsonPath = path.join(process.cwd(), 'data/admin-reviews.json');
  fs.writeFileSync(reviewsJsonPath, JSON.stringify(allDbReviews, null, 2), 'utf8');
  console.log('Saved data/admin-reviews.json!');

  // Sync admin-db.json
  const adminDbPath = path.join(process.cwd(), 'data/admin-db.json');
  if (fs.existsSync(adminDbPath)) {
    const adminDb = JSON.parse(fs.readFileSync(adminDbPath, 'utf8'));
    adminDb.reviews = allDbReviews;
    fs.writeFileSync(adminDbPath, JSON.stringify(adminDb, null, 2), 'utf8');
    console.log('Synchronized data/admin-db.json!');
  }
}

run();
