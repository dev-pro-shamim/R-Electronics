"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useStoreRuntime } from "@/lib/useStoreRuntime";

const HERO_SLIDES = [
  {
    id: "slide-ac",
    image: "/banners/slider_ac_big_sale.webp",
    title: "Big Sale AC Inverter & Non-Inverter",
    url: "/category/air-conditioner",
  },
  {
    id: "slide-tv",
    image: "/banners/slider_smart_tv.webp",
    title: "Smart TV Crystal UHD Starting Price 12,999Tk",
    url: "/category/television",
  },
  {
    id: "slide-smart-fridge",
    image: "/banners/slider_smart_fridge.webp",
    title: "Cool & Classy Smart Fridge Starting Price 29,999Tk",
    url: "/category/refrigerator",
  },
  {
    id: "slide-deep-fridge",
    image: "/banners/slider_deep_fridge.webp",
    title: "All Types Of Deep Fridge Available",
    url: "/category/refrigerator",
  },
  {
    id: "slide-washing-machine",
    image: "/banners/slider_washing_machine.webp",
    title: "Top & Front Loading Washing Machine Starting 23,999Tk",
    url: "/category/washing-machine",
  },
  {
    id: "slide-water-purifier",
    image: "/banners/slider_water_purifier.webp",
    title: "Water Purifier Starting Price 4,999Tk",
    url: "/category/water-purifiers",
  },
  {
    id: "slide-geyser",
    image: "/banners/slider_geyser.webp",
    title: "Geyser Upto 5 Years Replacement Guarantee Starting 4,999Tk",
    url: "/category/geyser-water-heaters",
  },
];

const SIDE_BANNERS = [
  {
    id: "side-1",
    image: "https://adminapi.electronicsbangladesh.com/storage/media/large/Hisense-1.5-Ton-Full-DC-Inverter-AC-3775.jpg",
    title: "Hisense 1.5 Ton Full DC Inverter AC",
    url: "/category/air-conditioner",
  },
  {
    id: "side-2",
    image: "https://adminapi.electronicsbangladesh.com/storage/media/large/Haier-7.5kg-3486.jpg",
    title: "Haier 7.5kg Top Load Washing Machine",
    url: "/category/washing-machine",
  },
];

export const HeroSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const runtime = useStoreRuntime();

  const slides = useMemo(() => {
    const live = (runtime?.banners || [])
      .filter((b) => b.placement === "hero" && b.active)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    if (live.length > 0) {
      return live.map((b) => ({
        id: b.id,
        image: b.image,
        title: b.title,
        url: b.link || "/",
      }));
    }
    return HERO_SLIDES;
  }, [runtime?.banners]);

  const sideBanners = useMemo(() => {
    const live = (runtime?.banners || [])
      .filter((b) => b.placement === "side" && b.active)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    if (live.length > 0) {
      return live.map((b) => ({
        id: b.id,
        image: b.image,
        title: b.title,
        url: b.link || "/",
      }));
    }
    return SIDE_BANNERS;
  }, [runtime?.banners]);

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <section className="grid grid-cols-2 lg:grid-cols-3 3xl:grid-cols-[954px_,1fr] gap-2 lg:gap-4 mt-4 lg:mt-5">
      {/* Main Hero Slider (Takes 2 cols on mobile/tablet, left col spanning 2 rows on desktop) */}
      <div
        className="relative overflow-hidden rounded-lg col-span-2 3xl:col-span-1 lg:row-span-2 pb-[45.25%] lg:pb-0 h-[210px] sm:h-[320px] md:h-[380px] lg:h-[432px]"
        aria-label="Hero Slider"
        role="region"
      >
        <div className="overflow-hidden h-full absolute inset-0">
          <div
            className="flex h-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slides.map((slide, idx) => (
              <Link
                key={slide.id}
                href={slide.url}
                className="flex-[0_0_100%] h-full relative block"
              >
                <figure className="relative h-full w-full">
                  <img
                    alt={slide.title}
                    src={slide.image}
                    loading={idx === 0 ? "eager" : "lazy"}
                    className="w-full h-full object-fill rounded-lg"
                  />
                </figure>
              </Link>
            ))}
          </div>

          {/* Left / Right Arrow Navigation */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous Slide"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors shadow"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next Slide"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors shadow"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Dots Indicator */}
          <div
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20"
            role="navigation"
            aria-label="Carousel dots"
          >
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setCurrentSlide(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentSlide === i ? "w-6 bg-primary" : "w-2 bg-white/70 hover:bg-white"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 2 Promotional Side Banners (side-by-side on mobile, stacked vertically on desktop) */}
      {sideBanners.map((banner) => (
        <Link
          key={banner.id}
          href={banner.url}
          className="relative flex pb-[45.25%] max-h-[210px] overflow-hidden rounded-lg group col-span-1 shadow-sm hover:shadow-md transition-shadow"
        >
          <img
            alt={banner.title}
            src={banner.image}
            loading="lazy"
            className="rounded-lg absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
      ))}
    </section>
  );
};
