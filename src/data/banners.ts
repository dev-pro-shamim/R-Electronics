export interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  url: string;
  image: string;
  bgGradient?: string;
  ctaText?: string;
}

export const HERO_SLIDES: BannerSlide[] = [
  {
    id: "slide-1",
    title: "Big Screen Crystal 4K UHD TVs",
    subtitle: "Experience cinematic entertainment with up to 36 months 0% EMI",
    badge: "Special Seasonal Sale",
    url: "/category/television",
    image: "https://adminapi.electronicsbangladesh.com/storage/media/large/samsung-55-inch-crystal-uhd-4k-smart-tv-55u8000f-4836.png",
    bgGradient: "from-rose-900 via-rose-800 to-slate-900",
    ctaText: "Shop TV Offers"
  },
  {
    id: "slide-2",
    title: "Beat The Heat with Inverter ACs",
    subtitle: "Super cooling efficiency, up to 70% energy savings & free installation",
    badge: "Official Brand Warranty",
    url: "/category/air-conditioner",
    image: "https://adminapi.electronicsbangladesh.com/storage/media/large/Hisense-1.5-Ton-Full-DC-Inverter-AC-3775.jpg",
    bgGradient: "from-sky-900 via-blue-900 to-slate-950",
    ctaText: "Explore AC Range"
  },
  {
    id: "slide-3",
    title: "Smart Refrigerator Carnival",
    subtitle: "Side-by-side & No-Frost refrigerators with 10 years compressor warranty",
    badge: "Up to 35% Off",
    url: "/category/refrigerators-and-freezer",
    image: "https://adminapi.electronicsbangladesh.com/storage/media/large/Samsung-700-Liters-Side-By-Side-No-Frost-Refrigerator-RS72R5011B4D2-2493.webp",
    bgGradient: "from-emerald-950 via-teal-900 to-slate-900",
    ctaText: "View Refrigerators"
  },
  {
    id: "slide-4",
    title: "Flagship Smartphones & 5G Devices",
    subtitle: "Official models from Samsung, Apple, Xiaomi, Vivo with genuine BTRC approval",
    badge: "100% Genuine",
    url: "/category/mobile-phone",
    image: "https://adminapi.electronicsbangladesh.com/storage/media/large/Samsung-Galaxy-S24-Ultra-5G-Titanium-Gray-3420.webp",
    bgGradient: "from-purple-950 via-indigo-900 to-slate-950",
    ctaText: "Browse Smartphones"
  }
];

export const HERO_SIDE_BANNERS = [
  {
    id: "side-1",
    title: "Hisense 1.5 Ton Full DC Inverter AC",
    subtitle: "Save ৳25,000 + Free Delivery",
    url: "/category/air-conditioner",
    image: "https://adminapi.electronicsbangladesh.com/storage/media/large/Hisense-1.5-Ton-Full-DC-Inverter-AC-3775.jpg",
    tag: "Hot Seller"
  },
  {
    id: "side-2",
    title: "Haier 7.5kg Top Load Automatic Washing Machine",
    subtitle: "Starting at ৳20,990",
    url: "/category/washing-machine",
    image: "https://adminapi.electronicsbangladesh.com/storage/media/large/Haier-7.5kg-3486.jpg",
    tag: "Limited Stock"
  }
];

export const PROMO_BANNER_FULL = {
  title: "Rango Electronics Mega Deals 2026",
  subtitle: "Up to 40% Off on Premium Home Appliances + 0% EMI up to 36 Months",
  image: "https://adminapi.electronicsbangladesh.com/storage/media/large/GIF-Banner-2733.gif",
  url: "/offer"
};

export const MID_PAGE_BANNERS = [
  {
    id: "mid-1",
    title: "Samsung Crystal UHD 4K Smart TVs",
    subtitle: "Vivid color and crystal clarity for your living room",
    url: "/category/television",
    image: "https://adminapi.electronicsbangladesh.com/storage/media/large/Samsung-TV-Thai-Buttom-Banner-8768.jpg"
  },
  {
    id: "mid-2",
    title: "Haier Top Load Automatic Series",
    subtitle: "Pillow drum protection with deep clean technology",
    url: "/category/washing-machine",
    image: "https://adminapi.electronicsbangladesh.com/storage/media/large/Haier-Top-Load-Automatic-Buttom-Banner-6720.jpg"
  }
];

export const SERVICE_HIGHLIGHTS = [
  {
    title: "100% Genuine Products",
    description: "Sourced directly through authorized brand channels",
    icon: "ShieldCheck"
  },
  {
    title: "Official Brand Warranty",
    description: "Enjoy official manufacturer warranty on every product",
    icon: "Award"
  },
  {
    title: "0% EMI Facility",
    description: "Available up to 36 months with 28+ leading banks",
    icon: "CreditCard"
  },
  {
    title: "Fast Nationwide Delivery",
    description: "Express shipping inside Dhaka & across Bangladesh",
    icon: "Truck"
  }
];
