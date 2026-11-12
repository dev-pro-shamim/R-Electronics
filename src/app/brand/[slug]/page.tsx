import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { readAdminDbCached } from "@/lib/adminDb";
import { getMergedCatalogProducts, toCardProduct } from "@/lib/adminServerHelpers";
import { BrandDetailClient } from "@/components/brand/BrandDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: {
    slug: string;
  };
}

function resolveBrand(slugParam: string) {
  const clean = decodeURIComponent(slugParam).toLowerCase();
  const db = readAdminDbCached();
  const brand = (db.brands || []).find(
    (b) =>
      b.active !== false &&
      (b.slug.toLowerCase() === clean || b.name.toLowerCase() === clean)
  );
  return { db, brand };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand } = resolveBrand(params.slug);
  if (!brand) {
    return {
      title: "Brand Not Found | Rango Electronics",
      description: "The requested brand page could not be found.",
    };
  }

  const title =
    brand.seoTitle ||
    `${brand.name} Official Products & Price in Bangladesh | Rango Electronics`;
  const description =
    brand.seoDescription ||
    brand.description ||
    `Shop 100% genuine ${brand.name} electronics and appliances in Bangladesh with official warranty and 0% EMI at Rango Electronics.`;
  const url = `https://rangoelectronics.com/brand/${brand.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Rango Electronics",
      images: brand.logo ? [{ url: brand.logo, alt: brand.name }] : undefined,
      type: "website",
    },
  };
}

export default function BrandPage({ params }: Props) {
  const { db, brand } = resolveBrand(params.slug);
  if (!brand) {
    notFound();
  }

  const allProducts = getMergedCatalogProducts(db, { includeReviews: false })
    .filter(
      (p) =>
        p.status !== "draft" &&
        p.status !== "archived" &&
        ((p.brand || "").toLowerCase() === brand.name.toLowerCase() ||
          (p.brand || "").toLowerCase() === brand.slug.toLowerCase())
    )
    .map(toCardProduct);

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
        name: brand.name,
        item: `https://rangoelectronics.com/brand/${brand.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <BrandDetailClient brand={brand} initialProducts={allProducts} />
    </>
  );
}
