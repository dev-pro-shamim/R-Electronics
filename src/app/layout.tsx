import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});
import { StorefrontShell } from "@/components/layout/StorefrontShell";
import { readAdminDbCached } from "@/lib/adminDb";

export async function generateMetadata(): Promise<Metadata> {
  const db = readAdminDbCached();
  const title =
    db.settings?.seoDefaultTitle ||
    "Rango Electronics – Trusted Online Electronics Shop in Bangladesh";
  const description =
    db.settings?.seoDefaultDescription ||
    "Shop authentic 4K Smart TVs, Inverter Air Conditioners, Refrigerators, Washing Machines and Smartphones with 0% EMI and official brand warranty at Rango Electronics.";

  return {
    title,
    description,
    keywords:
      "Rango Electronics, Online Electronics Bangladesh, TV price in Bangladesh, AC price in Bangladesh, Refrigerator price in BD, 0% EMI electronics",
    metadataBase: new URL("https://rangoelectronics.com"),
    verification: db.settings?.googleSiteVerification
      ? { google: db.settings.googleSiteVerification }
      : undefined,
    openGraph: {
      title,
      description,
      url: "https://rangoelectronics.com",
      siteName: db.settings?.storeName || "Rango Electronics",
      type: "website",
      images: [{ url: "https://rangoelectronics.com/logo.png", alt: "Rango Electronics" }],
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
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Rango Electronics",
    url: "https://rangoelectronics.com",
    logo: "https://rangoelectronics.com/logo.png",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+8801798565001",
      contactType: "customer service",
      areaServed: "BD",
    },
  };

  const siteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Rango Electronics",
    url: "https://rangoelectronics.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://rangoelectronics.com/category/all?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" className={poppins.variable}>
      <body className={`${poppins.className} min-h-screen flex flex-col antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
        />
        <CartProvider>
          <StorefrontShell>{children}</StorefrontShell>
        </CartProvider>
      </body>
    </html>
  );
}
