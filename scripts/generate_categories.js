const fs = require('fs');

const rawCategories = JSON.parse(fs.readFileSync('scripts/live_all_categories.json', 'utf8'));
const products = JSON.parse(fs.readFileSync('scripts/all_raw_153_products.json', 'utf8'));

// The 9 exact root categories requested by user:
// 1. Home Appliance
// 2. Air Conditioner
// 3. Refrigerator
// 4. Television
// 5. Washing Machine
// 6. Microwave Oven
// 7. Service & Repair
// 8. Water Purifiers
// 9. Geyser & Water Heaters

const TARGET_ROOTS = [
  {
    id: "home-appliance",
    name: "Home Appliance",
    slug: "home-appliance",
    subcategories: [
      { id: "blender-juicer", name: "Blender & Juicer", slug: "blender-juicer" },
      { id: "rice-cooker", name: "Rice Cooker", slug: "rice-cooker" },
      { id: "electric-kettle", name: "Electric Kettle", slug: "electric-kettle" },
      { id: "iron", name: "Iron", slug: "iron" },
      { id: "infrared-cooker", name: "Infrared Cooker", slug: "infrared-cooker" },
      { id: "fan", name: "Fan", slug: "fan" }
    ]
  },
  {
    id: "air-conditioner",
    name: "Air Conditioner",
    slug: "air-conditioner",
    subcategories: [
      { id: "1-ton-ac", name: "1 Ton Inverter AC", slug: "1-ton-inverter-and-non-inverter-ac" },
      { id: "1-5-ton-ac", name: "1.5 Ton Inverter AC", slug: "1-5-ton-inverter-and-non-inverter-ac" },
      { id: "2-ton-ac", name: "2 Ton Inverter AC", slug: "2-ton-inverter-and-non-inverter-ac" },
      { id: "2-5-ton-ac", name: "2.5 Ton Inverter AC", slug: "2-5-ton-inverter-and-non-inverter-ac" },
      { id: "ceiling-ac", name: "Ceiling Type AC", slug: "3-ton-ceiling-4-ton-ceiling-5-ton-ceiling-type-ac" },
      { id: "cassette-ac", name: "Cassette Type AC", slug: "3-ton-cassette-4-ton-cassette-5-ton-cassette-type-ac" },
      { id: "portable-ac", name: "Portable AC", slug: "portable-ac-and-floor-stand-ac" }
    ]
  },
  {
    id: "refrigerator",
    name: "Refrigerator",
    slug: "refrigerator",
    subcategories: [
      { id: "chest-freezer", name: "Chest Freezer", slug: "chest-freezer" },
      { id: "no-frost", name: "No Frost Refrigerator", slug: "non-frost-refrigerator" },
      { id: "side-by-side", name: "Side by Side", slug: "side-by-side-refrigerator" },
      { id: "up-right", name: "Up Right Refrigerator", slug: "up-right-refrigerator" },
      { id: "frost", name: "Frost Refrigerator", slug: "frost-refrigerator" }
    ]
  },
  {
    id: "television",
    name: "Television",
    slug: "television",
    subcategories: [
      { id: "32-inch", name: "32 Inch TV", slug: "32-inch" },
      { id: "43-inch", name: "43 Inch TV", slug: "43-inch" },
      { id: "50-inch", name: "50 Inch TV", slug: "50-inch" },
      { id: "55-inch", name: "55 Inch TV", slug: "55-inch" },
      { id: "65-inch", name: "65 Inch TV", slug: "65-inch" },
      { id: "75-inch", name: "75 Inch TV", slug: "75-inch" },
      { id: "85-inch", name: "85 Inch TV", slug: "85-inch" },
      { id: "100-inch", name: "100 Inch TV", slug: "100-inch-tv" }
    ]
  },
  {
    id: "washing-machine",
    name: "Washing Machine",
    slug: "washing-machine",
    subcategories: [
      { id: "top-loading", name: "Top Loading", slug: "top-loading" },
      { id: "front-loading", name: "Front Loading", slug: "front-loading" }
    ]
  },
  {
    id: "microwave-oven",
    name: "Microwave Oven",
    slug: "microwave-oven",
    subcategories: [
      { id: "grill", name: "Grill Microwave", slug: "grill" },
      { id: "convection", name: "Convection Microwave", slug: "convection" },
      { id: "solo", name: "Solo Microwave", slug: "solo" }
    ]
  },
  {
    id: "water-purifiers",
    name: "Water Purifiers",
    slug: "water-purifiers",
    subcategories: [
      { id: "ro", name: "Reverse Osmosis (RO)", slug: "ro" },
      { id: "dispenser", name: "Water Dispenser", slug: "dispenser" },
      { id: "direct-flow", name: "Direct Flow", slug: "direct-flow" },
      { id: "ro-alkaline", name: "RO Alkaline", slug: "ro-alkaline" },
      { id: "hot-cold-normal", name: "Hot Cold Normal", slug: "hot-cold-normal" }
    ]
  },
  {
    id: "geyser-water-heaters",
    name: "Geyser & Water Heaters",
    slug: "geyser-water-heaters",
    subcategories: [
      { id: "dewanco", name: "Dewanco Geyser", slug: "dewanco-geyser-water-heaters" },
      { id: "regent", name: "Regent Water Heater", slug: "regent-instant-water-heater" },
      { id: "eva-pure", name: "Eva Pure Geyser", slug: "eva-pure" },
      { id: "haier-geyser", name: "Haier Geyser", slug: "haier-geyser-water-heaters" },
      { id: "hot-point", name: "Hot Point Geyser", slug: "hot-point-geyser-water-heaters" },
      { id: "midea-geyser", name: "Midea Geyser", slug: "midea-geyser-water-heaters" },
      { id: "shameem-geyser", name: "Shameem Geyser", slug: "shameem-geyser-water-heaters" }
    ]
  },
  {
    id: "service-repair",
    name: "Service & Repair",
    slug: "service-repair",
    subcategories: [
      { id: "installation-open", name: "AC Installation & Open", slug: "installation-open" },
      { id: "ac-repair", name: "AC Repair", slug: "ac-rapair" },
      { id: "master-servicing", name: "Master Servicing", slug: "master-servicing" }
    ]
  }
];

const featuredCategories = [
  {
    name: "Television",
    slug: "television",
    image: "https://rangoelectronics.com/wp-content/uploads/2024/09/Hisense-55-Inch-Bezelless-Dolby-Vision-4K-UHD-Smart-LED-Voice-Control-Google-DTS-TV-55A6F3-2.jpg",
    count: 25
  },
  {
    name: "Home Appliance",
    slug: "home-appliance",
    image: "https://rangoelectronics.com/wp-content/uploads/2024/09/Konka-1000-Watt-Turbo-Pro-Mixer-Grinder-4-Jar-01.jpg",
    count: 30
  },
  {
    name: "Geyser & Water Heaters",
    slug: "geyser-water-heaters",
    image: "https://rangoelectronics.com/wp-content/uploads/2024/10/Dewanco-Automatic-Classic-Water-Heater-Geyser-67-Liters.jpg",
    count: 24
  },
  {
    name: "Washing Machine",
    slug: "washing-machine",
    image: "https://rangoelectronics.com/wp-content/uploads/2024/09/Haier-7.5-Kg-Front-Loading-Inverter-Washing-Machine-HW75-IM12929CS6U1-1.jpg",
    count: 19
  },
  {
    name: "Microwave Oven",
    slug: "microwave-oven",
    image: "https://rangoelectronics.com/wp-content/uploads/2024/09/Haier-20-Liters-Grill-Microwave-Oven-H20M91GS-1.jpg",
    count: 18
  },
  {
    name: "Refrigerator",
    slug: "refrigerator",
    image: "https://rangoelectronics.com/wp-content/uploads/2024/09/Haier-216-Liters-Chest-Freezer-HBM-216BM-1.jpg",
    count: 15
  },
  {
    name: "Water Purifiers",
    slug: "water-purifiers",
    image: "https://rangoelectronics.com/wp-content/uploads/2024/10/Eva-Pure-Top-Loading-Compressor-Hot-and-Cold-Water-Dispenser-EP-16T.jpg",
    count: 13
  },
  {
    name: "Service & Repair",
    slug: "service-repair",
    image: "https://rangoelectronics.com/wp-content/uploads/2024/10/AC-Servicing-Master-Servicing-1.5-Ton-to-2-Ton.jpg",
    count: 3
  }
];

const fileContent = `export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  banner?: string;
  featured?: boolean;
  subcategories: Subcategory[];
}

export const CATEGORIES: Category[] = ${JSON.stringify(TARGET_ROOTS, null, 2)};

export const FEATURED_CATEGORIES = ${JSON.stringify(featuredCategories, null, 2)};
`;

fs.writeFileSync('src/data/categories.ts', fileContent, 'utf8');
console.log("Saved exact Rango Electronics 9 categories to src/data/categories.ts!");
