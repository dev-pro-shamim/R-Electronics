"use client";

import React from "react";
import Link from "next/link";
import { useStoreRuntime } from "@/lib/useStoreRuntime";

export const MidBanners: React.FC = () => {
  const runtime = useStoreRuntime();
  const liveMid = (runtime?.banners || [])
    .filter((b) => b.placement === "mid" && b.active)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const first = liveMid[0] || {
    id: "mid-1",
    title: "Samsung TV Deals",
    image: "/banners/samsung-tv-banner.jpg",
    link: "/offer/samsung-mega-tv-deals",
  };
  const second = liveMid[1] || {
    id: "mid-2",
    title: "Rango Electronics Mega Offer",
    image: "/banners/rango-mega-offer-banner.webp",
    link: "/offer",
  };

  return (
    <section className="mt-3 mb-7.5 xl:my-10">
      <div className="flex flex-col md:flex-row gap-4 lg:gap-6">
        <Link
          className="relative aspect-[4/2] size-full block overflow-hidden rounded-3xl shadow-xs hover:shadow-md transition-shadow"
          href={first.link}
        >
          <img
            alt={first.title}
            src={first.image}
            className="w-full h-full object-cover rounded-3xl"
          />
        </Link>
        <Link
          className="relative aspect-[4/2] size-full block overflow-hidden rounded-3xl shadow-xs hover:shadow-md transition-shadow"
          href={second.link}
        >
          <img
            alt={second.title}
            src={second.image}
            className="w-full h-full object-cover rounded-3xl"
          />
        </Link>
      </div>
    </section>
  );
};
