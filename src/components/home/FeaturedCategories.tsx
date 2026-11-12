"use client";

import React from "react";
import Link from "next/link";
import { useStoreRuntime } from "@/lib/useStoreRuntime";

const FEATURED_CATS = [
  {
    name: "Home Appliance",
    slug: "home-appliance",
    icon: "https://adminapi.electronicsbangladesh.com/storage/media/thumb/Group.jpg-9636.jpeg",
  },
  {
    name: "Air Conditioner",
    slug: "air-conditioner",
    icon: "https://adminapi.electronicsbangladesh.com/storage/media/thumb/Group-991-9330.png",
  },
  {
    name: "Refrigerator",
    slug: "refrigerator",
    icon: "https://adminapi.electronicsbangladesh.com/storage/media/thumb/Group-992-3219.png",
  },
  {
    name: "Television",
    slug: "television",
    icon: "https://adminapi.electronicsbangladesh.com/storage/media/thumb/Vector-(5)-7128.png",
  },
  {
    name: "Washing Machine",
    slug: "washing-machine",
    icon: "https://adminapi.electronicsbangladesh.com/storage/media/thumb/Vector-(2)-5417.png",
  },
  {
    name: "Microwave Oven",
    slug: "microwave-oven",
    icon: "https://adminapi.electronicsbangladesh.com/storage/media/thumb/Air-Fryer-4677.png",
  },
  {
    name: "Water Purifiers",
    slug: "water-purifiers",
    icon: "https://adminapi.electronicsbangladesh.com/storage/media/thumb/Group-1003-2777.png",
  },
  {
    name: "Geyser & Heaters",
    slug: "geyser-water-heaters",
    icon: "https://adminapi.electronicsbangladesh.com/storage/media/thumb/deep-freezer-icon-01-7690.png",
  },
];

const FALLBACK_ICONS = new Map(FEATURED_CATS.map((c) => [c.slug, c.icon]));

export const FeaturedCategories: React.FC = () => {
  const runtime = useStoreRuntime();

  const items =
    runtime?.categories && runtime.categories.length > 0
      ? runtime.categories
          .filter((c) => c.slug !== "service-repair")
          .map((c) => ({
            name: c.name,
            slug: c.slug,
            icon: c.image || c.icon || FALLBACK_ICONS.get(c.slug) || "/logo.png",
          }))
      : FEATURED_CATS;

  return (
    <section className="mb-5 lg:my-8">
      <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">Featured Categories</h2>
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4 mt-6 md:mt-10">
        {items.map((cat) => (
          <Link
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className="flex flex-col items-center justify-center bg-white py-2.5 md:pb-2.5 md:pt-3.5 px-2 group transition-shadow duration-300 rounded md:rounded-lg cursor-pointer border border-transparent hover:border-gray-200 hover:shadow-sm"
          >
            <figure className="w-full h-10 md:h-20 md:max-w-20 relative flex items-center justify-center">
              <img
                alt={cat.name}
                loading="lazy"
                className="object-contain max-h-full max-w-full"
                src={cat.icon}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/logo.png";
                }}
              />
            </figure>
            <p className="text-xs md:text-sm font-medium text-gray-800 mt-2 text-center group-hover:text-primary transition-colors line-clamp-2">
              {cat.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
};
