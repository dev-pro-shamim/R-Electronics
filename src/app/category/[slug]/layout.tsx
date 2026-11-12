import type { Metadata } from "next";
import { readAdminDb } from "@/lib/adminDb";

interface Props {
  params: { slug: string };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug).toLowerCase();
  const db = readAdminDb();
  const categories = db.categories || [];
  const parent = categories.find(
    (c) =>
      c.slug.toLowerCase() === slug ||
      (c.subcategories || []).some((s) => s.slug.toLowerCase() === slug)
  );
  const sub = parent?.subcategories?.find((s) => s.slug.toLowerCase() === slug);

  const displayName = sub?.name || parent?.name || (slug === "all" ? "All Electronics" : slug.replace(/-/g, " "));
  const title =
    sub?.seoTitle ||
    parent?.seoTitle ||
    `${displayName} Price in Bangladesh | Rango Electronics`;
  const description =
    sub?.seoDescription ||
    parent?.seoDescription ||
    parent?.description ||
    `Browse authentic ${displayName} appliances and electronics at best prices in Bangladesh with 0% EMI and official warranty from Rango Electronics.`;
  const canonical = `https://rangoelectronics.com/category/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Rango Electronics",
      type: "website",
    },
  };
}

export default function CategorySlugLayout({ children }: Props) {
  return <>{children}</>;
}
