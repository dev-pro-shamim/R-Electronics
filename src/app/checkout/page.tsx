"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";
import { sanitizeText, sanitizePhone, sanitizeTrxId } from "@/lib/sanitize";
import {
  validateBangladeshPhone,
  validateCustomerName,
  validateDeliveryAddress,
} from "@/lib/orderValidation";
import { EMI_BANKS, EMI_MIN_AMOUNT } from "@/data/emiData";
import { fireTrackingEvent } from "@/lib/useStoreRuntime";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, subtotal, discountCode, discountAmount, clearCart, user } = useCart();

  const [addressMode, setAddressMode] = useState<"favorite" | "new">("new");
  const [fullName, setFullName] = useState(user?.name || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");
  const [altPhone, setAltPhone] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [city, setCity] = useState("Dhaka");
  const [deliveryArea, setDeliveryArea] = useState<"inside" | "outside">("inside");
  const [address, setAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bkash" | "nagad" | "online" | "emi">("cod");
  const [bkashPhone, setBkashPhone] = useState("");
  const [bkashTrxId, setBkashTrxId] = useState("");
  const [nagadPhone, setNagadPhone] = useState("");
  const [nagadTrxId, setNagadTrxId] = useState("");
  const [selectedBankId, setSelectedBankId] = useState("scb");
  const [selectedEmiMonths, setSelectedEmiMonths] = useState(12);

  const [agreeTerms, setAgreeTerms] = useState(true);
  const [honeypot, setHoneypot] = useState("");
  const [formStartedAt] = useState<number>(() => Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shippingCost = deliveryArea === "inside" ? 60 : 150;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingCost);

  const currentBank = EMI_BANKS.find(b => b.id === selectedBankId) || EMI_BANKS[0];
  const availableTenures = currentBank.tenures;
  const activeEmiMonths = availableTenures.includes(selectedEmiMonths) ? selectedEmiMonths : availableTenures[availableTenures.length - 1];

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot.trim()) {
      alert("Order blocked by anti-bot protection.");
      return;
    }
    if (!agreeTerms) {
      alert("Please accept the Terms and Conditions to proceed.");
      return;
    }
    if (!validateCustomerName(fullName)) {
      alert("Please enter your valid full name (at least 2 letters).");
      return;
    }
    const phoneCheck = validateBangladeshPhone(phoneNumber);
    if (!phoneCheck.valid) {
      alert(phoneCheck.error || "Please enter a valid 11-digit Bangladesh mobile number (e.g. 017XXXXXXXX).");
      return;
    }
    if (!validateDeliveryAddress(address)) {
      alert("Please enter your complete delivery address (at least 6 characters).");
      return;
    }
    if (paymentMethod === "bkash") {
      if (bkashPhone.trim() && !validateBangladeshPhone(bkashPhone).valid) {
        alert("bKash sender number must be a valid 11-digit Bangladesh mobile number.");
        return;
      }
      if (bkashTrxId.trim().length < 5) {
        alert("Please enter a valid bKash Transaction ID (TrxID) after paying to Merchant: 01798565001");
        return;
      }
    }
    if (paymentMethod === "nagad") {
      if (nagadPhone.trim() && !validateBangladeshPhone(nagadPhone).valid) {
        alert("Nagad sender number must be a valid 11-digit Bangladesh mobile number.");
        return;
      }
      if (nagadTrxId.trim().length < 5) {
        alert("Please enter a valid Nagad Transaction ID (TrxID) after sending money to: 01911116359");
        return;
      }
    }

    setIsSubmitting(true);

    const cleanName = sanitizeText(fullName) || "Customer";
    const cleanPhone = phoneCheck.normalized;
    const cleanAddress = sanitizeText(address);
    const cleanCity = sanitizeText(city);
    const cleanBkashPhone = sanitizePhone(bkashPhone);
    const cleanBkashTrx = sanitizeTrxId(bkashTrxId);
    const cleanNagadPhone = sanitizePhone(nagadPhone);
    const cleanNagadTrx = sanitizeTrxId(nagadTrxId);

    const orderId = `RE-${Math.floor(100000 + Math.random() * 900000)}`;
    let methodDisplay = "Cash On Delivery";
    if (paymentMethod === "bkash") {
      methodDisplay = `bKash Merchant (01798565001) - TrxID: ${cleanBkashTrx}`;
    } else if (paymentMethod === "nagad") {
      methodDisplay = `Nagad Personal (01911116359) - TrxID: ${cleanNagadTrx}`;
    } else if (paymentMethod === "online") {
      methodDisplay = "Online Payment (SSLCommerz)";
    } else if (paymentMethod === "emi") {
      methodDisplay = `0% EMI (${activeEmiMonths} Months - ${currentBank.name})`;
    }

    const newOrder = {
      id: orderId,
      date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      items: cart.map((item) => ({
        id: item.product.id,
        title: item.product.title,
        sku: item.product.sku || item.product.model || item.product.id,
        warranty: item.product.warranty || "Official Brand Warranty",
        price: item.product.price,
        quantity: item.quantity,
        thumbnail: item.product.thumbnail || item.product.images?.[0] || "/logo.png",
        product: {
          id: item.product.id,
          slug: item.product.slug,
          title: item.product.title,
          sku: item.product.sku || item.product.model || item.product.id,
          warranty: item.product.warranty || "Official Brand Warranty",
          price: item.product.price,
          thumbnail: item.product.thumbnail || item.product.images?.[0] || "/logo.png",
        },
      })),
      subtotal: subtotal,
      discount: discountAmount,
      shipping: shippingCost,
      total: grandTotal,
      status: "Processing",
      paymentMethod: methodDisplay,
      bkashPhone: paymentMethod === "bkash" ? cleanBkashPhone : undefined,
      bkashTrxId: paymentMethod === "bkash" ? cleanBkashTrx : undefined,
      nagadPhone: paymentMethod === "nagad" ? cleanNagadPhone : undefined,
      nagadTrxId: paymentMethod === "nagad" ? cleanNagadTrx : undefined,
      shippingAddress: {
        fullName: cleanName,
        phone: cleanPhone,
        phoneNumber: cleanPhone,
        email: email || "",
        city: cleanCity,
        address: cleanAddress,
      },
    };

    // Enforce server-side anti-bot, rate-limit, and BD 11-digit phone checks before finalizing
    try {
      const verifyRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newOrder,
          website: honeypot,
          formStartedAt,
        }),
      });
      if (!verifyRes.ok) {
        const errData = await verifyRes.json().catch(() => ({}));
        alert(errData.error || "Order validation failed. Please check your details.");
        setIsSubmitting(false);
        return;
      }
    } catch {
      // Allow local fallback only if network error occurs after client checks passed
    }

    // Save to localStorage orders history
    if (typeof window !== "undefined") {
      const existing = JSON.parse(localStorage.getItem("rango_orders") || "[]");
      localStorage.setItem("rango_orders", JSON.stringify([newOrder, ...existing]));
    }

    // Save order in real-time to Supabase Cloud Database
    try {
      supabase.from("orders").insert({
        id: orderId,
        customer_name: fullName,
        phone: phoneNumber,
        email: email || null,
        city: city,
        address: address,
        subtotal: subtotal,
        shipping: shippingCost,
        discount: discountAmount,
        total: grandTotal,
        payment_method: methodDisplay,
        bkash_phone: paymentMethod === "bkash" ? bkashPhone : null,
        bkash_trx_id: paymentMethod === "bkash" ? bkashTrxId : null,
        nagad_phone: paymentMethod === "nagad" ? nagadPhone : null,
        nagad_trx_id: paymentMethod === "nagad" ? nagadTrxId : null,
        status: "Processing",
        items: cart.map(i => ({
          id: i.product.id,
          title: i.product.title,
          price: i.product.price,
          quantity: i.quantity,
          thumbnail: i.product.thumbnail || i.product.images?.[0] || "/logo.png"
        }))
      }).then(({ error }) => {
        if (error) console.error("Supabase order sync error:", error.message);
        else console.log("✅ Order synced to Supabase:", orderId);
      });
    } catch (err) {
      console.error("Supabase sync exception:", err);
    }

    // Send Order Email Notification to customer & admin
    try {
      fetch("/api/send-order-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          customerName: cleanName,
          customerEmail: email || undefined,
          phone: cleanPhone,
          address: cleanAddress,
          city: cleanCity,
          items: cart.map(i => ({
            title: i.product.title,
            price: i.product.price,
            quantity: i.quantity
          })),
          subtotal,
          shipping: shippingCost,
          total: grandTotal,
          paymentMethod: methodDisplay,
        })
      }).catch(err => console.error("Email dispatch error:", err));
    } catch (e) {
      console.error("Email error:", e);
    }

    // Track coupon redemption & Meta Pixel / CAPI Purchase event
    if (discountCode) {
      fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: discountCode,
          subtotal,
          customerKey: cleanPhone || email,
          recordUsage: true,
        }),
      }).catch(() => {});
    }
    fireTrackingEvent("Purchase", {
      value: grandTotal,
      orderId,
      contentIds: cart.map((i) => i.product.id),
      userData: { email, phone: cleanPhone },
    });

    setTimeout(() => {
      clearCart();
      router.push(`/invoice/${orderId}`);
    }, 800);
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-24 xl:pb-16 text-black font-sans">
      <div className="container p-3 md:px-8 md:py-7 mt-5 rounded max-w-[1442px] mx-auto">
        <div className="grid lg:grid-cols-[1fr,_413px] bg-gray-50/50 shadow-sm border border-gray-200/80 rounded-sm">
          {/* Left Column: Checkout Forms */}
          <div className="bg-white py-7 px-4 sm:px-6">
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              aria-hidden="true"
              className="hidden"
            />
            {/* Header matching exact reference */}
            <div className="flex items-center gap-3 mb-8 pb-5 border-b border-gray-200">
              <svg className="size-8 sm:size-10 text-primary" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M1.33337 0C0.979742 0 0.640593 0.140476 0.390536 0.390524C0.14048 0.640573 0 0.979711 0 1.33333C0 1.68696 0.14048 2.02609 0.390536 2.27614C0.640593 2.52619 0.979742 2.66667 1.33337 2.66667H4.29347L5.36283 6.952L9.35762 28.2453C9.41482 28.5509 9.57698 28.8268 9.81606 29.0255C10.0552 29.2242 10.3561 29.333 10.667 29.3333H13.3337C11.9192 29.3333 10.5626 29.8952 9.56239 30.8954C8.56217 31.8956 8.00025 33.2522 8.00025 34.6667C8.00025 36.0812 8.56217 37.4377 9.56239 38.4379C10.5626 39.4381 11.9192 40 13.3337 40C14.7483 40 16.1049 39.4381 17.1051 38.4379C18.1053 37.4377 18.6672 36.0812 18.6672 34.6667C18.6672 33.2522 18.1053 31.8956 17.1051 30.8954C16.1049 29.8952 14.7483 29.3333 13.3337 29.3333H32.001C30.5865 29.3333 29.2299 29.8952 28.2296 30.8954C27.2294 31.8956 26.6675 33.2522 26.6675 34.6667C26.6675 36.0812 27.2294 37.4377 28.2296 38.4379C29.2299 39.4381 30.5865 40 32.001 40C33.4155 40 34.7721 39.4381 35.7723 38.4379C36.7726 37.4377 37.3345 36.0812 37.3345 34.6667C37.3345 33.2522 36.7726 31.8956 35.7723 30.8954C34.7721 29.8952 33.4155 29.3333 32.001 29.3333H34.6677C34.9786 29.333 35.2796 29.2242 35.5187 29.0255C35.7578 28.8268 35.9199 28.5509 35.9771 28.2453L39.9772 6.912C40.0133 6.71957 40.0065 6.52156 39.9573 6.33205C39.9082 6.14254 39.8179 5.96617 39.6929 5.81548C39.568 5.66478 39.4113 5.54346 39.2341 5.46014C39.057 5.37681 38.8636 5.33351 38.6679 5.33333H7.7069L6.62687 1.01067C6.55489 0.72209 6.3885 0.465863 6.15414 0.282733C5.91978 0.0996018 5.63092 8.21639e-05 5.3335 0H1.33337Z"
                    fill="currentColor"
                  />
                </svg>
                <h1 className="text-xl sm:text-2xl font-semibold text-primary">Checkout</h1>
              </div>

              {/* Address Mode Selector */}
              <div className="mb-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setAddressMode("favorite")}
                  className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-colors ${
                    addressMode === "favorite"
                      ? "bg-primary/10 border-primary"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Deliver to</p>
                    <p className="font-semibold text-sm text-primary">Default Store Address</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAddressMode("new")}
                  className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-colors ${
                    addressMode === "new"
                      ? "bg-primary/10 border-primary"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14"></path>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Provide Custom</p>
                    <p className="font-semibold text-sm text-primary">New Shipping Address</p>
                  </div>
                </button>
              </div>

              {/* Delivery Information Form */}
              <form onSubmit={handleSubmitOrder} id="checkout-form" className="space-y-4">
                <h2 className="text-base font-bold text-gray-900 border-b pb-2">
                  1. Delivery Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Tanvir Ahmed"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Alternative Phone (Optional)</label>
                    <input
                      type="tel"
                      value={altPhone}
                      onChange={(e) => setAltPhone(e.target.value)}
                      placeholder="Optional backup number"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Delivery Location Selection */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Delivery Region *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryArea("inside");
                        setCity("Dhaka");
                      }}
                      className={`py-2 px-3 rounded border text-xs font-semibold flex items-center justify-between ${
                        deliveryArea === "inside"
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-gray-700 border-gray-300"
                      }`}
                    >
                      <span>Inside Dhaka</span>
                      <span>৳60</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryArea("outside");
                        setCity("Chittagong");
                      }}
                      className={`py-2 px-3 rounded border text-xs font-semibold flex items-center justify-between ${
                        deliveryArea === "outside"
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-gray-700 border-gray-300"
                      }`}
                    >
                      <span>Outside Dhaka</span>
                      <span>৳150</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Full Street Address *</label>
                  <textarea
                    required
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House / Flat / Road / Sector / Area details..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Order Notes (Optional)</label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Any specific delivery instructions or preferred time"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white outline-none focus:border-primary"
                  />
                </div>

                {/* Payment Methods */}
                <div className="pt-4 border-t">
                  <h2 className="text-base font-bold text-gray-900 mb-3">
                    2. Select Payment Method
                  </h2>

                  <div className="space-y-2.5">
                    {/* COD */}
                    <label
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        paymentMethod === "cod" ? "bg-emerald-50/60 border-primary" : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === "cod"}
                          onChange={() => setPaymentMethod("cod")}
                          className="size-4 accent-primary"
                        />
                        <div>
                          <p className="text-sm font-bold text-gray-900">Cash on Delivery (COD)</p>
                          <p className="text-xs text-gray-500">Pay cash upon receiving and inspecting product</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">Popular</span>
                    </label>

                    {/* bKash Merchant */}
                    <div
                      className={`p-3 rounded-lg border transition-colors ${
                        paymentMethod === "bkash" ? "bg-pink-50/50 border-pink-500 ring-1 ring-pink-500" : "border-gray-200 bg-white"
                      }`}
                    >
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="payment"
                            checked={paymentMethod === "bkash"}
                            onChange={() => setPaymentMethod("bkash")}
                            className="size-4 accent-pink-600"
                          />
                          <div>
                            <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                              <span>bKash Merchant Payment</span>
                              <span className="text-[11px] font-extrabold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full">
                                01798565001
                              </span>
                            </p>
                            <p className="text-xs text-gray-500">Official Merchant Account • Instant Verification</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-pink-600 bg-pink-100 px-2 py-0.5 rounded">Merchant</span>
                      </label>

                      {paymentMethod === "bkash" && (
                        <div className="mt-3 pt-3 border-t border-pink-200 text-xs text-gray-700 space-y-2.5">
                          <div className="bg-white p-2.5 rounded border border-pink-200 space-y-1">
                            <p className="font-semibold text-gray-900">Payment Steps:</p>
                            <p>1. Open your <strong>bKash App</strong> or dial <strong>*247#</strong></p>
                            <p>2. Select <strong>Make Payment</strong> option</p>
                            <p>3. Enter Merchant Number: <strong className="text-pink-600 text-sm select-all">01798565001</strong></p>
                            <p>4. Enter Amount: <strong className="text-gray-900">৳{grandTotal.toLocaleString()}</strong></p>
                            <p>5. Enter Reference: <strong>RANGO</strong> and confirm with PIN</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-0.5">Your bKash Number *</label>
                              <input
                                type="tel"
                                required
                                value={bkashPhone}
                                onChange={(e) => setBkashPhone(e.target.value)}
                                placeholder="01XXXXXXXXX"
                                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded bg-white outline-none focus:border-pink-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-0.5">bKash Transaction ID (TrxID) *</label>
                              <input
                                type="text"
                                required
                                value={bkashTrxId}
                                onChange={(e) => setBkashTrxId(e.target.value)}
                                placeholder="e.g. BL940XA92"
                                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded bg-white outline-none focus:border-pink-500 uppercase font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Nagad Personal */}
                    <div
                      className={`p-3 rounded-lg border transition-colors ${
                        paymentMethod === "nagad" ? "bg-orange-50/50 border-orange-500 ring-1 ring-orange-500" : "border-gray-200 bg-white"
                      }`}
                    >
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="payment"
                            checked={paymentMethod === "nagad"}
                            onChange={() => setPaymentMethod("nagad")}
                            className="size-4 accent-orange-600"
                          />
                          <div>
                            <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                              <span>Nagad Personal Payment</span>
                              <span className="text-[11px] font-extrabold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                                01911116359
                              </span>
                            </p>
                            <p className="text-xs text-gray-500">Personal Send Money Account</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">Send Money</span>
                      </label>

                      {paymentMethod === "nagad" && (
                        <div className="mt-3 pt-3 border-t border-orange-200 text-xs text-gray-700 space-y-2.5">
                          <div className="bg-white p-2.5 rounded border border-orange-200 space-y-1">
                            <p className="font-semibold text-gray-900">Payment Steps:</p>
                            <p>1. Open your <strong>Nagad App</strong> or dial <strong>*167#</strong></p>
                            <p>2. Select <strong>Send Money</strong> option</p>
                            <p>3. Enter Personal Number: <strong className="text-orange-600 text-sm select-all">01911116359</strong></p>
                            <p>4. Enter Amount: <strong className="text-gray-900">৳{grandTotal.toLocaleString()}</strong></p>
                            <p>5. Enter Reference: <strong>RANGO</strong> and confirm with PIN</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-0.5">Your Nagad Number *</label>
                              <input
                                type="tel"
                                required
                                value={nagadPhone}
                                onChange={(e) => setNagadPhone(e.target.value)}
                                placeholder="01XXXXXXXXX"
                                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded bg-white outline-none focus:border-orange-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-0.5">Nagad Transaction ID (TrxID) *</label>
                              <input
                                type="text"
                                required
                                value={nagadTrxId}
                                onChange={(e) => setNagadTrxId(e.target.value)}
                                placeholder="e.g. 71A82BC3"
                                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded bg-white outline-none focus:border-orange-500 uppercase font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Online Payment */}
                    <label
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        paymentMethod === "online" ? "bg-emerald-50/60 border-primary" : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === "online"}
                          onChange={() => setPaymentMethod("online")}
                          className="size-4 accent-primary"
                        />
                        <div>
                          <p className="text-sm font-bold text-gray-900">Online Payment / Mobile Banking</p>
                          <p className="text-xs text-gray-500">bKash, Nagad, Visa, Mastercard, AMEX (SSLCommerz Secured)</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Instant</span>
                    </label>

                    {/* 0% EMI */}
                    <label
                      className={`flex items-start justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        paymentMethod === "emi" ? "bg-emerald-50/60 border-primary" : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === "emi"}
                          onChange={() => setPaymentMethod("emi")}
                          className="size-4 accent-primary mt-1"
                        />
                        <div>
                          <p className="text-sm font-bold text-gray-900">0% Interest Credit Card EMI</p>
                          <p className="text-xs text-gray-500">Up to 36 Months EMI with 30 leading partner commercial banks (Min. ৳5,000)</p>

                          {/* EMI Details when selected */}
                          {paymentMethod === "emi" && (
                            <div className="mt-3 space-y-2 bg-white p-3 rounded border border-gray-200">
                              {grandTotal < EMI_MIN_AMOUNT ? (
                                <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
                                  EMI is available for orders of ৳{EMI_MIN_AMOUNT.toLocaleString()} or above. Your current total is ৳{grandTotal.toLocaleString()}.
                                </p>
                              ) : (
                                <>
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Select Bank ({EMI_BANKS.length} Commercial Banks)</label>
                                    <select
                                      value={selectedBankId}
                                      onChange={(e) => {
                                        setSelectedBankId(e.target.value);
                                        const b = EMI_BANKS.find(x => x.id === e.target.value);
                                        if (b && !b.tenures.includes(selectedEmiMonths)) {
                                          setSelectedEmiMonths(b.tenures[0]);
                                        }
                                      }}
                                      className="w-full text-xs p-2 border rounded outline-none bg-gray-50 font-medium"
                                    >
                                      {EMI_BANKS.map((b) => (
                                        <option key={b.id} value={b.id}>
                                          {b.name} (Max {b.tenures[b.tenures.length - 1]} Months)
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                      Select Tenure for {currentBank.shortName}
                                    </label>
                                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
                                      {availableTenures.map((m) => (
                                        <button
                                          key={m}
                                          type="button"
                                          onClick={() => setSelectedEmiMonths(m)}
                                          className={`p-1.5 text-center text-xs rounded border transition-colors ${
                                            activeEmiMonths === m ? "bg-primary text-white font-bold" : "bg-gray-50 hover:bg-gray-100"
                                          }`}
                                        >
                                          {m}M
                                        </button>
                                      ))}
                                    </div>
                                    <p className="text-[11px] text-emerald-700 font-semibold mt-1.5">
                                      Instalment: ৳{Math.round(grandTotal / activeEmiMonths).toLocaleString()}/month (0% Zero Interest)
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">0% EMI</span>
                    </label>
                  </div>
                </div>
              </form>
            </div>

            {/* Right Column: Order Summary */}
            <div className="bg-white p-4 lg:p-6 border-t lg:border-t-0 lg:border-l border-gray-200">
              <h2 className="text-base font-bold text-gray-900 border-b pb-2 mb-4">
                Order Summary ({cart.length} items)
              </h2>

              {/* Items List */}
              <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto mb-4">
                {cart.map((item) => (
                  <div key={item.product.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={item.product.thumbnail || item.product.images?.[0] || "/logo.png"}
                        alt={item.product.title}
                        className="size-12 object-contain border rounded p-0.5"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/logo.png";
                        }}
                      />
                      <div>
                        <p className="text-xs font-medium text-gray-900 line-clamp-1">{item.product.title}</p>
                        <p className="text-[11px] text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-900 whitespace-nowrap">
                      ৳{(item.product.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Costs Breakdown */}
              <div className="space-y-2.5 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-primary font-bold">৳{subtotal.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600 font-semibold">
                    <span>Coupon ({discountCode}):</span>
                    <span>-৳{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee:</span>
                  <span className="font-semibold text-gray-800">৳{shippingCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-3 text-lg font-bold">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-primary text-xl font-extrabold">৳{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Agreement Checkbox */}
              <label className="mt-5 flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 accent-primary cursor-pointer"
                />
                <span className="text-xs leading-relaxed text-gray-600">
                  I have read and agree to the{" "}
                  <Link href="/page/term-and-conditions" target="_blank" className="text-primary underline">
                    Terms & Conditions
                  </Link>
                  ,{" "}
                  <Link href="/page/privacy-policy" target="_blank" className="text-primary underline">
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link href="/page/refund-policy" target="_blank" className="text-primary underline">
                    Refund & Return Policy
                  </Link>
                  .
                </span>
              </label>

              {/* Proceed Button */}
              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting || cart.length === 0}
                className="mt-6 h-14 font-bold text-xl w-full justify-center text-white bg-primary hover:bg-black rounded shadow transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Processing Order..." : "Proceed to Pay"}
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}
