"use client";

import React from "react";
import { PRODUCTS } from "@/data/products";
import { ProductCard } from "@/components/common/ProductCard";
import { useStoreRuntime } from "@/lib/useStoreRuntime";

export const HotDeals: React.FC = () => {
  const runtime = useStoreRuntime();
  const source =
    runtime?.products && runtime.products.length > 0 ? runtime.products : PRODUCTS;

  // Curate 10 premium, visually appealing hot deals spanning TV, AC, Fridge, Washing Machine, Oven, etc.
  const hotDeals = React.useMemo(() => {
    const selected: typeof source = [];
    const usedCategories = new Set<string>();

    for (const p of source) {
      if (selected.length >= 10) break;
      if (!p.thumbnail || p.thumbnail.includes("placeholder")) continue;
      const t = (p.title + " " + (p.subcategory || "")).toLowerCase();
      if (
        t.includes("cassette") ||
        t.includes("ceiling") ||
        t.includes("floor type") ||
        t.includes("7.5 ton")
      ) {
        continue;
      }

      if (!usedCategories.has(p.category) && (p.featured || p.hotDeal || p.discount >= 10)) {
        selected.push(p);
        usedCategories.add(p.category);
      }
    }

    if (selected.length < 10) {
      for (const p of source) {
        if (selected.length >= 10) break;
        if (
          !selected.some((s) => s.id === p.id) &&
          p.thumbnail &&
          !p.thumbnail.includes("placeholder")
        ) {
          const t = (p.title + " " + (p.subcategory || "")).toLowerCase();
          if (
            t.includes("cassette") ||
            t.includes("ceiling") ||
            t.includes("floor type") ||
            t.includes("7.5 ton")
          ) {
            continue;
          }
          selected.push(p);
        }
      }
    }

    return selected.slice(0, 10);
  }, [source]);

  return (
    <section className="my-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg md:text-3xl font-semibold text-gray-900">Hot Deals</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2.2xl:grid-cols-5 gap-3 md:gap-4">
        {hotDeals.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};
