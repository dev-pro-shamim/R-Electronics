const fs = require('fs');
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '../src/data/products.ts');
let content = fs.readFileSync(PRODUCTS_FILE, 'utf8');

// Sample authentic Bangladeshi reviewers
const BANGLADESHI_REVIEWERS = [
  { name: 'Engr. Tariqul Islam', loc: 'Sector 4, Uttara, Dhaka' },
  { name: 'Dr. Saiful Bari', loc: 'Dhanmondi 27, Dhaka' },
  { name: 'Tanvir Ahmed', loc: 'Mirpur DOHS, Dhaka' },
  { name: 'Farhana Akter Chowdhury', loc: 'Nasirabad, Chittagong' },
  { name: 'Kazi Nazmul Hasan', loc: 'Upashahar, Sylhet' },
  { name: 'Md. Ashraful Alam', loc: 'Gulshan 2, Dhaka' },
  { name: 'Sharmin Sultana', loc: 'Bashundhara R/A, Dhaka' },
  { name: 'Mahmudul Haque', loc: 'Khulna Sadar, Khulna' },
  { name: 'Rashedul Karim', loc: 'Rajshahi City' },
  { name: 'Nusrat Jahan Shanta', loc: 'Mohammadpur, Dhaka' },
  { name: 'Anisur Rahman', loc: 'Kandirpar, Comilla' },
  { name: 'Sabbir Hossain', loc: 'Bogura Sadar' },
  { name: 'Kamrul Hasan Jewel', loc: 'Banani, Dhaka' },
  { name: 'Afroza Begum', loc: 'Shantinagar, Dhaka' },
  { name: 'Syed Moinuddin', loc: 'Halishahar, Chittagong' },
  { name: 'Jannatul Ferdous', loc: 'Zindabazar, Sylhet' },
  { name: 'Md. Zakir Hossain', loc: 'Malibagh, Dhaka' },
  { name: 'Nazmus Sakib', loc: 'Banasree, Dhaka' },
  { name: 'Sultana Razia', loc: 'Barisal Sadar' },
  { name: 'Farid Uddin Ahmed', loc: 'Agrabad, Chittagong' }
];

const REVIEW_COMMENTS = [
  'অসাধারণ অরিজিনাল প্রোডাক্ট! ইনটেক সিল্ড বক্সে পেয়েছি এবং ওয়ারেন্টি কার্ড পূরণ করে দেওয়া হয়েছে। ২৪ ঘণ্টার মধ্যে ডেলিভারি পেয়েছি।',
  '100% authentic product. Delivery in Dhaka was very fast. The packaging was top-notch with original manufacturer warranty.',
  'র্যাঙ্গো ইলেকট্রনিক্স থেকে সিটি ব্যাংক অ্যামেক্স কার্ডে ০% ইএমআইতে নিলাম। কোনো হিডেন চার্জ ছাড়াই স্মুথ প্রসেসিং ছিল। হাইলি রিকমেন্ডেড!',
  'Product quality is superb! Picture and sound quality exceeded my expectation. Very polite delivery staff.',
  'আলহামদুলিল্লাহ, খুব ভালো একটা প্রোডাক্ট। ব্যবহারের পর রিভিউ দিচ্ছি। বিদ্যুৎ খরচ খুবই কম এবং পারফরম্যান্স দারুণ।',
  'Original product with valid serial number verified on official website. Best price in Bangladesh!',
  'অফিসিয়াল শোরুম থেকে নেওয়ার মতো সেম এক্সপেরিয়েন্স। ফ্রি ডেলিভারি ও প্রফেশনাল ইনস্টলেশন সাপোর্ট পেয়েছি।',
  'Excellent build quality and sleek design. Delivery guy came right on time and unboxed in front of me.',
  'র্যাঙ্গো ইলেকট্রনিক্স সার্ভিস অনেক বিশ্বস্ত। অনলাইনে এত ভালো ও জেনুইন সার্ভিস পেয়ে সত্যিই মুগ্ধ।',
  'Got it during the promotional sale. Total value for money. Warranty papers were properly stamped.',
  'Great performance and energy efficient. The cooling/heating speed is remarkable. 5 star rating!',
  'অর্ডার করার পরের দিনই পেয়েছি। প্রোডাক্টের ফিনিশিং এবং ম্যাটেরিয়াল কোয়ালিটি প্রিমিয়াম।',
  'Very satisfied with Rango Electronics. Clear communication and hassle-free transaction.',
  'The official warranty gives total peace of mind. Excellent after-sales service response.',
  'Original unit with all accessories sealed in box. Thank you Rango Electronics team!',
  'Price was much better compared to other retail stores. Definitely buying from here again.',
  'Sound quality and display sharpness are exceptional. Best decision to buy this model.',
  'প্যাকেজিং অত্যন্ত মজবুত ছিল। কোনো ধরনের ত্রুটি নেই। ব্যবহারের অভিজ্ঞতা দারুণ।',
  'Seamless shopping experience with 0% EMI. Highly recommended to everyone.',
  'Genuine official product. Customer care was very responsive on WhatsApp.'
];

const DATES = [
  '2 Nov 2026', '28 Oct 2026', '24 Oct 2026', '19 Oct 2026', '15 Oct 2026',
  '11 Oct 2026', '7 Oct 2026', '2 Oct 2026', '27 Sep 2026', '22 Sep 2026',
  '18 Sep 2026', '14 Sep 2026', '9 Sep 2026', '4 Sep 2026', '30 Aug 2026',
  '24 Aug 2026', '19 Aug 2026', '14 Aug 2026', '9 Aug 2026', '3 Aug 2026'
];

// Read PRODUCTS array from products.ts
const match = content.match(/export const PRODUCTS: Product\[\] = (\[[\s\S]*\]);/);
if (!match) {
  console.error('Could not find PRODUCTS array!');
  process.exit(1);
}

const products = JSON.parse(match[1]);
console.log('Found products:', products.length);

// Update each product's reviews
products.forEach((p, idx) => {
  // Give between 13 to 20 reviews for each product
  const count = 13 + ((idx * 3) % 8); // 13, 16, 19, 14, 17, 20...
  p.reviewsCount = count;

  const reviews = [];
  for (let i = 0; i < count; i++) {
    const reviewer = BANGLADESHI_REVIEWERS[(idx + i) % BANGLADESHI_REVIEWERS.length];
    const comment = REVIEW_COMMENTS[(idx + i * 2) % REVIEW_COMMENTS.length];
    const date = DATES[i % DATES.length];
    const rating = (i % 7 === 0) ? 4 : 5; // Mostly 5 stars, occasional 4 stars

    // Some reviews have uploaded customer photos (using product image or unboxed view)
    const hasPhoto = (i === 1 || i === 4 || i === 8) && p.images && p.images.length > 0;
    const reviewImages = hasPhoto ? [p.images[i % p.images.length]] : [];

    reviews.push({
      id: `rev-${p.id}-${i + 1}`,
      userName: reviewer.name,
      userLocation: reviewer.loc,
      rating: rating,
      date: date,
      comment: comment,
      verifiedBuyer: true,
      images: reviewImages
    });
  }

  p.reviews = reviews;
});

// Update Review interface in products.ts if needed
if (!content.includes('images?: string[];')) {
  content = content.replace(
    'verifiedBuyer: boolean;',
    'verifiedBuyer: boolean;\n  images?: string[];'
  );
}

// Replace PRODUCTS array
content = content.replace(
  /export const PRODUCTS: Product\[\] = \[[\s\S]*\];/,
  `export const PRODUCTS: Product[] = ${JSON.stringify(products, null, 2)};`
);

fs.writeFileSync(PRODUCTS_FILE, content, 'utf8');
console.log('Successfully updated all products with 13-20 verified Bangladeshi customer reviews!');
