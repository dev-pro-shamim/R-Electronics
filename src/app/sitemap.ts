import { MetadataRoute } from "next";
import { readAdminDbCached } from "@/lib/adminDb";
import { getMergedCatalogProducts } from "@/lib/adminServerHelpers";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://rangoelectronics.com";
  const db = readAdminDbCached();
  const catalog = getMergedCatalogProducts(db, { includeReviews: false }).filter(
    (p) => p.status !== "draft" && p.status !== "archived"
  );

  const productUrls: MetadataRoute.Sitemap = catalog.map((product) => ({
    url: `${baseUrl}/product/${product.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const categoryUrls: MetadataRoute.Sitemap = (db.categories || [])
    .filter((c) => c.active !== false)
    .flatMap((category) => {
      const parent = {
        url: `${baseUrl}/category/${category.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.9,
      };
      const subs = (category.subcategories || [])
        .filter((s) => s.active !== false)
        .map((sub) => ({
          url: `${baseUrl}/category/${category.slug}?sub=${sub.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.75,
        }));
      return [parent, ...subs];
    });

  const brandUrls: MetadataRoute.Sitemap = (db.brands || [])
    .filter((b) => b.active !== false)
    .map((brand) => ({
      url: `${baseUrl}/brand/${brand.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    }));

  const policyUrls: MetadataRoute.Sitemap = Object.values(db.policies || {})
    .filter((p) => p.published !== false)
    .map((policy) => ({
      url: `${baseUrl}/page/${policy.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    }));

  const landingPageUrls: MetadataRoute.Sitemap = (db.landingPages || [])
    .filter((lp) => lp.published !== false && lp.slug)
    .map((lp) => ({
      url: `${baseUrl}/lp/${lp.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    }));

  const staticUrls: MetadataRoute.Sitemap = [
    "",
    "/offer",
    "/compare",
    "/track-order",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1.0,
  }));

  return [
    ...staticUrls,
    ...categoryUrls,
    ...brandUrls,
    ...landingPageUrls,
    ...policyUrls,
    ...productUrls,
  ];
}
