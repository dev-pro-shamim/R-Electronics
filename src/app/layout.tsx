import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { StorefrontShell } from "@/components/layout/StorefrontShell";
import { readAdminDbCached } from "@/lib/adminDb";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export async function generateMetadata(): Promise<Metadata> {
  const db = readAdminDbCached();
  const title =
    db.settings?.seoDefaultTitle ||
    "Rango Electronics – Buy Original AC, TV, Fridge, Geyser & Appliances Price in Bangladesh (2026)";
  const description =
    db.settings?.seoDefaultDescription ||
    "Shop 100% genuine Haier, Gree, Midea, Regent, Dewanco, Hisense electronics in Bangladesh. 0% EMI up to 36 months, official warranty, fast delivery & expert installation across BD.";

  const siteUrl = "https://rangoelectronics.com";

  return {
    referrer: "origin-when-cross-origin",
    title: {
      default: title,
      template: "%s | Rango Electronics",
    },
    description,
    keywords: [
      "Rango Electronics",
      "Electronics shop in Bangladesh",
      "Geyser price in BD",
      "গিজার দাম বাংলাদেশ",
      "AC price in Bangladesh",
      "এসি প্রাইস ইন বিডি",
      "Refrigerator price in BD",
      "ফ্রিজের দাম ২০২৬",
      "Smart TV price in BD",
      "টিভি প্রাইস বাংলাদেশ",
      "Washing machine price in Bangladesh",
      "Water purifier price in BD",
      "0% EMI electronics Bangladesh",
      "Haier AC Bangladesh",
      "Gree AC price BD",
      "Midea geyser BD",
      "Regent geyser price",
      "Dewanco geyser BD"
    ],
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: siteUrl,
      languages: {
        "en-BD": siteUrl,
        "bn-BD": siteUrl,
        "x-default": siteUrl,
      },
    },
    verification: {
      google: db.settings?.googleSiteVerification || "G-RANGO-ELEC-VERIFICATION",
    },
    openGraph: {
      title,
      description,
      url: siteUrl,
      siteName: db.settings?.storeName || "Rango Electronics",
      locale: "en_BD",
      type: "website",
      images: [
        {
          url: `${siteUrl}/logo.png`,
          width: 800,
          height: 800,
          alt: "Rango Electronics Bangladesh",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${siteUrl}/logo.png`],
      site: "@RangoElecBD",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: [
        { url: "/logo.png", type: "image/png" },
        { url: "/favicon.ico" },
      ],
      shortcut: "/logo.png",
      apple: "/logo.png",
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "ElectronicsStore",
    "@id": "https://rangoelectronics.com/#store",
    name: "Rango Electronics",
    alternateName: ["রঙ্গ ইলেকট্রনিক্স", "Rango Electronics Bangladesh"],
    url: "https://rangoelectronics.com",
    logo: "https://rangoelectronics.com/logo.png",
    image: "https://rangoelectronics.com/logo.png",
    description:
      "Leading authentic online and retail electronics shop in Bangladesh offering Smart TVs, Air Conditioners, Refrigerators, Geysers, Washing Machines, and Home Appliances with official warranty and 0% EMI.",
    telephone: "+8801798565001",
    email: "support@rangoelectronics.com",
    priceRange: "৳৳",
    currenciesAccepted: "BDT",
    paymentAccepted: "Cash, Credit Card, bKash, Nagad, 0% EMI",
    address: {
      "@type": "PostalAddress",
      streetAddress: "H-11 R-11 DIT Project, Merul Badda",
      addressLocality: "Dhaka",
      postalCode: "1212",
      addressCountry: "BD",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 23.7712,
      longitude: 90.4238,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "09:00",
        closes: "21:00",
      },
    ],
    sameAs: [
      "https://www.facebook.com/rangoelectronics",
      "https://www.instagram.com/rangoelectronics",
      "https://www.youtube.com/@rangoelectronics"
    ],
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "BD",
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 7,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/FreeReturn",
    },
  };

  const siteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://rangoelectronics.com/#website",
    name: "Rango Electronics",
    url: "https://rangoelectronics.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://rangoelectronics.com/category/all?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const homeFaqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What electronics and home appliances can I buy from Rango Electronics?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can purchase 100% genuine Smart TVs, Inverter Air Conditioners, Refrigerators, Deep Freezers, Geysers & Water Heaters, Washing Machines, Water Purifiers, Microwave Ovens, and Home Appliances from top brands like Haier, Gree, Midea, Regent, Dewanco, Samsung, Hisense, and Shameem Tropica.",
        },
      },
      {
        "@type": "Question",
        name: "Does Rango Electronics provide official brand warranty in Bangladesh?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, all products sold by Rango Electronics come with 100% genuine brand warranty cards, including official compressor warranties up to 10-12 years and parts/service warranties.",
        },
      },
      {
        "@type": "Question",
        name: "Is 0% EMI available on electronics at Rango Electronics?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! Rango Electronics offers 0% interest EMI facilities from 3 to 36 months across more than 30 major commercial partner banks in Bangladesh.",
        },
      },
      {
        "@type": "Question",
        name: "How fast is delivery inside Dhaka and across Bangladesh?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Inside Dhaka delivery is completed within 24 to 48 hours (with same-day express delivery available on select items). Nationwide delivery across all 64 districts takes 2 to 4 business days with secured packaging and tracking.",
        },
      },
      {
        "@type": "Question",
        name: "Do you offer free installation and fitting for AC and Geysers?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, certified expert technician fitting, mounting accessories, and demo installation are provided for air conditioners, geysers, and home appliances.",
        },
      },
    ],
  };

  return (
    <html lang="en" className={poppins.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://image.haier.com" />
        <link rel="dns-prefetch" href="https://d2ttkd7jwwn4uz.cloudfront.net" />
      </head>
      <body className={`${poppins.className} min-h-screen flex flex-col antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqSchema) }}
        />
        <CartProvider>
          <StorefrontShell>{children}</StorefrontShell>
        </CartProvider>
      </body>
    </html>
  );
}
