import React, { cache } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { readAdminDbCached } from "@/lib/adminDb";
import { resolveSingleProductFast } from "@/lib/adminServerHelpers";

export const dynamic = "force-dynamic";

interface Props {
  params: {
    slug: string;
  };
}

const resolveProduct = cache((slugParam: string) => {
  const db = readAdminDbCached();
  return resolveSingleProductFast(db, slugParam);
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = resolveProduct(params.slug);
  const product = resolved?.product;

  if (!product) {
    return {
      title: "Product Not Found | Rango Electronics",
      description: "The requested product could not be found on Rango Electronics.",
    };
  }

  const title =
    product.seoTitle ||
    `${product.title} Price in Bangladesh | Rango Electronics`;
  const description =
    product.seoDescription ||
    `Buy ${product.title} at ৳${product.price.toLocaleString()} in Bangladesh from Rango Electronics. Model: ${product.model || product.sku}. ${product.warranty}. Official warranty & 0% EMI.`;
  const url = `https://rangoelectronics.com/product/${product.slug}`;
  const imageUrl =
    product.thumbnail ||
    product.images?.[0] ||
    "https://rangoelectronics.com/logo.png";

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Rango Electronics",
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: product.title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function ProductPage({ params }: Props) {
  const resolved = resolveProduct(params.slug);

  if (!resolved) {
    notFound();
  }

  const { product, initialReviews, initialQuestions } = resolved;

  const reviewCount = Number(product.reviewsCount || 0);
  const ratingVal = Number(product.rating || 0);

  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image:
      product.images && product.images.length > 0
        ? product.images
        : [product.thumbnail],
    description:
      product.description ||
      `${product.title} with official brand warranty from Rango Electronics`,
    sku: product.sku,
    mpn: product.model,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    offers: {
      "@type": "Offer",
      url: `https://rangoelectronics.com/product/${product.slug}`,
      priceCurrency: "BDT",
      price: product.price,
      priceValidUntil: "2027-12-31",
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.isStockOut || (typeof product.stock === "number" && product.stock <= 0)
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Rango Electronics",
      },
    },
  };

  if (reviewCount > 0 && ratingVal > 0) {
    productSchema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: ratingVal.toFixed(1),
      reviewCount,
      bestRating: "5",
      worstRating: "1",
    };
  }

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
        name: product.category.toUpperCase().replace(/-/g, " "),
        item: `https://rangoelectronics.com/category/${product.category}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.title,
        item: `https://rangoelectronics.com/product/${product.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProductDetailClient
        product={product}
        initialReviews={initialReviews}
        initialQuestions={initialQuestions}
      />
    </>
  );
}
