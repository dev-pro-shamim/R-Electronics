"use client";

import React from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { ServiceHighlights } from "@/components/home/ServiceHighlights";
import { PromoBannerFull } from "@/components/home/PromoBannerFull";
import { FeaturedCategories } from "@/components/home/FeaturedCategories";
import { HotDeals } from "@/components/home/HotDeals";
import { AcSection } from "@/components/home/AcSection";
import { TvSection } from "@/components/home/TvSection";
import { MidBanners } from "@/components/home/MidBanners";
import { CategoryProductRow } from "@/components/home/CategoryProductRow";
import { BrandSection } from "@/components/home/BrandSection";
import { HomeSeoContent } from "@/components/home/HomeSeoContent";
import { PRODUCTS } from "@/data/products";
import { useStoreRuntime } from "@/lib/useStoreRuntime";

export default function HomePage() {
  const runtime = useStoreRuntime();
  const catalog =
    runtime?.products && runtime.products.length > 0 ? runtime.products : PRODUCTS;

  const fridgeProducts = catalog.filter(
    (p) => p.category === "refrigerator"
  );
  const washingMachineProducts = catalog.filter(
    (p) => p.category === "washing-machine"
  );
  const microwaveOvenProducts = catalog.filter(
    (p) => p.category === "microwave-oven"
  );
  const waterPurifierProducts = catalog.filter(
    (p) => p.category === "water-purifiers"
  );
  const geyserProducts = catalog.filter(
    (p) => p.category === "geyser-water-heaters"
  );
  const homeApplianceProducts = catalog.filter(
    (p) => p.category === "home-appliance"
  );
  const serviceRepairProducts = catalog.filter(
    (p) => p.category === "service-repair"
  );

  return (
    <main className="container pb-12">
      {/* Section 1: Hero Carousel & 2 Side Promotional Banners */}
      <HeroSection />

      {/* Section 2: Service Highlights (4 Hours Delivery, EMI, Fast Delivery, Flexible Payment) */}
      <ServiceHighlights />

      {/* Section 3: Promotional Banner Full Width */}
      <PromoBannerFull />

      {/* Section 4: Featured Categories */}
      <FeaturedCategories />

      {/* Section 5: Hot Deals */}
      <HotDeals />

      {/* Section 6: Beat the Heat! (Air Conditioners) */}
      <AcSection />

      {/* Section 7: Best Selling Television */}
      <TvSection />

      {/* Section 8: Mid-page 2-Column Banner Grid */}
      <MidBanners />

      {/* Section 9: Refrigerator & Deep Freezer */}
      <CategoryProductRow
        title="Refrigerator & Deep Freezer"
        categorySlug="refrigerator"
        products={fridgeProducts}
      />

      {/* Section 10: Washing Machine */}
      <CategoryProductRow
        title="Washing Machine"
        categorySlug="washing-machine"
        products={washingMachineProducts}
      />

      {/* Section 11: Microwave Oven */}
      <CategoryProductRow
        title="Microwave Oven"
        categorySlug="microwave-oven"
        products={microwaveOvenProducts}
      />

      {/* Section 12: Water Purifiers */}
      <CategoryProductRow
        title="Water Purifiers & RO Alkaline"
        categorySlug="water-purifiers"
        products={waterPurifierProducts}
      />

      {/* Section 13: Geyser & Water Heaters */}
      <CategoryProductRow
        title="Geyser & Water Heaters"
        categorySlug="geyser-water-heaters"
        products={geyserProducts}
      />

      {/* Section 14: Home Appliances */}
      <CategoryProductRow
        title="Home Appliances & Blender"
        categorySlug="home-appliance"
        products={homeApplianceProducts}
      />

      {/* Section 15: AC Service & Repair */}
      {serviceRepairProducts.length > 0 && (
        <CategoryProductRow
          title="Service & Repair"
          categorySlug="service-repair"
          products={serviceRepairProducts}
        />
      )}

      {/* Section 14: Scrolling Highlights Marquee */}
      <BrandSection />

      {/* Section 15: Homepage SEO Content */}
      <HomeSeoContent />
    </main>
  );
}
