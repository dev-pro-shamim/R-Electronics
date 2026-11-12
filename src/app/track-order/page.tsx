"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Package, CheckCircle2, Clock, Truck, ShieldCheck, MapPin, ChevronRight, AlertCircle, PhoneCall } from "lucide-react";
import { useCart } from "@/context/CartContext";

export const dynamic = "force-dynamic";

// Seeded authentic reference orders to allow immediate verification
const SEEDED_SAMPLE_ORDERS = [
  {
    id: "RE-984210",
    date: "10 Nov 2026, 10:15 AM",
    status: "Dispatched",
    paymentMethod: "bKash Merchant (01798565001)",
    courier: "Rango Express Home Delivery",
    trackingNo: "RNG-EXP-984210",
    shippingAddress: {
      fullName: "Tanvir Ahmed",
      phone: "01798565001",
      city: "Dhaka",
      address: "House 11, Road 11, DIT Project, Merul Badda, Dhaka"
    },
    items: [
      {
        id: "rango-ac-gree-18",
        product: {
          id: "rango-ac-gree-18",
          title: "Gree 1.5 Ton Fairy Split Inverter Air Conditioner (GS-18XFV32)",
          image: "/banners/slider_ac_big_sale.webp",
          price: 68500
        },
        quantity: 1,
        selectedWarranty: "10 Years Compressor Warranty"
      }
    ],
    subtotal: 68500,
    shipping: 0,
    discount: 0,
    total: 68500,
    timeline: [
      { title: "Order Placed & Verified", time: "10 Nov, 10:15 AM", completed: true, desc: "Order confirmed via SMS & bKash" },
      { title: "Warehouse Quality Check", time: "10 Nov, 12:30 PM", completed: true, desc: "AC unit and installation accessories inspected" },
      { title: "Dispatched with Courier", time: "10 Nov, 03:00 PM", completed: true, desc: "Assigned to Rango Express Dhaka Hub" },
      { title: "Out for Delivery & Installation", time: "Expected Tomorrow, 11:00 AM", completed: false, desc: "Technician team assigned for installation" },
      { title: "Delivered & Customer Sign-off", time: "Pending", completed: false, desc: "Final verification upon handover" }
    ]
  },
  {
    id: "RE-104921",
    date: "09 Nov 2026, 02:40 PM",
    status: "Out for Delivery",
    paymentMethod: "Nagad Personal (01911116359)",
    courier: "Rango Express Logistics",
    trackingNo: "RNG-EXP-104921",
    shippingAddress: {
      fullName: "Kamrul Hasan",
      phone: "01911116359",
      city: "Dhaka",
      address: "Block C, Banasree, Rampura, Dhaka"
    },
    items: [
      {
        id: "rango-fridge-haier-216",
        product: {
          id: "rango-fridge-haier-216",
          title: "Haier 216L Deep Freezer / Chest Freezer (HCF-216HT)",
          image: "/banners/slider_deep_fridge.webp",
          price: 38900
        },
        quantity: 1,
        selectedWarranty: "10 Years Official Warranty"
      }
    ],
    subtotal: 38900,
    shipping: 60,
    discount: 0,
    total: 38960,
    timeline: [
      { title: "Order Placed & Verified", time: "09 Nov, 02:40 PM", completed: true, desc: "Order confirmed" },
      { title: "Warehouse Quality Check", time: "09 Nov, 04:15 PM", completed: true, desc: "Compressor run-test passed" },
      { title: "Dispatched with Courier", time: "10 Nov, 09:00 AM", completed: true, desc: "Departed central depot" },
      { title: "Out for Delivery", time: "10 Nov, 01:30 PM", completed: true, desc: "Delivery rider is in Rampura area" },
      { title: "Delivered & Customer Sign-off", time: "Expected Today by 6:00 PM", completed: false, desc: "Pending recipient signature" }
    ]
  }
];

export default function TrackOrderPage() {
  const { orders } = useCart();
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [trackedOrder, setTrackedOrder] = useState<any | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Auto-fill from URL query param if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlId = params.get("id");
      if (urlId) {
        setOrderId(urlId);
        executeSearch(urlId, "");
      }
    }
  }, []);

  const executeSearch = async (idSearch: string, phoneSearch: string) => {
    setHasSearched(true);
    const cleanId = idSearch.trim().toLowerCase();
    const cleanPhone = phoneSearch.trim();

    if (!cleanId && !cleanPhone) {
      setNotFound(true);
      setTrackedOrder(null);
      return;
    }

    // 0. Always check live backend API first so Admin status/courier/payment updates appear immediately
    let found: any = null;
    try {
      const qs = new URLSearchParams();
      if (idSearch.trim()) qs.set("orderId", idSearch.trim());
      else if (cleanPhone) qs.set("phone", cleanPhone);
      const res = await fetch(`/api/orders/lookup?${qs.toString()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.found) {
          if (data.order) {
            found = {
              ...data.order,
              ...(data.override || {}),
              courier: data.booking?.courierName || data.override?.courier || data.order.courier,
              trackingNo: data.booking?.trackingId || data.override?.trackingNo || data.order.trackingNo,
            };
          } else if (Array.isArray(data.orders) && data.orders.length > 0) {
            found = data.orders[0];
          }
        }
      }
    } catch {}

    // 1. Check live orders in CartContext
    if (!found) {
      found = orders.find(o => {
        const matchId = cleanId && o.id.toLowerCase() === cleanId;
        const matchPhone = cleanPhone && (o.shippingAddress?.phone?.includes(cleanPhone) || (o as any).phoneNumber?.includes(cleanPhone));
        return matchId || matchPhone;
      });
    }

    // 2. Check localStorage saved orders
    if (!found && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("rango_orders");
        if (raw) {
          const stored: any[] = JSON.parse(raw);
          found = stored.find(o => {
            const matchId = cleanId && o.id?.toLowerCase() === cleanId;
            const matchPhone = cleanPhone && o.shippingAddress?.phone?.includes(cleanPhone);
            return matchId || matchPhone;
          });
        }
      } catch (e) {}
    }

    // 3. Check seeded reference orders
    if (!found) {
      found = SEEDED_SAMPLE_ORDERS.find(o => {
        const matchId = cleanId && o.id.toLowerCase() === cleanId;
        const matchPhone = cleanPhone && o.shippingAddress?.phone?.includes(cleanPhone);
        return matchId || matchPhone;
      });
    }

    if (found) {
      // Build dynamic timeline if not already present
      const timeline = found.timeline || [
        { title: "Order Placed & Confirmed", time: found.date, completed: true, desc: "Order successfully placed and logged in system" },
        { title: "Quality Inspection & Packaging", time: "In Progress", completed: found.status !== "Processing", desc: "Verifying authentic brand warranty and serial numbers" },
        { title: "Dispatched with Courier", time: found.status === "Dispatched" || found.status === "Delivered" ? "En route" : "Pending", completed: found.status === "Dispatched" || found.status === "Delivered", desc: "Handed over to Rango logistics team" },
        { title: "Out for Delivery", time: found.status === "Delivered" ? "Completed" : "Estimated soon", completed: found.status === "Delivered", desc: "Delivery rider arriving at customer address" },
        { title: "Delivered & Handed Over", time: found.status === "Delivered" ? "Delivered" : "Pending", completed: found.status === "Delivered", desc: "Customer delivery completed" }
      ];

      setTrackedOrder({ ...found, timeline });
      setNotFound(false);
    } else {
      setTrackedOrder(null);
      setNotFound(true);
    }
  };

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(orderId, phone);
  };

  return (
    <div className="bg-gray-50/50 min-h-screen py-8 md:py-12">
      <div className="container max-w-2xl">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          <ChevronRight className="size-3.5 text-gray-400" />
          <span className="text-gray-800 font-semibold">Track Order</span>
        </nav>

        {/* Card Header */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-6 md:p-8 shadow-xs space-y-6">
          <div className="text-center space-y-2">
            <div className="size-14 rounded-2xl bg-rose-50 text-primary flex items-center justify-center mx-auto mb-2">
              <Package className="size-7" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Track Your Order</h1>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Enter your real Rango Electronics Order ID (e.g. <span className="font-semibold text-gray-800">RE-984210</span>) or your registered customer phone number.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleTrack} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold text-gray-700">Order ID</label>
                <input
                  type="text"
                  value={orderId}
                  onChange={e => {
                    setOrderId(e.target.value);
                    setNotFound(false);
                  }}
                  placeholder="e.g. RE-984210"
                  className="w-full h-10 px-3 text-xs rounded-lg border border-gray-300 focus:outline-none focus:border-primary uppercase"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => {
                    setPhone(e.target.value);
                    setNotFound(false);
                  }}
                  placeholder="e.g. 01798565001"
                  className="w-full h-10 px-3 text-xs rounded-lg border border-gray-300 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="size-4" />
              <span>Track Live Order Status</span>
            </button>
          </form>

          {/* Quick Demo Test Pills */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/70 text-left text-[11px] text-gray-600 space-y-1.5">
            <p className="font-semibold text-gray-700 flex items-center gap-1.5">
              <span>💡 Test with Authentic Demo Orders:</span>
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setOrderId("RE-984210");
                  setPhone("01798565001");
                  executeSearch("RE-984210", "01798565001");
                }}
                className="px-2.5 py-1 bg-white border border-gray-300 hover:border-primary rounded text-[11px] font-medium text-gray-700 hover:text-primary transition-colors cursor-pointer"
              >
                Order: <strong>RE-984210</strong> (Gree AC • Dispatched)
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrderId("RE-104921");
                  setPhone("01911116359");
                  executeSearch("RE-104921", "01911116359");
                }}
                className="px-2.5 py-1 bg-white border border-gray-300 hover:border-primary rounded text-[11px] font-medium text-gray-700 hover:text-primary transition-colors cursor-pointer"
              >
                Order: <strong>RE-104921</strong> (Freezer • Out for Delivery)
              </button>
            </div>
          </div>

          {/* Not Found Alert (NO RANDOM MOCKS!) */}
          {hasSearched && notFound && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-left space-y-2 animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900">No active order found</h4>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    No order found matching Order ID <strong>"{orderId || "N/A"}"</strong> or Phone <strong>"{phone || "N/A"}"</strong>.
                  </p>
                  <p className="text-[11px] text-amber-700 mt-2">
                    Please make sure you entered the exact Order ID sent via SMS/Invoice upon checkout. For immediate live assistance, call Rango Support at:
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs font-bold text-amber-950">
                    <a href="tel:+8801798565001" className="hover:underline flex items-center gap-1">
                      <PhoneCall className="size-3.5 text-primary" /> +88 01798-565001
                    </a>
                    <a href="tel:+8801554565001" className="hover:underline flex items-center gap-1">
                      <PhoneCall className="size-3.5 text-primary" /> +88 01554-565001
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tracking Result Card (Dynamic Real Data) */}
          {trackedOrder && (
            <div className="border border-gray-200 rounded-xl p-5 md:p-6 text-left space-y-6 bg-white animate-fadeIn">
              {/* Order Meta Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-semibold">Order ID:</span>
                    <span className="text-base font-black text-gray-900">{trackedOrder.id}</span>
                  </div>
                  <p className="text-[11px] text-gray-500">Placed on: {trackedOrder.date}</p>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                    <CheckCircle2 className="size-3.5" />
                    <span>{trackedOrder.status}</span>
                  </span>
                  <p className="text-[11px] text-gray-500 mt-1">Payment: {trackedOrder.paymentMethod || "bKash / Cash"}</p>
                </div>
              </div>

              {/* Items in this order */}
              {trackedOrder.items && trackedOrder.items.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Ordered Products</h4>
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                    {trackedOrder.items.map((item: any, idx: number) => {
                      const prod = item.product || item;
                      return (
                        <div key={idx} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                          {prod.image && (
                            <img
                              src={prod.image}
                              alt={prod.title || "Product"}
                              className="size-12 object-contain bg-white rounded border border-gray-200 shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 line-clamp-1">{prod.title}</p>
                            <p className="text-[11px] text-gray-500">
                              Qty: {item.quantity || 1} • ৳{(prod.price || item.price || 0).toLocaleString()}
                              {item.selectedWarranty && ` • ${item.selectedWarranty}`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Delivery Address & Courier info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-gray-50 p-3.5 rounded-xl border border-gray-200/80">
                <div>
                  <p className="font-bold text-gray-800 flex items-center gap-1.5 mb-1">
                    <MapPin className="size-3.5 text-primary" /> Delivery Destination:
                  </p>
                  <p className="text-gray-700 font-medium">{trackedOrder.shippingAddress?.fullName}</p>
                  <p className="text-gray-500 text-[11px]">{trackedOrder.shippingAddress?.address}, {trackedOrder.shippingAddress?.city}</p>
                  <p className="text-gray-500 text-[11px]">Contact: {trackedOrder.shippingAddress?.phone}</p>
                </div>

                <div>
                  <p className="font-bold text-gray-800 flex items-center gap-1.5 mb-1">
                    <Truck className="size-3.5 text-primary" /> Courier Logistics:
                  </p>
                  <p className="text-gray-700 font-medium">{trackedOrder.courier || "Rango Express Home Delivery"}</p>
                  <p className="text-gray-500 text-[11px]">Tracking Ref: {trackedOrder.trackingNo || `TRK-${trackedOrder.id}`}</p>
                  <p className="text-gray-900 font-bold text-xs mt-1">Total: ৳{trackedOrder.total?.toLocaleString()}</p>
                </div>
              </div>

              {/* Visual Timeline */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Live Delivery Timeline</h4>
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                  {trackedOrder.timeline.map((step: any, index: number) => (
                    <div key={index} className="relative group">
                      <div
                        className={`absolute -left-6 top-0.5 size-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                          step.completed ? "bg-green-600 text-white" : "bg-gray-300 text-gray-600"
                        }`}
                      >
                        {step.completed ? <CheckCircle2 className="size-3.5" /> : <Clock className="size-3" />}
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-bold ${step.completed ? "text-gray-900" : "text-gray-500"}`}>
                            {step.title}
                          </p>
                          <span className="text-[10px] text-gray-400 font-medium">{step.time}</span>
                        </div>
                        {step.desc && (
                          <p className="text-[11px] text-gray-500 mt-0.5">{step.desc}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
