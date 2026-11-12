"use client";

import React from "react";
import Link from "next/link";
import { X, Trash2, ShoppingBag, ArrowRight, Plus, Minus } from "lucide-react";
import { useCart } from "@/context/CartContext";

export const CartDrawer: React.FC = () => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    totalItems,
    subtotal,
    isCartDrawerOpen,
    setIsCartDrawerOpen
  } = useCart();

  if (!isCartDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartDrawerOpen(false)}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-slideLeft">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-primary text-white">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-5" />
            <h3 className="font-bold text-base">Shopping Cart ({totalItems})</h3>
          </div>
          <button
            onClick={() => setIsCartDrawerOpen(false)}
            className="p-1 rounded-md hover:bg-white/10 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="size-16 rounded-full bg-rose-50 flex items-center justify-center mb-4">
              <ShoppingBag className="size-8 text-primary" />
            </div>
            <h4 className="text-base font-bold text-gray-800 mb-1">Your cart is empty</h4>
            <p className="text-xs text-gray-500 max-w-xs mb-6">
              Looks like you haven&apos;t added any electronics to your cart yet.
            </p>
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-lg shadow-sm hover:opacity-90 transition-opacity"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-gray-100">
              {cart.map(item => (
                <div key={item.product.id} className="pt-3 first:pt-0 flex gap-3 items-center">
                  <img
                    src={item.product.thumbnail}
                    alt={item.product.title}
                    className="size-16 object-contain rounded-lg border border-gray-100 p-1 shrink-0 bg-gray-50"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-semibold text-gray-900 truncate">
                      {item.product.title}
                    </h5>
                    <p className="text-xs font-bold text-primary mt-0.5">
                      ৳{item.product.price.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-gray-200 rounded-md">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 text-gray-500 hover:text-black"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-gray-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 text-gray-500 hover:text-black"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <span className="text-[11px] text-gray-400">
                        Total: ৳{(item.product.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer Summary */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 font-medium">Subtotal:</span>
                <span className="text-lg font-bold text-primary">৳{subtotal.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-gray-400">
                Shipping and promo discounts are calculated at checkout.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/cart"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="py-2.5 px-3 bg-white border border-gray-300 text-gray-800 text-xs font-bold rounded-lg text-center hover:bg-gray-50 transition-colors"
                >
                  View Full Cart
                </Link>
                <Link
                  href="/checkout"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="py-2.5 px-3 bg-primary text-white text-xs font-bold rounded-lg text-center hover:opacity-90 flex items-center justify-center gap-1 shadow-sm transition-colors"
                >
                  <span>Checkout</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
