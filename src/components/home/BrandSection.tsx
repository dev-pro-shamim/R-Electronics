"use client";

import React from "react";
import Link from "next/link";
import { BRANDS } from "@/data/brands";
import { useStoreRuntime } from "@/lib/useStoreRuntime";
import { CheckCircle2 } from "lucide-react";

export const BrandSection: React.FC = () => {
  const Marquee = "marquee" as any;
  const runtime = useStoreRuntime();

  const liveBrands =
    runtime?.brands && runtime.brands.length > 0 ? runtime.brands : BRANDS;

  return (
    <section className="container my-8 space-y-6">
      <div className="rounded-md drop-shadow-xs p-2 md:px-6 md:py-2 cursor-pointer space-x-2 bg-white border border-gray-100">
        <Marquee behavior="scroll" scrollamount="5" direction="left">
          <span className="pr-3 font-bold text-xl md:text-2xl text-gray-800 tracking-wide">
            Official Warranty &nbsp;&nbsp;|&nbsp;&nbsp; 4 Hours Delivery &nbsp;&nbsp;|&nbsp;&nbsp; 36 Months EMI Facility &nbsp;&nbsp;|&nbsp;&nbsp; Faster Delivery &nbsp;&nbsp;|&nbsp;&nbsp; Flexible Payment &nbsp;&nbsp;|&nbsp;&nbsp; Official Warranty &nbsp;&nbsp;|&nbsp;&nbsp; 4 Hours Delivery &nbsp;&nbsp;|&nbsp;&nbsp; 36 Months EMI Facility &nbsp;&nbsp;|&nbsp;&nbsp; Faster Delivery &nbsp;&nbsp;|&nbsp;&nbsp; Flexible Payment
          </span>
        </Marquee>
      </div>

      {/* Authorized Brand Pages Directory */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-2xs p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-2xl font-semibold text-gray-900">
            Official Authorized Brands
          </h2>
          <span className="text-xs font-semibold text-[#0084C7]">
            Click any brand to explore
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
          {liveBrands.map((b) => (
            <Link
              key={b.id}
              href={`/brand/${b.slug}`}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-[#0084C7] hover:shadow-xs px-3 py-3 text-center transition-all group"
            >
              {(b as { logo?: string }).logo ? (
                <img
                  src={(b as { logo?: string }).logo}
                  alt={b.name}
                  className="h-7 w-auto object-contain"
                />
              ) : (
                <span className="text-sm font-bold text-slate-800 group-hover:text-[#0084C7]">
                  {b.name}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                <CheckCircle2 className="size-3" />
                {b.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
