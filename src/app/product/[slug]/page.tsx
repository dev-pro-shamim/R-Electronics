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

  const modelCode = product.model ? ` (${product.model})` : "";
  const title =
    product.seoTitle ||
    `${product.title}${modelCode} Price in Bangladesh (2026) | Rango Electronics`;
  
  const discountText = product.originalPrice && product.originalPrice > product.price 
    ? ` Discount Price ৳${product.price.toLocaleString()} (MRP ৳${product.originalPrice.toLocaleString()}).` 
    : ` Price: ৳${product.price.toLocaleString()}.`;

  const description =
    product.seoDescription ||
    `Buy authentic ${product.title} in Bangladesh at Rango Electronics.${discountText} 100% genuine brand warranty, 0% EMI up to 36 months, fast delivery & official fitting support.`;
  
  const siteUrl = "https://rangoelectronics.com";
  const canonicalUrl = product.canonicalUrl || `${siteUrl}/product/${product.slug}`;
  const imageUrl =
    product.ogImage ||
    product.thumbnail ||
    product.images?.[0] ||
    `${siteUrl}/logo.png`;

  // Merge primary, secondary, Bengali & default keywords
  const allKeywords: string[] = [
    product.focusKeyword,
    ...(product.secondaryKeywords || []),
    ...(product.bengaliKeywords || []),
    `${product.title} price in Bangladesh`,
    `${product.brand} ${product.model || ''} price in BD`,
    `${product.title} BD price`,
    `${product.category} price in Bangladesh`,
    "Rango Electronics online shop",
    "0% EMI electronics Bangladesh",
    "Official brand warranty BD"
  ].filter(Boolean) as string[];

  const ogTitle = product.ogTitle || title;
  const ogDescription = product.ogDescription || description;

  return {
    title,
    description,
    keywords: allKeywords,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonicalUrl,
      siteName: "Rango Electronics",
      locale: "en_BD",
      images: [
        {
          url: imageUrl.startsWith("http") ? imageUrl : `${siteUrl}${imageUrl}`,
          width: 800,
          height: 800,
          alt: product.imageAltText || `${product.title} - Rango Electronics`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [imageUrl.startsWith("http") ? imageUrl : `${siteUrl}${imageUrl}`],
    },
  };
}

export default function ProductPage({ params }: Props) {
  const resolved = resolveProduct(params.slug);

  if (!resolved) {
    notFound();
  }

  const { product, initialReviews, initialQuestions } = resolved;

  const reviewCount = Number(product.reviewsCount || (initialReviews ? initialReviews.length : 0) || 5);
  const ratingVal = Number(product.rating || 4.8);

  // Clean plain description for schema
  const plainDescription = (product.description || "")
    .replace(/<[^>]*>?/gm, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300) || `${product.title} with official brand warranty from Rango Electronics`;

  const siteUrl = "https://rangoelectronics.com";
  const rawImages = product.images && product.images.length > 0
    ? product.images
    : [product.thumbnail || "/logo.png"];

  const productImages = rawImages.map(img => img.startsWith("http") ? img : `${siteUrl}${img}`);

  // Image Schema for Google Image Search
  const schemaImages = productImages.map((imgUrl, i) => ({
    "@type": "ImageObject",
    url: imgUrl,
    caption: product.imageAltText || `${product.title} - ${product.brand} - photo ${i + 1}`,
    name: `${product.title} - photo ${i + 1}`,
  }));

  const allKeywordStr = [
    product.focusKeyword,
    ...(product.secondaryKeywords || []),
    ...(product.bengaliKeywords || []),
  ].filter(Boolean).join(", ");

  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${siteUrl}/product/${product.slug}#product`,
    name: product.title,
    image: schemaImages,
    description: plainDescription,
    keywords: allKeywordStr || `${product.title}, ${product.brand}, price in bangladesh`,
    sku: product.sku || product.id,
    mpn: product.model || product.sku || product.id,
    category: product.category,
    brand: {
      "@type": "Brand",
      name: product.brand || "Rango Electronics",
    },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/product/${product.slug}`,
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
        url: siteUrl,
        logo: `${siteUrl}/logo.png`,
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "BD",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: "BDT",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "BD",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 1,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 3,
            unitCode: "DAY",
          },
        },
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

  // Add sample review if available for rich snippet author
  if (initialReviews && initialReviews.length > 0) {
    const topReview = initialReviews[0];
    productSchema.review = [
      {
        "@type": "Review",
        author: {
          "@type": "Person",
          name: topReview.userName || "Verified Buyer",
        },
        datePublished: topReview.date || "2026-01-15",
        reviewBody: topReview.comment || "Excellent product with genuine warranty.",
        reviewRating: {
          "@type": "Rating",
          ratingValue: String(topReview.rating || 5),
          bestRating: "5",
          worstRating: "1",
        },
      },
    ];
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: (product.category || "Electronics").toUpperCase().replace(/-/g, " "),
        item: `${siteUrl}/category/${product.category}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.title,
        item: `${siteUrl}/product/${product.slug}`,
      },
    ],
  };

  // Product-specific FAQ Schema (Huge ranking factor for dominating Google SERP screen space)
  const qnaItems = (initialQuestions && initialQuestions.length > 0)
    ? initialQuestions
    : (product.questions && product.questions.length > 0)
    ? product.questions
    : (product.qna && product.qna.length > 0)
    ? product.qna
    : [
        {
          question: `Does this ${product.title} come with official brand warranty in Bangladesh?`,
          answer: `Yes, 100% genuine ${product.brand} original product with official brand warranty card inside the carton.`
        },
        {
          question: `Is 0% EMI payment available for ${product.title}?`,
          answer: `Yes, Rango Electronics provides 0% interest EMI up to 36 months across 30+ leading partner banks in Bangladesh.`
        },
        {
          question: `How fast is delivery for ${product.title} across Bangladesh?`,
          answer: `Inside Dhaka delivery is completed in 24-48 hours. Across all other 64 districts, delivery takes 2-4 business days with secure packaging.`
        }
      ];

  const productFaqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qnaItems.map((q: any) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productFaqSchema) }}
      />
      <ProductDetailClient
        product={product}
        initialReviews={initialReviews}
        initialQuestions={initialQuestions}
      />
    </>
  );
}
