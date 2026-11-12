export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  country: string;
}

export const BRANDS: Brand[] = [
  { id: "samsung", name: "Samsung", slug: "samsung", country: "South Korea" },
  { id: "sony", name: "Sony", slug: "sony", country: "Japan" },
  { id: "lg", name: "LG", slug: "lg", country: "South Korea" },
  { id: "haier", name: "Haier", slug: "haier", country: "China" },
  { id: "hisense", name: "Hisense", slug: "hisense", country: "China" },
  { id: "hitachi", name: "Hitachi", slug: "hitachi", country: "Japan" },
  { id: "sharp", name: "Sharp", slug: "sharp", country: "Japan" },
  { id: "whirlpool", name: "Whirlpool", slug: "whirlpool", country: "USA" },
  { id: "gree", name: "Gree", slug: "gree", country: "China" },
  { id: "midea", name: "Midea", slug: "midea", country: "China" },
  { id: "walton", name: "Walton", slug: "walton", country: "Bangladesh" },
  { id: "panasonic", name: "Panasonic", slug: "panasonic", country: "Japan" },
  { id: "xiaomi", name: "Xiaomi", slug: "xiaomi", country: "China" },
  { id: "apple", name: "Apple", slug: "apple", country: "USA" },
  { id: "vivo", name: "Vivo", slug: "vivo", country: "China" },
  { id: "oneplus", name: "OnePlus", slug: "oneplus", country: "China" },
  { id: "infinix", name: "Infinix", slug: "infinix", country: "Hong Kong" },
  { id: "tecno", name: "Tecno", slug: "tecno", country: "Hong Kong" },
  { id: "jbl", name: "JBL", slug: "jbl", country: "USA" },
  { id: "bosch", name: "Bosch", slug: "bosch", country: "Germany" },
  { id: "minister", name: "Minister", slug: "minister", country: "Bangladesh" },
  { id: "general", name: "General", slug: "general", country: "Japan" }
];
