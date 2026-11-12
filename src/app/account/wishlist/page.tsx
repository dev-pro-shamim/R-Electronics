"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { PRODUCTS } from "@/data/products";
import { ProductCard } from "@/components/common/ProductCard";

export default function WishlistPage() {
  const { wishlist, user, logout } = useCart();
  const wishlistedProducts = PRODUCTS.filter((p) => wishlist.includes(p.id));

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-24 xl:pb-16 text-black font-sans">
      <div className="container max-w-[1442px] mx-auto p-3 md:px-8 md:py-8">
        <div className="text-xs md:text-sm text-gray-500 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/account" className="hover:text-primary">My Account</Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold">Wishlist</span>
        </div>

        <div className="grid lg:grid-cols-[280px,_1fr] gap-6">
          {/* Sidebar */}
          <aside className="bg-white rounded-lg p-5 border border-gray-200/80 shadow-xs h-max">
            <div className="flex items-center gap-3 pb-5 border-b border-gray-200">
              <div className="size-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl border border-primary/20">
                {user?.name ? user.name[0].toUpperCase() : "R"}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-gray-900 text-sm truncate">{user?.name || "Customer Account"}</p>
                <p className="text-xs text-gray-500 truncate">{user?.phone || "+8801798565001"}</p>
              </div>
            </div>

            <nav className="mt-4 space-y-1 text-sm font-medium">
              <Link
                href="/account"
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/account/order"
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                My Orders
              </Link>
              <Link
                href="/account/wishlist"
                className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-primary text-white font-semibold transition-colors"
              >
                Wishlist ({wishlist.length})
              </Link>
              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                Logout
              </button>
            </nav>
          </aside>

          {/* Content */}
          <main className="bg-white rounded-lg p-5 sm:p-6 border border-gray-200/80 shadow-xs">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 border-b pb-4 mb-6">
              My Wishlist ({wishlistedProducts.length})
            </h1>

            {wishlistedProducts.length === 0 ? (
              <div className="text-center py-16">
                <div className="size-16 rounded-full bg-rose-50 text-red-500 flex items-center justify-center mx-auto mb-3">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800">Your wishlist is empty</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Click the heart icon on any product to save your favorite items here for easy access.
                </p>
                <Link
                  href="/"
                  className="inline-block mt-5 bg-primary text-white font-bold text-xs px-6 py-2.5 rounded hover:bg-black transition-colors"
                >
                  Explore Products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {wishlistedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
