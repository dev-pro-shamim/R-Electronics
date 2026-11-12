"use client";

import React from "react";
import { PRODUCTS } from "@/data/products";
import { ProductCard } from "@/components/common/ProductCard";
import { useStoreRuntime } from "@/lib/useStoreRuntime";

export const HotDeals: React.FC = () => {
  const runtime = useStoreRuntime();
  const source =
    runtime?.products && runtime.products.length > 0 ? runtime.products : PRODUCTS;
  const hotDeals = source.filter((p) => p.hotDeal || p.discount >= 20).slice(0, 10);

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
