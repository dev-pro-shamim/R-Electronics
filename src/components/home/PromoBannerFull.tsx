"use client";

import React from "react";
import Link from "next/link";
import { useStoreRuntime } from "@/lib/useStoreRuntime";

export const PromoBannerFull: React.FC = () => {
  const runtime = useStoreRuntime();
  const livePromo = (runtime?.banners || []).find(
    (b) => b.placement === "promo_full" && b.active
  );

  const image = livePromo?.image || "/banners/11-11-mega-sale-rango.png";
  const href = livePromo?.link || "/offer";
  const alt = livePromo?.title || "11-11 Mega Sale Banner - Rango Electronics";

  return (
    <section className="mt-3 mb-7.5 xl:my-10">
      <Link className="relative block max-w-[1260px] mx-auto size-full" href={href}>
        <img
          alt={alt}
          src={image}
          className="w-full rounded-lg shadow-xs"
        />
      </Link>
    </section>
  );
};
