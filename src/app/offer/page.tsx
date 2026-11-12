import React from "react";
import Link from "next/link";
import { Sparkles, Flame, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/common/ProductCard";
import { readAdminDbCached } from "@/lib/adminDb";
import { getMergedCatalogProducts, toCardProduct } from "@/lib/adminServerHelpers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Special Offers, Hot Deals & 0% EMI | Rango Electronics",
  description:
    "Explore mega festival discounts up to 40% OFF + 0% EMI on genuine Smart TVs, Inverter ACs, Refrigerators & Washing Machines at Rango Electronics.",
  alternates: { canonical: "https://rangoelectronics.com/offer" },
};

export default function OfferPage() {
  const db = readAdminDbCached();
  const activeOfferProductIds = new Set(
    (db.offers || [])
      .filter((o) => o.active !== false && o.productId)
      .map((o) => o.productId)
  );
  const hotDeals = getMergedCatalogProducts(db, { includeReviews: false })
    .filter(
      (p) =>
        p.status !== "draft" &&
        p.status !== "archived" &&
        (p.discount >= 20 || p.hotDeal || activeOfferProductIds.has(p.id))
    )
    .map(toCardProduct);

  return (
    <div className="bg-gray-50/50 min-h-screen py-6 md:py-10">
      <div className="container">
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          <ChevronRight className="size-3.5 text-gray-400" />
          <span className="text-gray-800 font-semibold">Special Offers &amp; Campaigns</span>
        </nav>

        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#0084C7] via-[#006DA6] to-[#FF7A00] text-white p-8 md:p-12 mb-8 shadow-sm">
          <div className="max-w-xl space-y-3 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider">
              <Sparkles className="size-3.5" />
              <span>Mega Festival Campaign 2026</span>
            </span>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Up to 40% OFF + 0% EMI
            </h1>
            <p className="text-xs sm:text-sm text-sky-100 leading-relaxed">
              Shop genuine 4K TVs, Inverter ACs, Side-by-Side Refrigerators, and Smart Washing Machines with official warranty &amp; express nationwide delivery.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
            <Flame className="size-6 text-[#FF7A00]" />
            <h2 className="text-xl font-black text-gray-900">Featured Mega Discount Deals</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {hotDeals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
