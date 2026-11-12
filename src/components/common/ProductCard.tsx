"use client";

import React from "react";
import Link from "next/link";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { getRuntimeProductById, useStoreRuntime } from "@/lib/useStoreRuntime";
import { ShoppingCart, Heart, ArrowLeftRight, Star } from "lucide-react";

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

const ProductCardInner: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, toggleWishlist, isInWishlist, addToCompare, removeFromCompare, isInCompare } =
    useCart();
  const runtime = useStoreRuntime();

  // O(1) lookup for live admin/catalog state (featured thumbnail, prices, dynamic approved reviews count)
  const runtimeMatch = getRuntimeProductById(runtime, product.id);
  const live = runtimeMatch || product;

  const wishlisted = isInWishlist(live.id);
  const inCompare = isInCompare(live.id);

  const discount =
    live.discount > 0
      ? live.discount
      : live.originalPrice > live.price
      ? Math.round(((live.originalPrice - live.price) / live.originalPrice) * 100)
      : 0;

  // Dynamic approved review count: strictly 0 if runtime/server didn't supply approved reviews (never hardcoded 11)
  const reviewCount = runtimeMatch
    ? Number(runtimeMatch.reviewsCount ?? 0)
    : typeof product.reviewsCount === "number"
    ? product.reviewsCount
    : 0;

  const displayRating =
    reviewCount > 0
      ? Number(runtimeMatch?.rating ?? live.rating ?? 5)
      : 0;

  const thumbnail = live.thumbnail || live.images?.[0] || "/logo.png";
  const isOutOfStock =
    Boolean((live as Product & { isStockOut?: boolean }).isStockOut) ||
    (typeof (live as Product & { stock?: number }).stock === "number" &&
      Number((live as Product & { stock?: number }).stock) <= 0);

  return (
    <article className="group rounded-xl bg-white p-3 md:p-3.5 flex flex-col relative border border-transparent hover:border-[#0084C7]/35 transition-all duration-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-md w-full">
      {/* Top Bar: Discount / Status Pill + Clean Circular Action Icons */}
      <div className="flex items-center justify-between gap-2 min-h-[28px]">
        {isOutOfStock ? (
          <span className="bg-slate-700 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full leading-tight">
            Stock Out
          </span>
        ) : discount > 0 ? (
          <span className="bg-[#0084C7] text-white text-[11px] md:text-xs font-bold px-2.5 py-0.5 rounded-full leading-tight">
            -{discount}%
          </span>
        ) : (
          <span className="bg-amber-500/15 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full leading-tight">
            Featured
          </span>
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            aria-label="Add to cart"
            title="Add to cart"
            disabled={isOutOfStock}
            onClick={(e) => {
              e.preventDefault();
              addToCart(live, 1);
            }}
            className="size-7 rounded-full bg-[#F4F5F7] text-[#374151] grid place-items-center hover:bg-[#0084C7] hover:text-white transition-colors disabled:opacity-40"
          >
            <ShoppingCart className="size-3.5" />
          </button>

          <button
            type="button"
            aria-label={inCompare ? "Remove from compare" : "Add to compare"}
            title={inCompare ? "In Compare list" : "Compare this product"}
            onClick={(e) => {
              e.preventDefault();
              if (inCompare) {
                removeFromCompare(live.id);
              } else {
                addToCompare(live);
              }
            }}
            className={`size-7 rounded-full grid place-items-center transition-colors ${
              inCompare
                ? "bg-sky-100 text-[#0084C7]"
                : "bg-[#F4F5F7] text-[#6B7280] hover:bg-[#0084C7] hover:text-white"
            }`}
          >
            <ArrowLeftRight className="size-3.5" />
          </button>

          <button
            type="button"
            aria-label="Add to wishlist"
            title={wishlisted ? "Saved in wishlist" : "Add to wishlist"}
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist(live.id);
            }}
            className={`size-7 rounded-full grid place-items-center transition-colors ${
              wishlisted
                ? "bg-orange-100 text-[#FF7A00]"
                : "bg-[#F4F5F7] text-[#6B7280] hover:bg-[#FF7A00] hover:text-white"
            }`}
          >
            <Heart className={`size-3.5 ${wishlisted ? "fill-[#FF7A00]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Product Square Photo Frame + Title */}
      <Link className="block flex-1 mt-2" href={`/product/${live.slug}`}>
        <figure className="relative aspect-square overflow-hidden rounded-lg bg-white flex items-center justify-center p-2">
          <img
            alt={live.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
            src={thumbnail}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/logo.png";
            }}
          />
        </figure>
        <h3 className="mt-2.5 text-[13px] md:text-[14px] leading-snug font-medium text-[#111827] group-hover:text-[#0084C7] transition-colors line-clamp-2 min-h-[2.45rem]">
          {live.title}
        </h3>
      </Link>

      {/* Price, Dynamic 5-Star Rating + Express Pill */}
      <div className="mt-2 pt-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-base md:text-lg font-bold text-[#0084C7] tracking-tight">
            ৳ {Number(live.price || 0).toLocaleString()}
          </span>
          {live.originalPrice && live.originalPrice > live.price && (
            <span className="text-xs text-[#6B7280] line-through">
              ৳ {Number(live.originalPrice).toLocaleString()}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-1.5">
          <div className="flex items-center gap-1 min-w-0">
            <div className="flex items-center gap-0.5" title={reviewCount > 0 ? `${displayRating}/5 from ${reviewCount} approved reviews` : "No approved reviews yet"}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`size-3.5 ${
                    displayRating >= star - 0.3
                      ? "fill-[#FF8A00] text-[#FF8A00]"
                      : "fill-slate-200 text-slate-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-medium text-[#6B7280]">
              ({reviewCount})
            </span>
          </div>

          {!isOutOfStock && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50/80 text-[10px] font-extrabold italic tracking-tight text-emerald-700 shrink-0">
              express
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

export const ProductCard = React.memo(ProductCardInner);
