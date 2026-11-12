"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { PRODUCTS } from "@/data/products";
import { ProductCard } from "@/components/common/ProductCard";

export default function CartPage() {
  const router = useRouter();
  const {
    cart,
    removeFromCart,
    updateQuantity,
    subtotal,
    totalItems,
    discountCode,
    discountAmount,
    applyDiscountCode,
    removeDiscountCode,
  } = useCart();
  const [couponCode, setCouponCode] = useState(discountCode || "");
  const [couponApplied, setCouponApplied] = useState(Boolean(discountCode && discountAmount > 0));
  const [couponMessage, setCouponMessage] = useState("");
  const [rewardPoints, setRewardPoints] = useState("");
  const [pointsDiscount, setPointsDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    const res = await applyDiscountCode(couponCode);
    if (res.valid) {
      setCouponApplied(true);
      setCouponMessage(res.message);
      setCouponError("");
    } else {
      setCouponApplied(false);
      setCouponMessage("");
      setCouponError(res.message);
    }
  };

  const handleApplyPoints = () => {
    const pts = parseInt(rewardPoints, 10);
    if (!isNaN(pts) && pts > 0) {
      setPointsDiscount(Math.min(pts, 500));
    }
  };

  const shippingEstimate = subtotal > 0 ? (subtotal >= 100000 ? 0 : 150) : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount - pointsDiscount + shippingEstimate);

  // Suggested offer products for cart bottom
  const offerProducts = PRODUCTS.filter((p) => p.hotDeal || p.discount >= 15).slice(0, 5);

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-24 xl:pb-16 text-black font-sans">
      <div className="lg:container p-3 md:px-8 md:py-7 mt-5 rounded max-w-[1442px] mx-auto">
        <div className="bg-white md:bg-transparent lg:py-0 py-3">
          <div className="grid lg:grid-cols-[1fr,_413px] bg-gray-50/50 rounded-sm shadow-sm border border-gray-200/80">
            {/* Left Column: Cart Items */}
            <div className="bg-white rounded-s-sm px-3 lg:px-6 lg:py-7">
              {/* Header matching exact reference */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-b-gray-300">
                <svg className="size-8 sm:size-10 text-primary" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M1.33337 0C0.979742 0 0.640593 0.140476 0.390536 0.390524C0.14048 0.640573 0 0.979711 0 1.33333C0 1.68696 0.14048 2.02609 0.390536 2.27614C0.640593 2.52619 0.979742 2.66667 1.33337 2.66667H4.29347L5.36283 6.952L9.35762 28.2453C9.41482 28.5509 9.57698 28.8268 9.81606 29.0255C10.0552 29.2242 10.3561 29.333 10.667 29.3333H13.3337C11.9192 29.3333 10.5626 29.8952 9.56239 30.8954C8.56217 31.8956 8.00025 33.2522 8.00025 34.6667C8.00025 36.0812 8.56217 37.4377 9.56239 38.4379C10.5626 39.4381 11.9192 40 13.3337 40C14.7483 40 16.1049 39.4381 17.1051 38.4379C18.1053 37.4377 18.6672 36.0812 18.6672 34.6667C18.6672 33.2522 18.1053 31.8956 17.1051 30.8954C16.1049 29.8952 14.7483 29.3333 13.3337 29.3333H32.001C30.5865 29.3333 29.2299 29.8952 28.2296 30.8954C27.2294 31.8956 26.6675 33.2522 26.6675 34.6667C26.6675 36.0812 27.2294 37.4377 28.2296 38.4379C29.2299 39.4381 30.5865 40 32.001 40C33.4155 40 34.7721 39.4381 35.7723 38.4379C36.7726 37.4377 37.3345 36.0812 37.3345 34.6667C37.3345 33.2522 36.7726 31.8956 35.7723 30.8954C34.7721 29.8952 33.4155 29.3333 32.001 29.3333H34.6677C34.9786 29.333 35.2796 29.2242 35.5187 29.0255C35.7578 28.8268 35.9199 28.5509 35.9771 28.2453L39.9772 6.912C40.0133 6.71957 40.0065 6.52156 39.9573 6.33205C39.9082 6.14254 39.8179 5.96617 39.6929 5.81548C39.568 5.66478 39.4113 5.54346 39.2341 5.46014C39.057 5.37681 38.8636 5.33351 38.6679 5.33333H7.7069L6.62687 1.01067C6.55489 0.72209 6.3885 0.465863 6.15414 0.282733C5.91978 0.0996018 5.63092 8.21639e-05 5.3335 0H1.33337ZM16.0005 34.6667C16.0005 35.3739 15.7195 36.0522 15.2194 36.5523C14.7193 37.0524 14.041 37.3333 13.3337 37.3333C12.6265 37.3333 11.9482 37.0524 11.4481 36.5523C10.948 36.0522 10.667 35.3739 10.667 34.6667C10.667 33.9594 10.948 33.2811 11.4481 32.7811C11.9482 32.281 12.6265 32 13.3337 32C14.041 32 14.7193 32.281 15.2194 32.7811C15.7195 33.2811 16.0005 33.9594 16.0005 34.6667ZM34.6677 34.6667C34.6677 35.3739 34.3868 36.0522 33.8867 36.5523C33.3866 37.0524 32.7083 37.3333 32.001 37.3333C31.2937 37.3333 30.6154 37.0524 30.1153 36.5523C29.6152 36.0522 29.3342 35.3739 29.3342 34.6667C29.3342 33.9594 29.6152 33.2811 30.1153 32.7811C30.6154 32.281 31.2937 32 32.001 32C32.7083 32 33.3866 32.281 33.8867 32.7811C34.3868 33.2811 34.6677 33.9594 34.6677 34.6667ZM24.0007 12V16H28.0009C28.3545 16 28.6936 16.1405 28.9437 16.3905C29.1938 16.6406 29.3342 16.9797 29.3342 17.3333C29.3342 17.687 29.1938 18.0261 28.9437 18.2761C28.6936 18.5262 28.3545 18.6667 28.0009 18.6667H24.0007V22.6667C24.0007 23.0203 23.8603 23.3594 23.6102 23.6095C23.3601 23.8595 23.021 24 22.6674 24C22.3137 24 21.9746 23.8595 21.7245 23.6095C21.4745 23.3594 21.334 23.0203 21.334 22.6667V18.6667H17.3339C16.9802 18.6667 16.6411 18.5262 16.391 18.2761C16.141 18.0261 16.0005 17.687 16.0005 17.3333C16.0005 16.9797 16.141 16.6406 16.391 16.3905C16.6411 16.1405 16.9802 16 17.3339 16H21.334V12C21.334 11.6464 21.4745 11.3072 21.7245 11.0572C21.9746 10.8071 22.3137 10.6667 22.6674 10.6667C23.021 10.6667 23.3601 10.8071 23.6102 11.0572C23.8603 11.3072 24.0007 11.6464 24.0007 12Z"
                    fill="currentColor"
                  />
                </svg>
                <h1 className="text-xl sm:text-2xl font-semibold text-primary">
                  Shopping Cart ({totalItems})
                </h1>
              </div>

              {/* Empty Cart State */}
              {cart.length === 0 ? (
                <div className="max-w-[728px] mx-auto py-12 text-center flex flex-col items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-emerald-50 text-primary flex items-center justify-center mb-4">
                    <svg className="size-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="9" cy="21" r="1"></circle>
                      <circle cx="20" cy="21" r="1"></circle>
                      <path strokeWidth="1.5" d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Your Shopping Cart is Empty</h2>
                  <p className="text-sm text-gray-500 mb-6 max-w-md">
                    Explore our top featured 4K Smart TVs, Inverter ACs, and home appliances with 0% EMI and official warranty.
                  </p>
                  <Link
                    href="/"
                    className="bg-primary text-white font-semibold px-8 py-3 rounded-md hover:bg-black transition-colors"
                  >
                    Continue Shopping
                  </Link>
                </div>
              ) : (
                /* Cart Items List */
                <div className="divide-y divide-gray-200">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      {/* Product Thumbnail & Details */}
                      <div className="flex items-center gap-3 flex-1">
                        <Link
                          href={`/product/${item.product.slug}`}
                          className="size-20 sm:size-24 flex-shrink-0 bg-white border border-gray-200 rounded p-1 overflow-hidden"
                        >
                          <img
                            src={item.product.thumbnail || item.product.images?.[0] || "/logo.png"}
                            alt={item.product.title}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/logo.png";
                            }}
                          />
                        </Link>
                        <div>
                          <Link
                            href={`/product/${item.product.slug}`}
                            className="font-medium text-sm sm:text-base text-gray-900 hover:text-primary transition-colors line-clamp-2"
                          >
                            {item.product.title}
                          </Link>
                          <p className="text-xs text-gray-500 mt-1">
                            Brand: <span className="font-semibold text-gray-700">{item.product.brand}</span>
                          </p>
                          <p className="text-xs text-primary font-medium mt-0.5">
                            {item.product.warranty}
                          </p>
                        </div>
                      </div>

                      {/* Unit Price */}
                      <div className="text-left sm:text-center sm:w-28">
                        <p className="text-base sm:text-lg font-bold text-gray-900">
                          ৳{item.product.price.toLocaleString()}
                        </p>
                        {item.product.originalPrice > item.product.price && (
                          <p className="text-xs text-gray-400 line-through">
                            ৳{item.product.originalPrice.toLocaleString()}
                          </p>
                        )}
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex items-center border border-gray-300 rounded bg-white p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                          className="size-7 sm:size-8 grid place-items-center text-primary hover:bg-gray-100 rounded text-base font-bold"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-gray-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="size-7 sm:size-8 grid place-items-center text-primary hover:bg-gray-100 rounded text-base font-bold"
                        >
                          +
                        </button>
                      </div>

                      {/* Subtotal & Delete */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-32">
                        <p className="text-base sm:text-lg font-bold text-primary">
                          ৳{(item.product.price * item.quantity).toLocaleString()}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          title="Remove item"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Order Summary (Sticky on Desktop) */}
            <div className="bg-white p-4 lg:p-6 border-t lg:border-t-0 lg:border-l border-gray-200">
              {/* Coupon / Voucher Section */}
              <div className="mb-6">
                <h3 className="mb-2 text-base font-semibold text-gray-800">Have a Coupon or Voucher?</h3>
                <div className="flex gap-2 h-11">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    className="w-full border border-gray-300 px-3 py-2 text-sm rounded bg-white outline-none focus:border-primary uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 text-sm font-semibold rounded text-white bg-primary hover:bg-black transition-colors shrink-0"
                  >
                    Apply
                  </button>
                </div>
                {couponApplied && discountAmount > 0 && (
                  <div className="flex items-center justify-between text-xs text-emerald-600 font-semibold mt-1.5">
                    <span>✓ {couponMessage || `Coupon ${discountCode} applied!`}</span>
                    <button
                      type="button"
                      onClick={() => {
                        removeDiscountCode();
                        setCouponApplied(false);
                        setCouponCode("");
                        setCouponMessage("");
                      }}
                      className="text-red-500 underline ml-2"
                    >
                      Remove
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="text-xs text-red-500 font-medium mt-1.5">{couponError}</p>
                )}
              </div>

              {/* Reward Points */}
              <div className="mb-6 border-t pt-4">
                <h3 className="mb-2 text-base font-semibold text-gray-800">Use Reward Points</h3>
                <p className="text-xs text-gray-500 mb-2">You have 250 club points available.</p>
                <div className="flex gap-2 h-11">
                  <input
                    type="number"
                    value={rewardPoints}
                    onChange={(e) => setRewardPoints(e.target.value)}
                    placeholder="Enter points (max 250)"
                    className="w-full border border-gray-300 px-3 py-2 text-sm rounded bg-white outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPoints}
                    className="px-4 text-sm font-semibold rounded text-white bg-primary hover:bg-black transition-colors shrink-0"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between text-base font-medium">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="text-primary font-bold">৳{subtotal.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-base text-emerald-600 font-medium">
                    <span>Coupon Discount:</span>
                    <span>-৳{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-base text-emerald-600 font-medium">
                    <span>Points Discount:</span>
                    <span>-৳{pointsDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-base">
                  <span className="text-gray-700">Shipping:</span>
                  <span className="font-medium text-gray-800">
                    {shippingEstimate === 0 ? "Free Shipping" : `৳${shippingEstimate.toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-3 text-lg font-bold">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-primary text-xl font-extrabold">
                    ৳{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() => router.push("/checkout")}
                className="mt-6 h-14 font-bold text-xl w-full justify-center text-white bg-primary hover:bg-black rounded shadow transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proceed To Checkout
              </button>
            </div>
          </div>

          {/* Offer products row matching reference bottom */}
          <div className="mt-12 hidden lg:block">
            <h2 className="mb-6 text-xl font-bold text-gray-900 border-b pb-2">
              Offer Products Only For You
            </h2>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {offerProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
