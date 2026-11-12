"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

export default function AccountOrdersPage() {
  const router = useRouter();
  const { user, logout, setIsAuthModalOpen } = useCart();
  const [filter, setFilter] = useState<"all" | "processing" | "delivered" | "cancelled">("all");
  const [ordersList, setOrdersList] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    const syncLiveOrders = async (baseOrders: any[]) => {
      try {
        const updated = await Promise.all(
          baseOrders.map(async (ord) => {
            try {
              const res = await fetch(
                `/api/orders/lookup?orderId=${encodeURIComponent(ord.id)}`,
                { cache: "no-store" }
              );
              if (!res.ok) return ord;
              const data = await res.json();
              if (data.found) {
                return {
                  ...ord,
                  ...(data.order || {}),
                  ...(data.override || {}),
                };
              }
            } catch {}
            return ord;
          })
        );
        if (active) setOrdersList(updated);
      } catch {}
    };

    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("rango_orders") || "[]");
      if (stored.length > 0) {
        setOrdersList(stored);
        syncLiveOrders(stored);
      } else {
        // Sample realistic orders if none in localStorage yet
        const sampleOrders = [
          {
            id: "RE-948210",
            date: "28 Oct 2026",
            status: "Delivered",
            paymentMethod: "0% EMI (12 Months - Standard Chartered Bank)",
            subtotal: 54900,
            shipping: 0,
            total: 54900,
            shippingAddress: {
              id: "addr-sample-1",
              title: "Home",
              fullName: "Tanvir Ahmed",
              phone: "01712345678",
              email: "customer@example.com",
              city: "Dhaka",
              address: "House 14, Road 6, Dhanmondi",
              isDefault: true
            },
            items: [
              {
                id: "item-1",
                title: "Samsung 315 Liters Upright Freezer (RZ32M71157F)",
                price: 109000,
                quantity: 1,
                thumbnail: "https://rangoelectronics.com/wp-content/uploads/2025/11/148.webp"
              }
            ]
          },
          {
            id: "RE-873142",
            date: "12 Oct 2026",
            status: "Processing",
            paymentMethod: "Cash On Delivery",
            subtotal: 68900,
            shipping: 60,
            total: 68960,
            shippingAddress: {
              id: "addr-sample-2",
              title: "Office",
              fullName: "Nusrat Jahan",
              phone: "01819876543",
              email: "nusrat@example.com",
              city: "Dhaka",
              address: "Sector 7, Uttara",
              isDefault: true
            },
            items: [
              {
                id: "item-2",
                title: "Haier 366L No Frost Refrigerator HRF-386TBG",
                price: 68900,
                quantity: 1,
                thumbnail: "https://rangoelectronics.com/wp-content/uploads/2025/11/150.webp"
              }
            ]
          }
        ];
        setOrdersList(sampleOrders);
        localStorage.setItem("rango_orders", JSON.stringify(sampleOrders));
        syncLiveOrders(sampleOrders);
      }
    }
    return () => {
      active = false;
    };
  }, []);

  const filteredOrders = ordersList.filter((ord) => {
    if (filter === "all") return true;
    return ord.status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-24 xl:pb-16 text-black font-sans">
      <div className="container max-w-[1442px] mx-auto p-3 md:px-8 md:py-8">
        {/* Breadcrumb */}
        <div className="text-xs md:text-sm text-gray-500 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/account" className="hover:text-primary">My Account</Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold">Orders</span>
        </div>

        <div className="grid lg:grid-cols-[280px,_1fr] gap-6">
          {/* Sidebar Account Navigation */}
          <aside className="bg-white rounded-lg p-5 border border-gray-200/80 shadow-xs h-max">
            {/* User Profile Summary */}
            <div className="flex items-center gap-3 pb-5 border-b border-gray-200">
              <div className="size-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl border border-primary/20">
                {user?.name ? user.name[0].toUpperCase() : "R"}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-gray-900 text-sm truncate">{user?.name || "Customer Account"}</p>
                <p className="text-xs text-gray-500 truncate">{user?.phone || "+8801798565001"}</p>
                <span className="inline-block text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded mt-1">
                  Verified Member
                </span>
              </div>
            </div>

            {/* Navigation Links matching Rango Electronics */}
            <nav className="mt-4 space-y-1 text-sm font-medium">
              <Link
                href="/account"
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                Dashboard
              </Link>
              <Link
                href="/account/order"
                className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-primary text-white font-semibold transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                  <path d="M3 6h18"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                My Orders
              </Link>
              <Link
                href="/account/wishlist"
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                </svg>
                Wishlist
              </Link>
              <Link
                href="/track-order"
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="16" height="13" x="1" y="6" rx="2"/>
                  <path d="M17 14h5l1.5-3-1.5-3H17"/>
                  <circle cx="6" cy="19" r="2"/>
                  <circle cx="18" cy="19" r="2"/>
                </svg>
                Track Order
              </Link>

              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" x2="9" y1="12" y2="12"/>
                </svg>
                Logout
              </button>
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="space-y-6">
            <div className="bg-white rounded-lg p-5 sm:p-6 border border-gray-200/80 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200 gap-3">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Orders</h1>
                  <p className="text-xs text-gray-500 mt-0.5">Manage and track your recent orders and invoices</p>
                </div>

                {/* Filter Tabs matching reference */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  {(["all", "processing", "delivered", "cancelled"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setFilter(tab)}
                      className={`capitalize text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                        filter === tab
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders List */}
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-sm">No orders found in this status.</p>
                  <Link
                    href="/"
                    className="inline-block mt-4 text-xs font-bold text-white bg-primary px-5 py-2.5 rounded-md hover:bg-black transition-colors"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 mt-6">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-gray-200 rounded-lg overflow-hidden shadow-2xs hover:border-primary/40 transition-colors"
                    >
                      {/* Order Card Header */}
                      <div className="bg-gray-50/80 px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-gray-200">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-bold text-sm text-primary">#{order.id}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-600">Placed on {order.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              order.status === "Delivered"
                                ? "bg-emerald-100 text-emerald-800"
                                : order.status === "Processing"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="p-4 divide-y divide-gray-100">
                        {order.items.map((item: any, iIdx: number) => (
                          <div key={iIdx} className="py-2.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.thumbnail || "/logo.png"}
                                alt={item.title}
                                className="size-14 object-contain border rounded p-1 bg-white"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/logo.png";
                                }}
                              />
                              <div>
                                <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.title}</p>
                                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-gray-900">
                              ৳{(item.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="bg-gray-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200">
                        <div className="text-xs text-gray-600">
                          Payment: <span className="font-semibold text-gray-800">{order.paymentMethod}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/invoice/${order.id}`}
                            className="px-3 py-1.5 text-xs font-bold rounded border border-gray-300 text-gray-700 hover:bg-white transition-colors"
                          >
                            View Invoice
                          </Link>
                          <Link
                            href={`/track-order?orderId=${order.id}`}
                            className="px-3 py-1.5 text-xs font-bold rounded bg-primary text-white hover:bg-black transition-colors"
                          >
                            Track Order
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
