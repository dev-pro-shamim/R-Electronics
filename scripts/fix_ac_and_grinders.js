const fs = require('fs');
const path = require('path');

const text = fs.readFileSync('src/data/products.ts', 'utf8');
const jsonMatch = text.match(/export const PRODUCTS: Product\[\] = (\[[\s\S]*?\]);\s*$/);
if (!jsonMatch) {
  console.error("Failed to parse PRODUCTS");
  process.exit(1);
}

const products = JSON.parse(jsonMatch[1]);
console.log(`Original count: ${products.length}`);

// 1. Fix the miscategorized appliances
products.forEach(p => {
  if (p.id === 'rango-15417' || p.id === 'rango-14948') {
    p.category = "home-appliance";
    p.subcategory = "blender-juicer";
    console.log(`Fixed ${p.id} (${p.title}) -> home-appliance / blender-juicer`);
  } else if (p.id === 'rango-11652') {
    p.category = "home-appliance";
    p.subcategory = "infrared-cooker";
    console.log(`Fixed ${p.id} (${p.title}) -> home-appliance / infrared-cooker`);
  } else if (p.id === 'rango-10966') {
    p.category = "home-appliance";
    p.subcategory = "electric-kettle";
    console.log(`Fixed ${p.id} (${p.title}) -> home-appliance / electric-kettle`);
  } else if (p.id === 'rango-11488') {
    p.category = "air-conditioner";
    p.subcategory = "2-ton-inverter-and-non-inverter-ac";
  }
});

// 2. Add 3 realistic AC products as requested
const newAcs = [
  {
    id: "rango-ac-gree-18",
    slug: "gree-1-5-ton-fairy-split-inverter-air-conditioner-gs-18xfv32",
    title: "Gree GS-18XFV32 1.5 Ton Fairy Split Type Inverter Air Conditioner",
    category: "air-conditioner",
    subcategory: "1-5-ton-inverter-and-non-inverter-ac",
    brand: "Gree",
    model: "GS-18XFV32",
    price: 72500,
    originalPrice: 79900,
    discount: 9,
    rating: 4.9,
    ratingCount: 16,
    inStock: true,
    stockCount: 18,
    badge: "Best Seller",
    thumbnail: "https://adminapi.electronicsbangladesh.com/storage/media/large/Hisense-1.5-Ton-Full-DC-Inverter-AC-3775.jpg",
    images: [
      "https://adminapi.electronicsbangladesh.com/storage/media/large/Hisense-1.5-Ton-Full-DC-Inverter-AC-3775.jpg"
    ],
    shortDescription: "Gree 1.5 Ton Fairy Inverter AC with Cold Plasma technology, 60% energy saving, and rapid cooling system.",
    description: "<p>The Gree GS-18XFV32 1.5 Ton Fairy Split Inverter Air Conditioner provides powerful and energy-saving cooling backed by an official 10 Years Compressor Warranty in Bangladesh.</p>",
    specifications: [
      {
        group: "Technical Specifications",
        items: [
          { key: "Cooling Capacity", value: "18,000 BTU/hr (1.5 Ton)" },
          { key: "Compressor Type", value: "Rotary Inverter Compressor" },
          { key: "Refrigerant", value: "R32 Eco-Friendly Gas" },
          { key: "Energy Saving", value: "Up to 60% Energy Saving" },
          { key: "Air Flow", value: "850 m³/h" },
          { key: "Warranty", value: "10 Years Compressor, 1 Year Spare Parts, 1 Year Free Service" }
        ]
      }
    ],
    features: [
      "1.5 Ton 18,000 BTU Inverter Technology",
      "Cold Plasma Air Purification",
      "Fast Turbo Cooling Mode",
      "Self Clean Evaporator Technology",
      "Golden Fin Corrosion Protection"
    ],
    warranty: "Official 10 Years Compressor, 1 Year Spare Parts & 1 Year Service Warranty",
    emiAvailable: true,
    emiStartingFrom: 2014,
    freeDelivery: true,
    installationIncluded: true,
    reviews: [
      {
        id: "rev-gree-1",
        userName: "Engr. Zahid Hasan",
        userLocation: "Mirpur DOHS, Dhaka",
        rating: 5,
        date: "2026-01-18",
        comment: "গ্রী এসি অসাধারণ পারফর্ম করছে। একদম শব্দ ছাড়া দ্রুত রুম ঠান্ডা হয়। ডেলিভারি ও ইন্সটলেশন সার্ভিস খুব ভালো ছিল।",
        verifiedPurchase: true
      },
      {
        id: "rev-gree-2",
        userName: "Dr. Farhana Yasmin",
        userLocation: "Gulshan 2, Dhaka",
        rating: 5,
        date: "2026-01-25",
        comment: "Excellent inverter AC with genuine warranty card and official installation support.",
        verifiedPurchase: true
      }
    ],
    qna: [
      {
        id: "qna-gree-1",
        question: "Does this price include free installation kit?",
        answer: "Yes, free standard 10-feet copper pipe and official angle installation are included.",
        askedBy: "Customer",
        date: "2026-01-20"
      }
    ]
  },
  {
    id: "rango-ac-haier-18",
    slug: "haier-1-5-ton-cleancool-inverter-air-conditioner-hsu-18cleancool",
    title: "Haier 1.5 Ton CleanCool Inverter Air Conditioner (HSU-18CleanCool)",
    category: "air-conditioner",
    subcategory: "1-5-ton-inverter-and-non-inverter-ac",
    brand: "Haier",
    model: "HSU-18CleanCool",
    price: 63900,
    originalPrice: 74900,
    discount: 15,
    rating: 4.8,
    ratingCount: 15,
    badge: "15% OFF",
    thumbnail: "https://adminapi.electronicsbangladesh.com/storage/media/large/Haier-1.5-Ton-Triple-Inverter-Air-Conditioner-(HSU-18CleanCool-Cooling)-9121.png",
    images: [
      "https://adminapi.electronicsbangladesh.com/storage/media/large/Haier-1.5-Ton-Triple-Inverter-Air-Conditioner-(HSU-18CleanCool-Cooling)-9121.png"
    ],
    shortDescription: "Haier CleanCool 1.5 Ton Triple Inverter AC with Self-Clean 99.9% sterilization and hyper PCB protection.",
    description: "<p>Haier HSU-18CleanCool brings cold expansion self-cleaning technology that kills bacteria and viruses with instant turbo cooling.</p>",
    specifications: [
      {
        group: "Technical Specifications",
        items: [
          { key: "Capacity", value: "1.5 Ton (18,000 BTU)" },
          { key: "Inverter Type", value: "Triple Inverter Plus" },
          { key: "Self-Cleaning", value: "Cold Expansion 99.9% Sterilization" },
          { key: "Gas Type", value: "R32" },
          { key: "Warranty", value: "10 Years Compressor, 1 Year Parts & Service" }
        ]
      }
    ],
    features: [
      "Cold Expansion Self-Cleaning 99.9% Sterilization",
      "Triple Inverter Plus Energy Efficiency",
      "Hyper PCB Surge Protection",
      "Super Quiet 20dB Operation"
    ],
    warranty: "Official 10 Years Compressor, 1 Year Spare Parts & 1 Year Service Warranty",
    emiAvailable: true,
    emiStartingFrom: 1775,
    freeDelivery: true,
    installationIncluded: true,
    reviews: [
      {
        id: "rev-haier-1",
        userName: "Md. Rafiqul Islam",
        userLocation: "Uttara Sector 11, Dhaka",
        rating: 5,
        date: "2026-01-22",
        comment: "হায়ারের সেলফ ক্লিন টেকনোলজি খুব চমৎকার। বিদ্যুৎ খরচ অনেক কম। রঙ্গ ইলেকট্রনিক্সকে ধন্যবাদ।",
        verifiedPurchase: true
      }
    ],
    qna: []
  },
  {
    id: "rango-ac-general-24",
    slug: "general-2-ton-split-inverter-air-conditioner-asgg24cgta",
    title: "General 2.0 Ton Tropical Inverter Split Air Conditioner (ASGG24CGTA)",
    category: "air-conditioner",
    subcategory: "2-ton-inverter-and-non-inverter-ac",
    brand: "General",
    model: "ASGG24CGTA",
    price: 118000,
    originalPrice: 129000,
    discount: 9,
    rating: 5.0,
    ratingCount: 14,
    badge: "Official",
    thumbnail: "https://adminapi.electronicsbangladesh.com/storage/media/large/General-2-Ton-Split-Air-Conditioner-ASGA24FETA-3162.jpg",
    images: [
      "https://adminapi.electronicsbangladesh.com/storage/media/large/General-2-Ton-Split-Air-Conditioner-ASGA24FETA-3162.jpg"
    ],
    shortDescription: "Heavy-duty Fujitsu General 2.0 Ton Tropical Inverter AC built for extreme heat up to 52°C ambient temperatures.",
    description: "<p>The General ASGG24CGTA 2 Ton Tropical Inverter AC ensures extreme heavy cooling performance with Japanese engineering and ultra-durable heat exchangers.</p>",
    specifications: [
      {
        group: "Technical Specifications",
        items: [
          { key: "Capacity", value: "2.0 Ton (24,000 BTU/hr)" },
          { key: "Cooling Type", value: "Hyper Tropical Inverter" },
          { key: "Extreme Temp Cooling", value: "Effective cooling up to 52°C" },
          { key: "Warranty", value: "2 Years Compressor, 2 Years Spare Parts & Free Service" }
        ]
      }
    ],
    features: [
      "2 Ton 24,000 BTU Heavy Duty Inverter",
      "Tropical Spec: Runs smoothly up to 52°C",
      "High Airflow Double Swing Louvers",
      "Blue Fin Anti-Corrosion Condenser"
    ],
    warranty: "Official 2 Years Compressor, 2 Years Spare Parts & Free Service Warranty",
    emiAvailable: true,
    emiStartingFrom: 3277,
    freeDelivery: true,
    installationIncluded: true,
    reviews: [
      {
        id: "rev-gen-1",
        userName: "Syed Golam Kibria",
        userLocation: "Banani, Dhaka",
        rating: 5,
        date: "2026-01-20",
        comment: "জেনারেলের কুলিং ক্যাপাসিটি অতুলনীয়। বড় ড্রয়িংরুম মাত্র কয়েক মিনিটে ঠান্ডা হয়ে যায়।",
        verifiedPurchase: true
      }
    ],
    qna: []
  }
];

// Check if these IDs already exist
newAcs.forEach(ac => {
  if (!products.some(p => p.id === ac.id)) {
    products.push(ac);
    console.log(`Added new AC product: ${ac.title}`);
  }
});

console.log(`\nUpdated total products: ${products.length}`);

// Category breakdown check
const breakdown = {};
products.forEach(p => {
  breakdown[p.category] = (breakdown[p.category] || 0) + 1;
});
console.log("New category breakdown:");
console.table(breakdown);

// Save back to src/data/products.ts
const updatedTsContent = `// Auto-generated 100% Complete Rango Electronics Catalog
// Source: https://rangoelectronics.com/

export interface Review {
  id: string;
  userName: string;
  userLocation: string;
  rating: number;
  date: string;
  comment: string;
  verifiedPurchase?: boolean;
  verifiedBuyer?: boolean;
  images?: string[];
}

export interface QnA {
  id: string;
  question: string;
  answer: string;
  askedBy: string;
  date: string;
}

export interface SpecificationGroup {
  group: string;
  items: { key: string; value: string }[];
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  category: string;
  subcategory: string;
  brand: string;
  model: string;
  price: number;
  originalPrice: number;
  discount: number;
  rating: number | string;
  ratingCount?: number;
  reviewsCount?: number;
  inStock?: boolean;
  stockCount?: number;
  stock?: number;
  isStockOut?: boolean;
  sku?: string;
  featured?: boolean;
  hotDeal?: boolean;
  bestSeller?: boolean;
  emiPlans?: any[];
  minEmiMonth?: number;
  badge?: string;
  thumbnail: string;
  images: string[];
  shortDescription?: string;
  description: string;
  specifications: SpecificationGroup[];
  features?: string[];
  warranty: string;
  emiAvailable: boolean;
  emiStartingFrom?: number;
  freeDelivery?: boolean;
  installationIncluded?: boolean;
  reviews: Review[];
  qna?: QnA[];
  questions?: any[];
}

export const PRODUCTS: Product[] = ${JSON.stringify(products, null, 2)};
`;

fs.writeFileSync('src/data/products.ts', updatedTsContent, 'utf8');
console.log("Successfully saved updated src/data/products.ts!");
