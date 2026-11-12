"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";
import {
  User as UserIcon,
  ShoppingBag,
  Truck,
  Heart,
  MapPin,
  MessageSquare,
  FileText,
  ShieldCheck,
  LogOut,
  Plus,
  ExternalLink,
  Printer,
  ChevronRight,
  Search,
  Star,
  CheckCircle2,
  Clock,
  PackageCheck,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { PRODUCTS } from "@/data/products";
import { ProductCard } from "@/components/common/ProductCard";
import AuthPanel from "@/components/common/AuthPanel";

type AccountTab =
  | "orders"
  | "tracking"
  | "wishlist"
  | "addresses"
  | "profile"
  | "reviews"
  | "privacy"
  | "terms";

const VALID_TABS: AccountTab[] = [
  "orders",
  "tracking",
  "wishlist",
  "addresses",
  "profile",
  "reviews",
  "privacy",
  "terms",
];

function getItemTitle(it: any): string {
  return String(it?.product?.title || it?.title || it?.name || "Product");
}

function getItemPrice(it: any): number {
  return Number(it?.product?.price ?? it?.price ?? it?.unitPrice ?? 0) || 0;
}

function getItemQty(it: any): number {
  return Number(it?.quantity ?? it?.qty ?? 1) || 1;
}

interface TrackedOrderResult {
  found: boolean;
  order?: any;
  override?: any;
  invoice?: any;
  booking?: any;
}

interface CustomerReviewItem {
  id: string;
  productId: string;
  productTitle?: string;
  rating: number;
  title?: string;
  comment: string;
  status: string;
  createdAt: string;
}

function AccountContent() {
  const searchParams = useSearchParams();
  const initialParam = (searchParams.get("tab") || "orders") as AccountTab;
  const initialTab: AccountTab = VALID_TABS.includes(initialParam)
    ? initialParam
    : "orders";

  const {
    user,
    authLoading,
    logout,
    wishlist,
    orders,
    addAddress,
    setAuthenticatedUser,
    showToast,
  } = useCart();

  const [activeTab, setActiveTab] = useState<AccountTab>(initialTab);

  // Server-merged customer orders
  const [serverOrders, setServerOrders] = useState<any[]>([]);

  // Order tracking tab state
  const [trackInputId, setTrackInputId] = useState("");
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState("");
  const [trackResult, setTrackResult] = useState<TrackedOrderResult | null>(null);

  // Profile form state
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");

  // New address form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrTitle, setAddrTitle] = useState("Home");
  const [addrName, setAddrName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrCity, setAddrCity] = useState("Dhaka");
  const [addrStreet, setAddrStreet] = useState("");

  // Customer reviews tab state
  const [myReviews, setMyReviews] = useState<CustomerReviewItem[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const displayName =
    typeof user?.name === "string" && user.name.trim()
      ? user.name.trim()
      : user?.phone || user?.email || "Customer";
  const userInitial = displayName.charAt(0).toUpperCase() || "C";

  useEffect(() => {
    if (user) {
      setProfileName(displayName);
      setProfileEmail(user.email || "");
      setAddrName(displayName);
      setAddrPhone(user.phone || "");
    }
  }, [user, displayName]);

  // Fetch customer's server-synced orders when phone is present
  useEffect(() => {
    if (!user?.phone && !user?.email) return;
    if (user?.phone) {
      fetch(`/api/orders/lookup?phone=${encodeURIComponent(user.phone)}`, {
        cache: "no-store",
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.found && Array.isArray(data.orders)) {
            setServerOrders(data.orders);
          }
        })
        .catch(() => {});
    }
  }, [user?.phone, user?.email]);

  // Fetch customer's own reviews when opening My Reviews tab
  useEffect(() => {
    if (activeTab !== "reviews" || !user) return;
    setReviewsLoading(true);
    const params = new URLSearchParams();
    if (user.email) params.set("userEmail", user.email);
    if (displayName) params.set("userName", displayName);
    fetch(`/api/reviews?${params.toString()}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.reviews)) {
          setMyReviews(data.reviews);
        }
      })
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  }, [activeTab, user, displayName]);

  const safeWishlist = Array.isArray(wishlist) ? wishlist : [];
  const localOrders = Array.isArray(orders) ? orders : [];

  // Deduplicate merged local + server orders by ID
  const orderMap = new Map<string, any>();
  for (const o of localOrders) {
    if (o && o.id) orderMap.set(String(o.id), o);
  }
  for (const so of serverOrders) {
    if (so && so.id && !orderMap.has(String(so.id))) {
      orderMap.set(String(so.id), so);
    }
  }
  const safeOrders = Array.from(orderMap.values());
  const wishlistedProducts = PRODUCTS.filter((p) => safeWishlist.includes(p.id));
  const safeAddresses = Array.isArray(user?.addresses) ? user.addresses : [];

  const runTrackLookup = useCallback(
    async (idToTrack: string) => {
      const cleaned = idToTrack.trim().replace(/^#/, "");
      if (!cleaned) {
        setTrackError("Please enter a valid Order ID (e.g. RE-147321).");
        return;
      }
      setTrackInputId(cleaned);
      setTrackLoading(true);
      setTrackError("");
      setTrackResult(null);

      try {
        const res = await fetch(
          `/api/orders/lookup?orderId=${encodeURIComponent(cleaned)}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.found) {
            setTrackResult(data);
            setTrackLoading(false);
            return;
          }
        }
      } catch {
        // fallback to local orders
      }

      const localMatch = safeOrders.find(
        (o) => String(o.id || "").toLowerCase() === cleaned.toLowerCase()
      );
      if (localMatch) {
        setTrackResult({ found: true, order: localMatch });
      } else {
        setTrackError(
          `No order found matching "${cleaned}". Please verify your Order ID and try again.`
        );
      }
      setTrackLoading(false);
    },
    [safeOrders]
  );

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runTrackLookup(trackInputId);
  };

  const openOrderTracking = (orderId: string) => {
    setActiveTab("tracking");
    runTrackLookup(orderId);
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (addrStreet && addrPhone && addrName) {
      addAddress({
        title: addrTitle,
        fullName: addrName,
        phone: addrPhone,
        email: user?.email || `${addrPhone}@rangomember.com`,
        city: addrCity,
        address: addrStreet,
        isDefault: false,
      });
      setShowAddressForm(false);
      setAddrStreet("");
      showToast("Delivery address added cleanly.");
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setAuthenticatedUser({
      id: user.id,
      fullName: profileName.trim() || displayName,
      email: profileEmail.trim(),
      phone: user.phone || "",
      addresses: safeAddresses,
    });
    showToast("Account details updated successfully.");
  };

  if (authLoading) {
    return (
      <div className="bg-transparent min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="size-8 rounded-full border-2 border-[#0084C7] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-medium text-slate-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-transparent min-h-screen py-10 md:py-14 px-4">
        <AuthPanel variant="page" />
      </div>
    );
  }

  const sidebarMenu: Array<{
    id: AccountTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    {
      id: "profile",
      label: "Account Details",
      icon: <UserIcon className="size-4" />,
    },
    {
      id: "orders",
      label: "Order",
      icon: <ShoppingBag className="size-4" />,
      badge: safeOrders.length > 0 ? safeOrders.length : undefined,
    },
    {
      id: "tracking",
      label: "Order Tracking",
      icon: <Truck className="size-4" />,
    },
    {
      id: "wishlist",
      label: "My Wishlist",
      icon: <Heart className="size-4" />,
      badge: wishlistedProducts.length > 0 ? wishlistedProducts.length : undefined,
    },
    {
      id: "addresses",
      label: "Addresses",
      icon: <MapPin className="size-4" />,
    },
    {
      id: "reviews",
      label: "My Reviews",
      icon: <MessageSquare className="size-4" />,
    },
    {
      id: "privacy",
      label: "Privacy Policy",
      icon: <ShieldCheck className="size-4" />,
    },
    {
      id: "terms",
      label: "Terms & Conditions",
      icon: <FileText className="size-4" />,
    },
  ];

  const trackedOrderObj = trackResult?.order || trackResult?.invoice;
  const trackedStatus = String(
    trackResult?.override?.status || trackedOrderObj?.status || "Processing"
  ).toLowerCase();
  const trackStep = trackedStatus.includes("deliver")
    ? 4
    : trackedStatus.includes("ship") ||
      trackedStatus.includes("transit") ||
      trackedStatus.includes("dispatch") ||
      trackResult?.booking
    ? 3
    : trackedStatus.includes("process") || trackedStatus.includes("confirm")
    ? 2
    : 1;

  return (
    <div className="bg-transparent min-h-screen py-6 md:py-10">
      <div className="container max-w-[1320px]">
        <div className="grid grid-cols-1 lg:grid-cols-[290px,_1fr] gap-6 items-start">
          {/* Left Navigation Sidebar */}
          <aside className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
            {/* Customer Profile Header */}
            <div className="p-5 flex items-center gap-3.5 border-b border-gray-100">
              <div className="size-14 rounded-full bg-sky-50 border-2 border-[#0084C7]/20 text-[#0084C7] flex items-center justify-center font-bold text-xl shrink-0">
                {userInitial}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base text-gray-900 truncate">
                  {displayName}
                </h3>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {user.phone || user.email || "Verified Customer"}
                </p>
              </div>
            </div>

            {/* Clean Vertical Menu Rows */}
            <nav className="py-2">
              {sidebarMenu.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[#0084C7] text-white font-semibold"
                        : "text-gray-700 hover:bg-sky-50/70 hover:text-[#0084C7]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                      {typeof item.badge === "number" && (
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </span>
                    <ChevronRight
                      className={`size-4 ${isActive ? "text-white" : "text-gray-400"}`}
                    />
                  </button>
                );
              })}

              <div className="border-t border-gray-100 mt-2 pt-2">
                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <LogOut className="size-4" />
                    <span>Log Out</span>
                  </span>
                  <ChevronRight className="size-4 text-red-300" />
                </button>
              </div>
            </nav>
          </aside>

          {/* Right Dashboard Panel */}
          <main className="bg-white rounded-2xl border border-gray-200/90 p-6 md:p-8 shadow-xs min-h-[520px]">
            {/* 1. ORDER TAB */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
                  <div>
                    <h2 className="text-xl font-bold text-[#0084C7]">My Orders</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      View order history, print official invoices, or track live delivery status.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("tracking")}
                    className="px-4 py-2 bg-[#FF7A00] hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Truck className="size-3.5" />
                    <span>Track Any Order</span>
                  </button>
                </div>

                {safeOrders.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <div className="size-14 rounded-full bg-sky-50 text-[#0084C7] flex items-center justify-center mx-auto">
                      <ShoppingBag className="size-7" />
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm">No orders placed yet</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Your completed orders, tracking details, and printable official invoices will appear here.
                    </p>
                    <Link
                      href="/"
                      className="inline-block px-5 py-2.5 bg-[#0084C7] text-white text-xs font-bold rounded-xl hover:bg-[#006DA6] transition-colors"
                    >
                      Browse Electronics
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {safeOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-5 rounded-xl border border-gray-200 bg-slate-50/60 space-y-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-200 text-xs">
                          <div>
                            <span className="font-bold text-gray-900 text-sm">
                              Order #{order.id}
                            </span>
                            <span className="text-gray-400 ml-2">• {order.date || "Recent"}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold text-[11px]">
                              {order.status || "Processing"}
                            </span>
                            <button
                              type="button"
                              onClick={() => openOrderTracking(order.id)}
                              className="px-3 py-1.5 rounded-lg bg-sky-50 text-[#0084C7] hover:bg-[#0084C7] hover:text-white font-bold transition-colors flex items-center gap-1"
                            >
                              <Truck className="size-3.5" />
                              <span>Track</span>
                            </button>
                            <Link
                              href={`/invoice/${order.id}`}
                              className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:border-[#0084C7] hover:text-[#0084C7] font-bold transition-colors flex items-center gap-1"
                            >
                              <span>Invoice</span>
                              <ExternalLink className="size-3" />
                            </Link>
                            <Link
                              href={`/invoice/${order.id}?print=1`}
                              className="px-3 py-1.5 rounded-lg bg-[#0084C7] text-white hover:bg-[#006DA6] font-bold transition-colors flex items-center gap-1"
                            >
                              <Printer className="size-3.5" />
                              <span>Print</span>
                            </Link>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {(Array.isArray(order.items) ? order.items : []).map(
                            (it: any, idx: number) => {
                              const title = getItemTitle(it);
                              const qty = getItemQty(it);
                              const price = getItemPrice(it);
                              return (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-xs"
                                >
                                  <span className="font-medium text-gray-800">
                                    {title} × {qty}
                                  </span>
                                  <span className="font-bold text-gray-900">
                                    ৳{(price * qty).toLocaleString()}
                                  </span>
                                </div>
                              );
                            }
                          )}
                        </div>

                        <div className="pt-2.5 border-t border-gray-200 flex flex-wrap justify-between items-center gap-2 text-xs">
                          <span className="text-gray-500">
                            Payment: {order.paymentMethod || "Cash On Delivery"}
                          </span>
                          <span className="font-black text-sm text-[#0084C7]">
                            Total: ৳{(Number(order.total) || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. ORDER TRACKING TAB */}
            {activeTab === "tracking" && (
              <div className="space-y-6">
                <div className="pb-4 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-[#0084C7]">Order Tracking</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Track your shipment milestone, courier dispatch status, and invoice in real time.
                  </p>
                </div>

                {/* Search Form */}
                <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="size-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={trackInputId}
                      onChange={(e) => setTrackInputId(e.target.value)}
                      placeholder="Enter your Order ID (e.g. RE-147321)"
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:border-[#0084C7] outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={trackLoading}
                    className="px-6 py-2.5 bg-[#0084C7] hover:bg-[#006DA6] text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-60"
                  >
                    {trackLoading ? "Tracking..." : "Track Order"}
                  </button>
                </form>

                {/* Quick Pick From Customer's Recent Orders */}
                {safeOrders.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-gray-500 font-semibold">Recent Orders:</span>
                    {safeOrders.slice(0, 4).map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => runTrackLookup(o.id)}
                        className="px-3 py-1 rounded-full bg-sky-50 hover:bg-[#0084C7] text-[#0084C7] hover:text-white font-semibold transition-colors border border-sky-200"
                      >
                        #{o.id}
                      </button>
                    ))}
                  </div>
                )}

                {trackError && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                    {trackError}
                  </div>
                )}

                {/* Tracking Progress Result */}
                {trackResult?.found && trackedOrderObj && (
                  <div className="p-6 rounded-2xl border border-gray-200 bg-slate-50/70 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-200">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          Order Reference
                        </p>
                        <h3 className="text-lg font-black text-gray-900">
                          #{trackedOrderObj.id || trackedOrderObj.orderId}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="px-3 py-1 rounded-full bg-sky-100 text-[#0084C7] text-xs font-bold">
                          {trackResult.override?.status || trackedOrderObj.status || "Processing"}
                        </span>
                        <Link
                          href={`/invoice/${trackedOrderObj.id || trackedOrderObj.orderId}`}
                          className="px-3.5 py-1.5 rounded-xl bg-[#FF7A00] text-white text-xs font-bold hover:bg-orange-600 transition-colors"
                        >
                          View Invoice
                        </Link>
                      </div>
                    </div>

                    {/* 4-Step Progress Stepper */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { step: 1, title: "Order Placed", icon: <CheckCircle2 className="size-4" /> },
                        { step: 2, title: "Processing", icon: <Clock className="size-4" /> },
                        { step: 3, title: "Out for Delivery", icon: <Truck className="size-4" /> },
                        { step: 4, title: "Delivered", icon: <PackageCheck className="size-4" /> },
                      ].map((s) => {
                        const done = trackStep >= s.step;
                        return (
                          <div
                            key={s.step}
                            className={`p-3.5 rounded-xl border text-xs transition-colors ${
                              done
                                ? "bg-white border-[#0084C7] shadow-2xs"
                                : "bg-gray-100/60 border-gray-200 text-gray-400"
                            }`}
                          >
                            <div
                              className={`size-7 rounded-full flex items-center justify-center mb-2 ${
                                done
                                  ? "bg-[#0084C7] text-white"
                                  : "bg-gray-200 text-gray-500"
                              }`}
                            >
                              {s.icon}
                            </div>
                            <p className={`font-bold ${done ? "text-gray-900" : "text-gray-400"}`}>
                              {s.title}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Courier Dispatch Details if Available */}
                    {trackResult.booking && (
                      <div className="p-4 rounded-xl bg-white border border-sky-200 text-xs flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <span className="text-gray-500 font-semibold">Courier Partner: </span>
                          <span className="font-bold text-gray-900">
                            {trackResult.booking.courierName || "Rango Express"}
                          </span>
                        </div>
                        {trackResult.booking.trackingCode && (
                          <div>
                            <span className="text-gray-500 font-semibold">Tracking Code: </span>
                            <span className="font-bold text-[#0084C7]">
                              {trackResult.booking.trackingCode}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. ACCOUNT DETAILS TAB */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="pb-4 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-[#0084C7]">Account Details</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Update your personal contact details for faster checkout and notifications.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md text-xs">
                  <div>
                    <label className="text-gray-700 font-semibold block mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border border-gray-300 focus:border-[#0084C7] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-gray-700 font-semibold block mb-1.5">
                      Registered Phone Number
                    </label>
                    <input
                      type="tel"
                      disabled
                      value={user.phone || ""}
                      placeholder="Not set"
                      className="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-gray-700 font-semibold block mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border border-gray-300 focus:border-[#0084C7] outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#0084C7] hover:bg-[#006DA6] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    Save Changes
                  </button>
                </form>
              </div>
            )}

            {/* 4. WISHLIST TAB */}
            {activeTab === "wishlist" && (
              <div className="space-y-6">
                <div className="pb-4 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-[#0084C7]">My Wishlist</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Products you saved to revisit or compare later.
                  </p>
                </div>

                {wishlistedProducts.length === 0 ? (
                  <div className="py-14 text-center space-y-3">
                    <div className="size-14 rounded-full bg-orange-50 text-[#FF7A00] flex items-center justify-center mx-auto">
                      <Heart className="size-7" />
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm">Wishlist is empty</h3>
                    <p className="text-xs text-gray-500">
                      Click the heart icon on any product card to save it here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {wishlistedProducts.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. ADDRESSES TAB */}
            {activeTab === "addresses" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
                  <div>
                    <h2 className="text-xl font-bold text-[#0084C7]">Saved Addresses</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Manage shipping locations for faster checkout across Bangladesh.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(!showAddressForm)}
                    className="px-4 py-2 bg-[#0084C7] hover:bg-[#006DA6] text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                  >
                    <Plus className="size-3.5" />
                    <span>Add New Address</span>
                  </button>
                </div>

                {showAddressForm && (
                  <form
                    onSubmit={handleAddAddress}
                    className="p-5 rounded-xl bg-slate-50 border border-gray-200 space-y-3 text-xs"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        placeholder="Label (e.g. Home, Office)"
                        value={addrTitle}
                        onChange={(e) => setAddrTitle(e.target.value)}
                        className="px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white outline-none focus:border-[#0084C7]"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Recipient Full Name"
                        value={addrName}
                        onChange={(e) => setAddrName(e.target.value)}
                        className="px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white outline-none focus:border-[#0084C7]"
                      />
                      <input
                        type="tel"
                        required
                        placeholder="Phone Number"
                        value={addrPhone}
                        onChange={(e) => setAddrPhone(e.target.value)}
                        className="px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white outline-none focus:border-[#0084C7]"
                      />
                      <input
                        type="text"
                        required
                        placeholder="City / District"
                        value={addrCity}
                        onChange={(e) => setAddrCity(e.target.value)}
                        className="px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white outline-none focus:border-[#0084C7]"
                      />
                    </div>
                    <textarea
                      required
                      rows={2}
                      placeholder="Full Delivery Address (House, Road, Area)"
                      value={addrStreet}
                      onChange={(e) => setAddrStreet(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white outline-none focus:border-[#0084C7]"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="px-4 py-2 rounded-xl border border-gray-300 font-semibold text-gray-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-[#0084C7] text-white font-bold"
                      >
                        Save Address
                      </button>
                    </div>
                  </form>
                )}

                {safeAddresses.length === 0 ? (
                  <p className="text-xs text-gray-500 py-6">
                    No saved addresses yet. Click &ldquo;Add New Address&rdquo; above to add one.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {safeAddresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="p-4 rounded-xl border border-gray-200 bg-slate-50/50 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#0084C7] bg-sky-50 px-2.5 py-0.5 rounded-md">
                            {addr.title}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[10px] text-emerald-600 font-bold">
                              Default Address
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-gray-800 pt-1">{addr.fullName}</p>
                        <p className="text-xs text-gray-600">{addr.address}</p>
                        <p className="text-xs text-gray-600">{addr.city}, Bangladesh</p>
                        <p className="text-xs text-gray-500 pt-1">Phone: {addr.phone}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 6. MY REVIEWS TAB */}
            {activeTab === "reviews" && (
              <div className="space-y-6">
                <div className="pb-4 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-[#0084C7]">My Reviews</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Track approval status of reviews you have submitted on products.
                  </p>
                </div>

                {reviewsLoading ? (
                  <p className="text-xs text-gray-500 py-8">Loading your reviews...</p>
                ) : myReviews.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <div className="size-12 rounded-full bg-amber-50 text-[#FF8A00] flex items-center justify-center mx-auto">
                      <Star className="size-6" />
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm">No reviews submitted yet</h3>
                    <p className="text-xs text-gray-500">
                      Visit any product page to share your feedback with other shoppers.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-4 rounded-xl border border-gray-200 bg-slate-50/60 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-gray-900">
                            {rev.productTitle || rev.productId}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              rev.status === "Approved"
                                ? "bg-emerald-100 text-emerald-700"
                                : rev.status === "Rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {rev.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 text-[#FF8A00]">
                          {Array.from({ length: rev.rating }).map((_, idx) => (
                            <Star key={idx} className="size-3.5 fill-[#FF8A00]" />
                          ))}
                        </div>
                        {rev.title && <p className="font-semibold text-gray-800">{rev.title}</p>}
                        <p className="text-gray-600">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 7. PRIVACY POLICY TAB */}
            {activeTab === "privacy" && (
              <div className="space-y-4">
                <div className="pb-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#0084C7]">Privacy Policy</h2>
                  <Link
                    href="/page/privacy-policy"
                    className="text-xs font-bold text-[#0084C7] hover:underline flex items-center gap-1"
                  >
                    <span>Read Full Policy</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Rango Electronics protects your personal information, order history, and payment details using encrypted transport and strict access controls. Customer details are used strictly to process deliveries, provide warranty support, and share requested order updates.
                </p>
              </div>
            )}

            {/* 8. TERMS & CONDITIONS TAB */}
            {activeTab === "terms" && (
              <div className="space-y-4">
                <div className="pb-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#0084C7]">Terms &amp; Conditions</h2>
                  <Link
                    href="/page/term-and-conditions"
                    className="text-xs font-bold text-[#0084C7] hover:underline flex items-center gap-1"
                  >
                    <span>Read Full Terms</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  All products sold through Rango Electronics carry official brand warranty and authentic nationwide support. Orders placed before daily cutoff times are prioritized for express dispatch inside Dhaka and courier delivery nationwide.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-gray-500">
          Loading Account Dashboard...
        </div>
      }
    >
      <AccountContent />
    </Suspense>
  );
}
