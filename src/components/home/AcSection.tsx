"use client";

import React from "react";
import Link from "next/link";
import { PRODUCTS } from "@/data/products";
import { ProductCard } from "@/components/common/ProductCard";
import { useStoreRuntime } from "@/lib/useStoreRuntime";

export const AcSection: React.FC = () => {
  const runtime = useStoreRuntime();
  const source =
    runtime?.products && runtime.products.length > 0 ? runtime.products : PRODUCTS;

  // Curate clean, high-resolution residential split Inverter ACs for the homepage
  const acProducts = React.useMemo(() => {
    const all = source.filter((p) => p.category === "air-conditioner");
    const isCommercial = (p: (typeof all)[0]) => {
      const t = (p.title + " " + (p.subcategory || "")).toLowerCase();
      return (
        t.includes("cassette") ||
        t.includes("ceiling") ||
        t.includes("floor type") ||
        t.includes("7.5 ton") ||
        t.includes("5.0 ton")
      );
    };

    const cleanResidential = all.filter((p) => !isCommercial(p));
    cleanResidential.sort((a, b) => {
      const aScore =
        (a.featured ? 10 : 0) +
        (a.brand === "Gree" || a.brand === "Haier" ? 5 : 0) +
        (a.thumbnail?.includes("media") || a.thumbnail?.includes("haier") ? 5 : 0);
      const bScore =
        (b.featured ? 10 : 0) +
        (b.brand === "Gree" || b.brand === "Haier" ? 5 : 0) +
        (b.thumbnail?.includes("media") || b.thumbnail?.includes("haier") ? 5 : 0);
      return bScore - aScore;
    });

    return cleanResidential.slice(0, 10);
  }, [source]);

  return (
    <section className="my-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg md:text-3xl font-semibold text-gray-900">Beat the Heat!</h2>
        <Link
          className="text-[10px] md:text-base h-[25px] md:h-10 font-normal text-white bg-primary flex items-center rounded-3xl px-2 md:px-3 hover:opacity-90 transition-opacity"
          href="/category/air-conditioner"
        >
          All Products
          <svg className="ml-1" width="18" height="18" viewBox="0 0 18 18" stroke="currentColor" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.75 13.5L11.25 9L6.75 4.5" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2.2xl:grid-cols-5 gap-3 md:gap-4">
        {acProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};
