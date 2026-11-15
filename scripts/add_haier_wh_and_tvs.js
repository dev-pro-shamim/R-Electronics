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

const WH_TITLES = [
  "Heats water quickly in winter",
  "Holds temperature well overnight",
  "Safe auto cut-off thermostat",
  "Compact wall fit for bathroom",
  "Great Haier build quality",
  "Shock-proof body and energy efficient",
  "Fast heating element & reliable insulation",
  "Original warranty card & prompt delivery"
];

const WH_COMMENTS = [
  "Installed {shortTitle} before winter and hot water is ready within minutes every morning. Thermostat cuts off reliably.",
  "Insulation retains warm water for hours without constantly turning on the heating element. Electricity bill is very reasonable.",
  "Delivered safely to our home with mounting bracket and safety valve included inside the carton. Official Haier warranty card stamped.",
  "Compact body fits cleanly on bathroom wall with zero leakage. Shock-proof protection gives complete peace of mind for family.",
  "Using this Haier water heater for our master bathroom. Heating speed is impressive even on freezing mornings.",
  "Original Haier geyser from Rango Electronics. Prompt delivery and customer care assisted with installation guidelines."
];

const TV_TITLES = [
  "Sharp picture quality & rich colors",
  "Loud clear speakers for living room",
  "Smooth Google TV apps & fast WiFi",
  "Great brightness and wide viewing angle",
  "Original Haier 4K TV at best price",
  "Wall mount setup was super smooth",
  "Vibrant HDR & bezel-less modern display",
  "Fluid 120Hz refresh rate and zero lag"
];

const TV_COMMENTS = [
  "Watching 4K movies and cricket matches on {shortTitle} looks stunningly vibrant. Google TV interface runs snappy without any lag.",
  "Bought this Haier TV through Rango Electronics. Picture contrast is deep and audio easily fills our medium-sized living room.",
  "Screen mirroring from mobile and HDMI ports work seamlessly with our soundbar and gaming console. Packaging was factory sealed.",
  "Colors look natural and crisp right out of the box. 10% discount on official MRP made it the best deal in the market.",
  "Dual-band WiFi stays stable for 4K streaming and the remote voice search recognizes commands accurately.",
  "Bezel-less metallic finish gives an ultra-premium look on our wall. Rango support confirmed the warranty registration immediately."
];

const STORE_REPLIES = [
  "ধন্যবাদ! রঙ্গ ইলেকট্রনিক্স (Rango Electronics) থেকে ১০০% আসল Haier পণ্য বেছে নেওয়ার জন্য আপনাকে ধন্যবাদ। যেকোনো প্রয়োজনে আমাদের হটলাইন +88 01798-565001 এ যোগাযোগ করতে পারেন।",
  "আপনার ইতিবাচক পর্যালোচনার জন্য আন্তরিক ধন্যবাদ! আমরা সবসময় অফিশিয়াল ব্র্যান্ড ওয়ারেন্টি সহ বেস্ট সার্ভিস প্রদানে প্রতিশ্রুতিবদ্ধ।",
  "ধন্যবাদ আপনার চমৎকার ফিডব্যাকের জন্য! পণ্যটি আপনার পছন্দ হওয়ায় আমরা আনন্দিত। শুভকামনা!",
  "Thanks for choosing Rango Electronics! We are delighted to know that you are satisfied with your purchase."
];

const TARGET_PRODUCTS = [
  // 6 Water Heaters
  {
    type: 'wh',
    model: 'ES30H-CK3 (BD)',
    material: 'GA0SJHE00',
    capacity: '30L',
    mrp: 13300,
    url: 'https://www.haier.com/bd/water-heaters/es30h-ck3-bd-.shtml',
    cat: 'geyser-water-heaters',
    subcat: 'haier-geyser-water-heaters'
  },
  {
    type: 'wh',
    model: 'ES40H-CK3(BD)',
    material: 'GA0G8WE00',
    capacity: '40L',
    mrp: 14800,
    url: 'https://www.haier.com/bd/water-heaters/es40h-ck3-bd-.shtml',
    cat: 'geyser-water-heaters',
    subcat: 'haier-geyser-water-heaters'
  },
  {
    type: 'wh',
    model: 'ES50H-CK3(BD)',
    material: 'GA0G8VE00',
    capacity: '50L',
    mrp: 16300,
    url: 'https://www.haier.com/bd/water-heaters/es50h-ck3-bd-.shtml',
    cat: 'geyser-water-heaters',
    subcat: 'haier-geyser-water-heaters'
  },
  {
    type: 'wh',
    model: 'ES35H-Tigris',
    material: 'GA0UM0E04',
    capacity: '35L',
    mrp: 13800,
    url: 'https://www.haier.com/bd/water-heaters/es35h-tigris.shtml',
    cat: 'geyser-water-heaters',
    subcat: 'haier-geyser-water-heaters'
  },
  {
    type: 'wh',
    model: 'ES45H-Tigris',
    material: 'GA0UM1E04',
    capacity: '45L',
    mrp: 15500,
    url: 'https://www.haier.com/bd/water-heaters/es45h-tigris.shtml',
    cat: 'geyser-water-heaters',
    subcat: 'haier-geyser-water-heaters'
  },
  {
    type: 'wh',
    model: 'ES30V-Tigris',
    material: 'GA0UAAE02',
    capacity: '30L',
    mrp: 14300,
    url: 'https://www.haier.com/bd/water-heaters/es30v-tigris.shtml',
    cat: 'geyser-water-heaters',
    subcat: 'haier-geyser-water-heaters'
  },

  // 16 TVs
  {
    type: 'tv',
    size: 32,
    model: 'H32S80GFX',
    material: 'DH20H5Z01',
    spec: 'QLED FHD Google TV',
    mrp: 35900,
    url: 'https://www.haier.com/bd/tvs/h32s80gfx.shtml',
    cat: 'television',
    subcat: '32-inch'
  },
  {
    type: 'tv',
    size: 43,
    model: 'H43S80GFX',
    material: 'DH20GCZ01',
    spec: 'QLED FHD Google TV, 1G+8G',
    mrp: 46900,
    url: 'https://www.haier.com/bd/tvs/h43s80gfx.shtml',
    cat: 'television',
    subcat: '43-inch'
  },
  {
    type: 'tv',
    size: 43,
    model: 'H43S80GUX',
    material: 'DH20QEZ00',
    spec: 'QLED 4K Google TV, 2G+32G',
    mrp: 57900,
    url: 'https://www.haier.com/bd/tvs/h43s80gux.shtml',
    cat: 'television',
    subcat: '43-inch'
  },
  {
    type: 'tv',
    size: 43,
    model: '43P7 PRO',
    material: 'DH20P7Z00',
    spec: 'HQLED, Google TV, 2G+32G, Hands Free Voice',
    mrp: 62900,
    url: 'https://www.haier.com/bd/tvs/43p7pro.shtml',
    cat: 'television',
    subcat: '43-inch'
  },
  {
    type: 'tv',
    size: 43,
    model: 'H43S85GUX',
    material: 'DH20P8Z00',
    spec: 'QLED, 120Hz, Hands Free, 2G+32G',
    mrp: 63900,
    url: 'https://www.haier.com/bd/tvs/43s85gux.shtml',
    cat: 'television',
    subcat: '43-inch'
  },
  {
    type: 'tv',
    size: 50,
    model: '50P7 PRO',
    material: 'DH20N8Z00',
    spec: 'HQLED, Google TV, 2G+32G, Hands Free Voice',
    mrp: 76900,
    url: 'https://www.haier.com/bd/tvs/50p7pro.shtml',
    cat: 'television',
    subcat: '50-inch'
  },
  {
    type: 'tv',
    size: 55,
    model: '55P7 PRO',
    material: 'DH20MGZ00',
    spec: 'HQLED, Google TV, 2G+32G, Hands Free Voice',
    mrp: 91900,
    url: 'https://www.haier.com/bd/tvs/55p7pro.shtml',
    cat: 'television',
    subcat: '55-inch'
  },
  {
    type: 'tv',
    size: 55,
    model: 'H55S85GUX',
    material: 'DH20MHZ00',
    spec: 'QLED, 120Hz, Hands Free, 2G+32G',
    mrp: 92900,
    url: 'https://www.haier.com/bd/tvs/55s85gux.shtml',
    cat: 'television',
    subcat: '55-inch'
  },
  {
    type: 'tv',
    size: 65,
    model: '65P7 PRO',
    material: 'DH20LJZ00',
    spec: 'HQLED, Google TV, 2G+32G, Hands Free Voice',
    mrp: 123900,
    url: 'https://www.haier.com/bd/tvs/65p7pro.shtml',
    cat: 'television',
    subcat: '65-inch'
  },
  {
    type: 'tv',
    size: 65,
    model: 'H65S85GUX',
    material: 'DH20LKZ00',
    spec: 'QLED, 120Hz, Hands Free, 2G+32G',
    mrp: 124900,
    url: 'https://www.haier.com/bd/tvs/65s85gux.shtml',
    cat: 'television',
    subcat: '65-inch'
  },
  {
    type: 'tv',
    size: 75,
    model: '75P7 PRO',
    material: 'DH20KJZ00',
    spec: 'HQLED, Google TV, 2G+32G, Hands Free Voice',
    mrp: 164900,
    url: 'https://www.haier.com/bd/tvs/75p7pro.shtml',
    cat: 'television',
    subcat: '75-inch'
  },
  {
    type: 'tv',
    size: 55,
    model: 'H55M80GUX',
    material: 'DH210FZ00',
    spec: 'MiniLED, 120Hz, KEF Sound',
    mrp: 109900,
    url: 'https://www.haier.com/bd/tvs/h55m80gux.shtml',
    cat: 'television',
    subcat: '55-inch'
  },
  {
    type: 'tv',
    size: 65,
    model: 'H65M80GUX',
    material: 'DH20ZEZ00',
    spec: 'MiniLED, 120Hz, KEF Sound',
    mrp: 145900,
    url: 'https://www.haier.com/bd/tvs/h65m80gux.shtml',
    cat: 'television',
    subcat: '65-inch'
  },
  {
    type: 'tv',
    size: 75,
    model: 'H75M80GUX',
    material: 'DH20YEZ00',
    spec: 'MiniLED, 120Hz, KEF Sound',
    mrp: 197900,
    url: 'https://www.haier.com/bd/tvs/h75m80gux.shtml',
    cat: 'television',
    subcat: '75-inch'
  },
  {
    type: 'tv',
    size: 85,
    model: 'H85M80GUX',
    material: 'DH20XBZ00',
    spec: 'MiniLED, 120Hz, KEF Sound',
    mrp: 259900,
    url: 'https://www.haier.com/bd/tvs/h85m80gux.shtml',
    cat: 'television',
    subcat: '85-inch'
  },
  {
    type: 'tv',
    size: 100,
    model: 'H100S90FUX',
    material: 'DH20EME00',
    spec: 'MiniLED, 144Hz, 55W KEF Sound',
    mrp: 499900,
    url: 'https://www.haier.com/bd/tvs/h100s90fux.shtml',
    cat: 'television',
    subcat: '100-inch-tv'
  }
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

async function scrapeAndBuildProducts() {
  console.log(`Starting extraction for ${TARGET_PRODUCTS.length} Haier products...`);

  const anchorMs = Date.UTC(2026, 10, 15, 12, 0, 0);
  const newProducts = [];
  const newReviews = [];

  for (let i = 0; i < TARGET_PRODUCTS.length; i++) {
    const item = TARGET_PRODUCTS[i];
    const discountedPrice = Math.round(item.mrp * 0.9); // 10% discount

    console.log(`[${i + 1}/${TARGET_PRODUCTS.length}] Fetching ${item.model} (${item.url})...`);
    let html = '';
    try {
      const res = await fetch(item.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      if (res.ok) {
        html = await res.text();
      }
    } catch (e) {
      console.warn(`Failed to fetch ${item.url}: ${e.message}`);
    }

    // Extract title
    const titleM = html.match(/<title>([^<]+)<\/title>/i);
    let scrapedTitle = titleM ? titleM[1].replace(/-Haier Bangladesh/i, '').trim() : '';
    if (!scrapedTitle) {
      scrapedTitle = item.type === 'wh'
        ? `Haier ${item.model} ${item.capacity} Water Heater`
        : `Haier ${item.model} ${item.size}" ${item.spec}`;
    }

    // Make clean, appealing title
    let displayTitle = scrapedTitle;
    if (!displayTitle.startsWith('Haier')) {
      displayTitle = `Haier ${displayTitle}`;
    }

    // Extract images
    const rawImgs = (html.match(/https:\/\/image\.haier\.com\/bd\/[^"'\s>]+\.(?:png|jpg|jpeg)/gi) || []);
    const validImgs = [...new Set(rawImgs)].filter(u => 
      !u.includes('header') && !u.includes('footer') && !u.includes('logo') && !u.includes('icon')
    );

    // Pick 600 or 1200 high-res gallery shots
    const galleryImgs = validImgs.filter(u => u.includes('_600.png') || u.includes('_1200_q.png') || u.includes('_800.'));
    const finalImgs = galleryImgs.length > 0 ? galleryImgs : validImgs.slice(0, 5);

    // Verify images with fetch to ensure HTTP 200
    const verifiedImgs = [];
    for (const imgUrl of finalImgs) {
      try {
        const check = await fetch(imgUrl);
        if (check.status === 200) {
          verifiedImgs.push(imgUrl);
        }
      } catch (err) {}
    }

    // Fallback if none verified
    if (verifiedImgs.length === 0) {
      if (item.type === 'wh') {
        verifiedImgs.push('https://image.haier.com/bd/water-heaters/W020260921657485130832_600.png');
      } else {
        verifiedImgs.push('https://image.haier.com/bd/tvs/W020260602545952383276_600.png');
      }
    }

    const thumbnail = verifiedImgs[0];

    // Specifications
    const specifications = [];
    if (item.type === 'wh') {
      specifications.push({
        group: 'Technical Specifications',
        items: [
          { key: 'Brand', value: 'Haier' },
          { key: 'Model', value: item.model },
          { key: 'Material Code', value: item.material },
          { key: 'Capacity', value: item.capacity },
          { key: 'Type', value: item.model.includes('(Horizontal)') || item.model.includes('ES30H') || item.model.includes('ES40H') || item.model.includes('ES50H') || item.model.includes('ES35H') || item.model.includes('ES45H') ? 'Horizontal Storage Water Heater' : 'Vertical Storage Water Heater' },
          { key: 'Heating Element', value: 'High Efficiency Enamel Coated Element' },
          { key: 'Rated Pressure', value: '8 Bar (Suitable for High-Rise Buildings)' },
          { key: 'Inner Tank', value: 'Ultra Micro Coated Ultra-Durable Steel Tank' },
          { key: 'Safety Protection', value: 'Shock-Proof Technology, Overheat & Pressure Protection' }
        ]
      });
    } else {
      specifications.push({
        group: 'Display & Audio',
        items: [
          { key: 'Brand', value: 'Haier' },
          { key: 'Model', value: item.model },
          { key: 'Material Code', value: item.material },
          { key: 'Screen Size', value: `${item.size} Inch` },
          { key: 'Display Type', value: item.spec },
          { key: 'Operating System', value: 'Google TV (Licensed with Play Store & Assistant)' },
          { key: 'Audio Output', value: item.spec.includes('KEF') ? 'KEF Tuned Premium Sound System (Dolby Atmos)' : '20W Stereo Speakers with Dolby Audio' },
          { key: 'Connectivity', value: 'Dual-Band Wi-Fi, Bluetooth 5.1, HDMI 2.1, USB, Ethernet' },
          { key: 'Special Features', value: item.spec.includes('Hands Free') ? 'Hands-Free Far-Field Voice Control, MEMC / 120Hz' : 'Google Assistant Voice Remote, HDR10' }
        ]
      });
    }

    // Slug and ID
    const cleanModelSlug = item.model.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const id = item.type === 'wh' ? `haier-wh-${cleanModelSlug}` : `haier-tv-${cleanModelSlug}`;
    const slug = `haier-${cleanModelSlug}-${item.type === 'wh' ? 'water-heater' : 'google-tv'}`;

    // Reviews Generation (strictly between 30 and 70 reviews)
    const seed = hashString(id);
    const rand = createRng(seed);
    const targetReviewCount = 30 + (seed % 41); // 30 to 70 inclusive

    const shortTitle = displayTitle.slice(0, 45);
    const revTitles = item.type === 'wh' ? WH_TITLES : TV_TITLES;
    const revComments = item.type === 'wh' ? WH_COMMENTS : TV_COMMENTS;

    const productReviews = [];

    for (let rIdx = 0; rIdx < targetReviewCount; rIdx++) {
      const nameIdx = Math.floor(rand() * REVIEWER_NAMES.length);
      const locIdx = Math.floor(rand() * BD_LOCATIONS.length);
      const titleTpl = revTitles[Math.floor(rand() * revTitles.length)];
      const commentTpl = revComments[Math.floor(rand() * revComments.length)];

      const title = titleTpl;
      const comment = commentTpl.replace(/\{shortTitle\}/g, shortTitle);

      const rating = rand() < 0.15 ? 4 : 5;
      const daysAgo = rIdx === 0 ? 1 : rIdx === 1 ? 3 : Math.floor(rand() * 280) + 2;
      const dateStr = new Date(anchorMs - daysAgo * 86400000).toISOString().split('T')[0];
      const adminReply = rand() < 0.15 ? STORE_REPLIES[Math.floor(rand() * STORE_REPLIES.length)] : undefined;
      const reviewImages = (verifiedImgs.length > 0 && rand() < 0.20) ? [verifiedImgs[rIdx % verifiedImgs.length]] : [];

      const reviewRecord = {
        id: `rev-${id}-${rIdx + 1}`,
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

      productReviews.push(reviewRecord);

      newReviews.push({
        id: `rev-${id}-${rIdx + 1}`,
        productId: id,
        productTitle: displayTitle,
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

    const shortDesc = item.type === 'wh'
      ? `Buy official ${displayTitle} with ${item.capacity} capacity at 10% discount from Rango Electronics. Shock-proof protection and official Haier warranty.`
      : `Buy authentic ${displayTitle} with ${item.spec} at 10% discount from Rango Electronics. Official Haier warranty and 0% EMI available.`;

    const fullDesc = `
      <p><strong>${displayTitle}</strong> is a 100% authentic Haier appliance available at <strong>Rango Electronics</strong> with official brand warranty, 10% promotional discount, and fast home delivery in Bangladesh.</p>
      <ul>
        <li><strong>Model:</strong> ${item.model} (${item.material})</li>
        <li><strong>Original MRP:</strong> ৳${item.mrp.toLocaleString()}</li>
        <li><strong>Special Discount Price:</strong> ৳${discountedPrice.toLocaleString()} (10% OFF)</li>
        <li><strong>Warranty:</strong> ${item.type === 'wh' ? '5 Years Tank Warranty, 2 Years Heating Element, 1 Year Spare Parts' : '4 Years Panel Warranty, 2 Years Parts, 2 Years Free Service'}</li>
        <li><strong>Delivery & Payment:</strong> Free Home Delivery in Dhaka, 0% EMI Available.</li>
      </ul>
    `.trim();

    const productObj = {
      id,
      slug,
      title: displayTitle,
      category: item.cat,
      subcategory: item.subcat,
      brand: 'Haier',
      model: item.model,
      sku: item.material,
      price: discountedPrice,
      originalPrice: item.mrp,
      discount: 10,
      rating: 4.9,
      ratingCount: targetReviewCount,
      inStock: true,
      stockCount: 15,
      badge: '10% OFF',
      thumbnail,
      images: verifiedImgs,
      shortDescription: shortDesc,
      description: fullDesc,
      specifications,
      warranty: item.type === 'wh'
        ? '5 Years Tank Warranty, 2 Years Heating Element, 1 Year Free Service'
        : '4 Years Panel Warranty, 2 Years Spare Parts, 2 Years Free Service',
      emiAvailable: true,
      emiStartingFrom: Math.round(discountedPrice / 12),
      freeDelivery: true,
      installationIncluded: item.type === 'wh',
      reviews: productReviews,
      reviewsCount: targetReviewCount
    };

    newProducts.push(productObj);
    console.log(`  Added: [${productObj.id}] ৳${productObj.price} (MRP: ৳${productObj.originalPrice}) | ${productObj.reviewsCount} reviews`);
  }

  console.log(`\nSuccessfully constructed ${newProducts.length} new products and ${newReviews.length} new approved reviews!`);

  // Merge into src/data/products.ts
  const prodFilePath = path.join(process.cwd(), 'src/data/products.ts');
  const code = fs.readFileSync(prodFilePath, 'utf8');
  const marker = 'export const PRODUCTS: Product[] = ';
  const idx = code.indexOf(marker);
  const prefix = code.slice(0, idx + marker.length);
  const jsonStr = code.slice(idx + marker.length).trim().replace(/;\s*$/, '');
  const existingProducts = eval(jsonStr);

  console.log(`Current product count: ${existingProducts.length}`);

  // Avoid duplicates if rerun
  const newIds = new Set(newProducts.map(p => p.id));
  const mergedProducts = existingProducts.filter(p => !newIds.has(p.id)).concat(newProducts);

  console.log(`New total product count: ${mergedProducts.length}`);

  fs.writeFileSync(prodFilePath, `${prefix}${JSON.stringify(mergedProducts, null, 2)};\n`, 'utf8');
  console.log('Saved src/data/products.ts!');

  // Merge into data/admin-reviews.json
  const revFilePath = path.join(process.cwd(), 'data/admin-reviews.json');
  let existingReviews = [];
  if (fs.existsSync(revFilePath)) {
    existingReviews = JSON.parse(fs.readFileSync(revFilePath, 'utf8'));
  }
  const mergedReviews = existingReviews.concat(newReviews);
  fs.writeFileSync(revFilePath, JSON.stringify(mergedReviews, null, 2), 'utf8');
  console.log(`Saved data/admin-reviews.json with ${mergedReviews.length} total reviews!`);

  // Merge into data/admin-db.json
  const dbFilePath = path.join(process.cwd(), 'data/admin-db.json');
  if (fs.existsSync(dbFilePath)) {
    const adminDb = JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
    adminDb.reviews = mergedReviews;
    fs.writeFileSync(dbFilePath, JSON.stringify(adminDb, null, 2), 'utf8');
    console.log('Synchronized data/admin-db.json!');
  }
}

scrapeAndBuildProducts();
