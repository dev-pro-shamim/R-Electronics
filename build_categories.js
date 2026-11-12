const fs = require('fs');

const navItems = JSON.parse(fs.readFileSync('nav_categories.json', 'utf8'));
console.log('Nav items count:', navItems.length);

// Group into hierarchical categories
const mainCategories = [
  {
    id: "smartphones",
    name: "Smartphones",
    slug: "mobile-phone",
    subcategories: [
      { name: "Samsung", slug: "samsung-mobile-phone" },
      { name: "Xiaomi", slug: "xiaomi-mobile-phone" },
      { name: "OnePlus", slug: "oneplus-mobile-phone" },
      { name: "Vivo", slug: "vivo-mobile-phone" },
      { name: "Honor", slug: "honor-mobile-phone" },
      { name: "Infinix", slug: "infinix-mobile-phone" },
      { name: "Tecno", slug: "tecno-mobile-phone" },
      { name: "iPhone", slug: "iphone" },
      { name: "Tablet", slug: "tablet" }
    ]
  },
  {
    id: "television",
    name: "Television",
    slug: "television",
    subcategories: [
      { name: "Samsung TV", slug: "samsung-tv" },
      { name: "Sony TV", slug: "sony-tv" },
      { name: "LG TV", slug: "lg-tv" },
      { name: "Hisense TV", slug: "hisense-tv" },
      { name: "Haier TV", slug: "haier-tv" },
      { name: "Xiaomi TV", slug: "xiaomi-tv" },
      { name: "TCL", slug: "tcl-tv" },
      { name: "Toshiba TV", slug: "toshiba-tv" },
      { name: "Minister TV", slug: "minister-tv" },
      { name: "Smart HD TV", slug: "smart-hd-tv" },
      { name: "Smart FHD TV", slug: "smart-fhd-tv" },
      { name: "Smart 4K UHD TV", slug: "smart-4k-uhd-tv" },
      { name: "QLED / OLED 4K TV", slug: "qled-oled-4k-tv" }
    ]
  },
  {
    id: "air-conditioner",
    name: "Air Conditioner",
    slug: "air-conditioner",
    subcategories: [
      { name: "Haier AC", slug: "haier-ac" },
      { name: "Hisense AC", slug: "hisense-ac" },
      { name: "Gree AC", slug: "gree-ac" },
      { name: "Midea AC", slug: "midea-ac" },
      { name: "Viomi AC", slug: "viomi-ac" },
      { name: "Walton AC", slug: "walton-ac" },
      { name: "Samsung AC", slug: "samsung-ac" },
      { name: "General AC", slug: "general-ac" },
      { name: "LG AC", slug: "lg-ac" },
      { name: "Panasonic AC", slug: "panasonic-ac" },
      { name: "Itel AC", slug: "itel-ac" },
      { name: "Chigo AC", slug: "chigo-air-conditioner" },
      { name: "Inverter AC", slug: "inverter-ac" },
      { name: "Non Inverter", slug: "non-inverter-ac" },
      { name: "Cassette AC", slug: "cassette-ac" },
      { name: "Ceiling AC", slug: "ceiling-ac" },
      { name: "Portable Air Cooler", slug: "portable-air-cooler" }
    ]
  },
  {
    id: "refrigerator",
    name: "Refrigerator",
    slug: "refrigerators-and-freezer",
    subcategories: [
      { name: "Deep Freezer", slug: "chest-freezer" },
      { name: "Samsung", slug: "samsung-fridge" },
      { name: "Sharp", slug: "sharp-refrigerator" },
      { name: "Hitachi", slug: "hitachi-refrigerator" },
      { name: "Hisense", slug: "hisense-refrigerator" },
      { name: "Haier", slug: "haier-refrigerator" },
      { name: "Whirlpool", slug: "whirlpool-refrigerator" },
      { name: "LG", slug: "lg-refrigerator" },
      { name: "Midea", slug: "midea-refrigerator" },
      { name: "Walton", slug: "walton-refrigerator" },
      { name: "Toshin", slug: "toshin-refrigerator" },
      { name: "Bosch", slug: "bosch-refrigerator" },
      { name: "Minister", slug: "minister-refrigerator" },
      { name: "Myone", slug: "myone-refrigerator" },
      { name: "Transtec", slug: "transtec-refrigerator" },
      { name: "Side By Side", slug: "side-by-side-refrigerator" },
      { name: "Mini Refrigerator", slug: "mini-refrigerator" },
      { name: "Frost", slug: "frost" },
      { name: "No Frost", slug: "no-frost" },
      { name: "Up Right", slug: "up-right" }
    ]
  },
  {
    id: "washing-machine",
    name: "Washing Machine",
    slug: "washing-machine",
    subcategories: [
      { name: "Sharp", slug: "sharp-washing-machine" },
      { name: "Hitachi", slug: "hitachi-washing-machine" },
      { name: "Samsung", slug: "samsung-washing-machine" },
      { name: "Hisense", slug: "hisense-washing-machine" },
      { name: "Haier", slug: "haier-washing-machine" },
      { name: "LG", slug: "lg-washing-machine" },
      { name: "Whirlpool", slug: "whirlpool-washing-machine" },
      { name: "Xiaomi", slug: "xiaomi-washing-machine" },
      { name: "Panasonic", slug: "panasonic-washing-machine" },
      { name: "Bosch", slug: "bosch-washing-machine" },
      { name: "Top loading", slug: "top-loading" },
      { name: "Front loading", slug: "front-loading" }
    ]
  },
  {
    id: "kitchen-appliances",
    name: "Kitchen Appliances",
    slug: "kitchen-appliances",
    subcategories: [
      { name: "Oven", slug: "oven" },
      { name: "Air Fryer", slug: "air-fryer" },
      { name: "Mixer Grinders", slug: "mixer-grinders" },
      { name: "Induction Cooker", slug: "induction-cooker" },
      { name: "Infrared Cooker", slug: "infrared-cooker" },
      { name: "Rice Cooker", slug: "rice-cooker" },
      { name: "Hand Blender", slug: "hand-blender" },
      { name: "Dishwasher", slug: "dishwasher" },
      { name: "Kitchen Hood", slug: "kitchen-hood" },
      { name: "Sandwich Maker", slug: "sandwich-maker" },
      { name: "Coffee Maker", slug: "coffee-maker" },
      { name: "Toaster", slug: "toaster" },
      { name: "Juicer", slug: "juicer" },
      { name: "Gas Stove", slug: "gas-stove" },
      { name: "Food Processor", slug: "food-processor" },
      { name: "Multi Cooker", slug: "multi-cooker" }
    ]
  },
  {
    id: "soundbar",
    name: "Soundbar",
    slug: "speaker-and-soundbar",
    subcategories: [
      { name: "Samsung", slug: "samsung-sound-bar" },
      { name: "Sony", slug: "sony-sound-bar" },
      { name: "JBL", slug: "jbl-sound-bar" }
    ]
  },
  {
    id: "small-appliances",
    name: "Small Appliances",
    slug: "small-appliances",
    subcategories: [
      { name: "Geyser", slug: "geyser" },
      { name: "Air Purifier", slug: "air-purifier" },
      { name: "Water Purifier", slug: "water-purifier" },
      { name: "Ceiling Fan", slug: "ceiling-fan" },
      { name: "Iron", slug: "iron" },
      { name: "Room Heater", slug: "room-heater" },
      { name: "Electric Kettle", slug: "electric-kettle" },
      { name: "Vacuum Cleaner", slug: "vacuum-cleaner" }
    ]
  },
  {
    id: "lifestyle",
    name: "Lifestyle",
    slug: "lifestyle",
    subcategories: [
      { name: "Trimmer", slug: "trimmer" },
      { name: "Hair Straightener", slug: "hair-straightener" },
      { name: "Hair Dryer", slug: "hair-dryer" },
      { name: "E Bike", slug: "electric-bike" }
    ]
  },
  {
    id: "gadget",
    name: "Gadget",
    slug: "gadget",
    subcategories: [
      { name: "Power Station", slug: "power-station" },
      { name: "EcoFlow", slug: "ecoflow-portable-power-station" },
      { name: "Anker", slug: "anker-power-station" }
    ]
  }
];

fs.writeFileSync('structured_categories.json', JSON.stringify(mainCategories, null, 2));
console.log('Structured categories generated, count:', mainCategories.length);
