import React, { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryClient } from "@/components/category/CategoryClient";
import { readAdminDbCached } from "@/lib/adminDb";
import { CATEGORIES } from "@/data/categories";
import { PRODUCTS } from "@/data/products";

export const dynamic = "force-dynamic";

interface Props {
  params: {
    slug: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}

function resolveCategory(slugParam: string) {
  const clean = decodeURIComponent(slugParam).toLowerCase();
  const db = readAdminDbCached();
  const liveCategories =
    db.categories && db.categories.length > 0 ? db.categories : CATEGORIES;

  const currentCategory = liveCategories.find(
    (c) =>
      c.slug.toLowerCase() === clean ||
      (c.subcategories || []).some((s) => s.slug.toLowerCase() === clean)
  );

  const matchedSub = currentCategory?.subcategories?.find(
    (s) => s.slug.toLowerCase() === clean
  );

  const categoryName = matchedSub
    ? matchedSub.name
    : currentCategory
    ? currentCategory.name
    : clean === "all"
    ? "All Electronics"
    : clean.replace(/-/g, " ");

  return { currentCategory, matchedSub, categoryName, clean };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoryName, clean } = resolveCategory(params.slug);
  const siteUrl = "https://rangoelectronics.com";
  const url = `${siteUrl}/category/${clean}`;

  const title = `${categoryName} Price in Bangladesh (2026) | Rango Electronics`;
  const description = `Buy authentic ${categoryName} in Bangladesh at the lowest official price from Rango Electronics. 100% original brand warranty, 0% EMI up to 36 months & fast nationwide delivery.`;

  return {
    title,
    description,
    keywords: [
      `${categoryName} price in Bangladesh`,
      `${categoryName} BD price 2026`,
      `Buy ${categoryName} online Dhaka`,
      `${categoryName} price list`,
      "Rango Electronics BD",
      "0% EMI electronics Bangladesh",
      "Official brand warranty BD"
    ],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Rango Electronics",
      type: "website",
      images: [
        {
          url: `${siteUrl}/logo.png`,
          width: 800,
          height: 800,
          alt: `${categoryName} - Rango Electronics`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${siteUrl}/logo.png`],
    },
  };
}

export default function CategoryPage({ params }: Props) {
  const { currentCategory, categoryName, clean } = resolveCategory(params.slug);

  // Pick top 12 sample products from this category for SSR ItemList schema
  const categoryProducts = PRODUCTS.filter((p) => {
    if (clean === "all") return true;
    const cat = (p.category || "").toLowerCase();
    const sub = (p.subcategory || "").toLowerCase();
    return (
      cat === clean ||
      sub === clean ||
      (currentCategory && cat === currentCategory.slug.toLowerCase())
    );
  }).slice(0, 12);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://rangoelectronics.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Categories",
        item: "https://rangoelectronics.com/category/all",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: categoryName,
        item: `https://rangoelectronics.com/category/${clean}`,
      },
    ],
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `https://rangoelectronics.com/category/${clean}#webpage`,
    url: `https://rangoelectronics.com/category/${clean}`,
    name: `${categoryName} Price in Bangladesh (2026) | Rango Electronics`,
    description: `Shop authentic ${categoryName} in Bangladesh with official brand warranty, 0% EMI, and fast nationwide delivery.`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: categoryProducts.map((p, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `https://rangoelectronics.com/product/${p.slug}`,
        name: p.title,
        image: p.thumbnail?.startsWith("http")
          ? p.thumbnail
          : `https://rangoelectronics.com${p.thumbnail}`,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <Suspense
        fallback={
          <div className="p-12 text-center text-xs text-gray-500">
            Loading Category Products...
          </div>
        }
      >
        <CategoryClient />
      </Suspense>
    </>
  );
}
