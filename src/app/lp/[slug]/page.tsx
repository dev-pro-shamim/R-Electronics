import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPageClient } from "@/components/landing/LandingPageClient";
import { readAdminDbCached } from "@/lib/adminDb";
import { getMergedCatalogProducts } from "@/lib/adminServerHelpers";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const db = readAdminDbCached();
  const lp = (db.landingPages || []).find(
    (item) => item.slug === params.slug && item.published !== false
  );
  if (!lp) {
    return {
      title: "Special Offer Landing Page | Rango Electronics",
    };
  }
  return {
    title: lp.seoTitle || lp.title,
    description: lp.seoDescription || lp.subtitle || lp.title,
    alternates: {
      canonical: `https://rangoelectronics.com/lp/${lp.slug}`,
    },
    openGraph: {
      title: lp.seoTitle || lp.title,
      description: lp.seoDescription || lp.subtitle || lp.title,
      images: lp.heroImage ? [{ url: lp.heroImage }] : undefined,
      type: "website",
    },
  };
}

export default function LandingPageRoute({ params }: PageProps) {
  const db = readAdminDbCached();
  const lp = (db.landingPages || []).find(
    (item) => item.slug === params.slug && item.published !== false
  );

  if (!lp) {
    notFound();
  }

  const catalog = getMergedCatalogProducts(db, { includeReviews: true });
  const product =
    catalog.find((p) => p.id === lp.productId || p.slug === lp.productId) || null;

  const adminReviews = (db.reviews || [])
    .filter(
      (r) =>
        r.productId === product?.id &&
        (r.status === "Approved" || !r.status)
    )
    .map((r) => ({
      id: r.id,
      userName: r.userName || "Verified Buyer",
      rating: Number(r.rating || 5),
      comment: r.comment,
      date: r.createdAt
        ? new Date(r.createdAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Verified Purchase",
      images: r.images || [],
    }));

  const catalogReviews = (product?.reviews || []).slice(0, 12).map((r, idx) => ({
    id: r.id || `rev-${idx}`,
    userName: r.userName || "Verified Customer",
    rating: Number(r.rating || 5),
    comment: r.comment,
    date: r.date || "Verified Purchase",
    images: r.images || [],
  }));

  const mergedReviews = [...adminReviews, ...catalogReviews].slice(0, 12);

  return (
    <LandingPageClient
      landingPage={lp}
      product={product}
      reviews={mergedReviews}
    />
  );
}
