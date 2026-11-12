"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  HelpCircle,
  Minus,
  PackageCheck,
  PhoneCall,
  Play,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import type { Product } from "@/data/products";
import {
  validateBangladeshPhone,
  validateCustomerName,
  validateDeliveryAddress,
} from "@/lib/orderValidation";
import { formatRichOrPlainToHtml, parsePlainSpecsText } from "@/lib/plainTextFormatter";
import type { LandingPageBlock, LandingPageRecord } from "@/types/admin";

export interface LandingReviewItem {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  images?: string[];
}

interface LandingPageClientProps {
  landingPage: LandingPageRecord;
  product: Product | null;
  reviews?: LandingReviewItem[];
}

function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/
  );
  if (ytMatch?.[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;
  }
  const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch?.[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  return null;
}

export function LandingPageClient({
  landingPage,
  product,
  reviews = [],
}: LandingPageClientProps) {
  const router = useRouter();
  const unitPrice = Number(landingPage.offerPrice || product?.price || 0);
  const originalPrice = Number(
    landingPage.originalPrice || product?.originalPrice || unitPrice
  );
  const savings = Math.max(0, originalPrice - unitPrice);
  const discountPct =
    originalPrice > unitPrice
      ? Math.round(((originalPrice - unitPrice) / originalPrice) * 100)
      : 0;

  const gallery = useMemo(() => {
    const raw = [
      landingPage.heroImage,
      ...(landingPage.galleryImages || []),
      product?.thumbnail,
      ...(product?.images || []),
    ].filter((u): u is string => Boolean(u && u.trim()));
    return Array.from(new Set(raw));
  }, [landingPage.heroImage, landingPage.galleryImages, product]);

  const [selectedImage, setSelectedImage] = useState(gallery[0] || "/logo.png");
  const [specsSlideIdx, setSpecsSlideIdx] = useState(0);
  const [specsPaused, setSpecsPaused] = useState(false);
  const [activeSpecGroupIdx, setActiveSpecGroupIdx] = useState(0);

  const [reviewSlideIdx, setReviewSlideIdx] = useState(0);
  const [reviewsPaused, setReviewsPaused] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const [quantity, setQuantity] = useState(1);
  const [deliveryArea, setDeliveryArea] = useState<"dhaka" | "outside">("dhaka");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bkash" | "nagad">("cod");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Dhaka");
  const [address, setAddress] = useState("");
  const [trxPhone, setTrxPhone] = useState("");
  const [trxId, setTrxId] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [formStartedAt] = useState<number>(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const shippingFee = deliveryArea === "dhaka" ? 0 : 120;
  const subtotal = unitPrice * quantity;
  const grandTotal = subtotal + shippingFee;

  // Auto-slide product images inside the Technical Specifications split card
  useEffect(() => {
    if (gallery.length <= 1 || specsPaused) return;
    const timer = setInterval(() => {
      setSpecsSlideIdx((prev) => (prev + 1) % gallery.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [gallery.length, specsPaused]);

  const displayReviews = useMemo<LandingReviewItem[]>(() => {
    if (reviews.length > 0) return reviews;
    return [
      {
        id: "rev-demo-1",
        userName: "Mahmudul Hasan",
        rating: 5,
        comment:
          "Authentic product with official warranty card inside the sealed box. Same-day Dhaka delivery was super helpful!",
        date: "Uttara, Dhaka",
      },
      {
        id: "rev-demo-2",
        userName: "Nusrat Jahan",
        rating: 5,
        comment:
          "Best market price and very polite installation & support team. Highly recommended for genuine electronics.",
        date: "Dhanmondi, Dhaka",
      },
      {
        id: "rev-demo-3",
        userName: "Tanvir Ahmed",
        rating: 5,
        comment:
          "Safely packed and arrived on time. Checked the official warranty before paying Cash on Delivery — 100% satisfied.",
        date: "Chattogram",
      },
      {
        id: "rev-demo-4",
        userName: "Sadia Islam",
        rating: 5,
        comment:
          "Ordered directly from this campaign page and got my invoice immediately. Super fast response from Rango team.",
        date: "Mirpur, Dhaka",
      },
    ];
  }, [reviews]);

  // Auto-slide customer reviews carousel
  useEffect(() => {
    if (displayReviews.length <= 1 || reviewsPaused) return;
    const timer = setInterval(() => {
      setReviewSlideIdx((prev) => (prev + 1) % displayReviews.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [displayReviews.length, reviewsPaused]);

  const faqItems = useMemo(
    () => [
      {
        q: "Is this 100% genuine with official brand warranty?",
        a: `Yes! Every unit from Rango Electronics comes factory-sealed with ${
          landingPage.warrantyNote || product?.warranty || "Official Brand Warranty"
        } and an official VAT/warranty invoice.`,
      },
      {
        q: "How fast will I receive delivery and can I pay Cash on Delivery?",
        a: `${
          landingPage.deliveryNote ||
          "Inside Dhaka we offer same-day / next-day express delivery, and 48-72 hours nationwide."
        } You can inspect the sealed box and pay Cash on Delivery.`,
      },
      {
        q: "Is 0% EMI facility available on this product?",
        a: "Yes, 0% Interest EMI up to 36 months is available across 30+ commercial bank credit cards in Bangladesh.",
      },
      {
        q: "What if I need installation or after-sales support?",
        a: "Our hotline (+88 01798-565001) and authorized brand technician network handle installation guidance and warranty claims hassle-free.",
      },
    ],
    [landingPage.warrantyNote, landingPage.deliveryNote, product?.warranty]
  );

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (honeypot.trim()) {
      setErrorMsg("Order blocked by anti-bot protection.");
      return;
    }
    if (!validateCustomerName(fullName)) {
      setErrorMsg("Please enter your valid full name (at least 2 letters).");
      return;
    }
    const phoneCheck = validateBangladeshPhone(phone);
    if (!phoneCheck.valid) {
      setErrorMsg(phoneCheck.error || "Please enter a valid 11-digit Bangladesh mobile number.");
      return;
    }
    if (!validateDeliveryAddress(address)) {
      setErrorMsg("Please enter your complete delivery address (at least 6 characters).");
      return;
    }
    if (paymentMethod === "bkash" || paymentMethod === "nagad") {
      if (trxPhone.trim()) {
        const senderCheck = validateBangladeshPhone(trxPhone);
        if (!senderCheck.valid) {
          setErrorMsg("Sender number must be a valid 11-digit Bangladesh mobile number.");
          return;
        }
      }
      if (trxId.trim().length < 5) {
        setErrorMsg(
          `Please enter a valid ${paymentMethod === "bkash" ? "bKash" : "Nagad"} Transaction ID (TrxID).`
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const orderId = `RE-${Math.floor(100000 + Math.random() * 900000)}`;
      const methodLabel =
        paymentMethod === "bkash"
          ? `bKash Merchant (01798565001) - TrxID: ${trxId.trim()}`
          : paymentMethod === "nagad"
          ? `Nagad Personal (01911116359) - TrxID: ${trxId.trim()}`
          : "Cash On Delivery";

      const itemPayload = {
        id: product?.id || landingPage.productId,
        title: product?.title || landingPage.title,
        sku: product?.sku || product?.model || landingPage.productId,
        warranty: landingPage.warrantyNote || product?.warranty || "Official Warranty",
        price: unitPrice,
        quantity,
        thumbnail: selectedImage || "/logo.png",
        product: {
          id: product?.id || landingPage.productId,
          slug: product?.slug || landingPage.slug,
          title: product?.title || landingPage.title,
          price: unitPrice,
          thumbnail: selectedImage || "/logo.png",
        },
      };

      const orderPayload = {
        id: orderId,
        date: new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        items: [itemPayload],
        subtotal,
        discount: 0,
        shipping: shippingFee,
        total: grandTotal,
        status: "Processing",
        paymentMethod: methodLabel,
        paymentStatus:
          paymentMethod === "cod" ? "Unpaid" : "Pending Verification",
        sourceChannel: `Landing Page (${landingPage.slug})`,
        bkashPhone: paymentMethod === "bkash" ? trxPhone.trim() || phone.trim() : undefined,
        bkashTrxId: paymentMethod === "bkash" ? trxId.trim() : undefined,
        nagadPhone: paymentMethod === "nagad" ? trxPhone.trim() || phone.trim() : undefined,
        nagadTrxId: paymentMethod === "nagad" ? trxId.trim() : undefined,
        shippingAddress: {
          fullName: fullName.trim(),
          phone: phoneCheck.normalized,
          phoneNumber: phoneCheck.normalized,
          email: email.trim(),
          city: deliveryArea === "dhaka" ? city.trim() || "Dhaka" : city.trim() || "Outside Dhaka",
          address: address.trim(),
        },
        website: honeypot,
        formStartedAt,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Order submission failed.");
      }
      if (typeof window !== "undefined") {
        const existing = JSON.parse(localStorage.getItem("rango_orders") || "[]");
        localStorage.setItem("rango_orders", JSON.stringify([orderPayload, ...existing]));
      }
      router.push(`/invoice/${encodeURIComponent(orderId)}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Could not complete order.");
      setSubmitting(false);
    }
  };

  const visibleBlocks = (landingPage.blocks || []).filter((b) => b.visible !== false);
  const hasExplicitTestimonialBlock = visibleBlocks.some((b) => b.type === "testimonial");

  const renderReviewsSection = (heading?: string, key?: string) => {
    const visibleCount = displayReviews.length;
    const rotatedReviews = Array.from({ length: Math.min(3, visibleCount) }, (_, offset) => {
      return displayReviews[(reviewSlideIdx + offset) % visibleCount];
    });

    return (
      <section
        key={key}
        id="lp-reviews"
        onMouseEnter={() => setReviewsPaused(true)}
        onMouseLeave={() => setReviewsPaused(false)}
        className="bg-gradient-to-br from-[#F4FAFF] via-white to-[#FFF7EF] rounded-3xl border border-sky-100 p-6 sm:p-8 shadow-sm space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {heading || "Verified Customer Reviews"}
            </h2>
            <div className="inline-flex items-center gap-1.5 text-amber-500 font-black text-xs sm:text-sm mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
              ))}
              <span className="text-slate-800 ml-1">
                4.9 / 5 Based on {displayReviews.length}+ Verified Reviews
              </span>
            </div>
          </div>

          {displayReviews.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous review"
                onClick={() =>
                  setReviewSlideIdx(
                    (p) => (p - 1 + displayReviews.length) % displayReviews.length
                  )
                }
                className="size-9 rounded-xl bg-white border border-slate-200 hover:border-[#0084C7] text-slate-700 flex items-center justify-center shadow-xs cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Next review"
                onClick={() =>
                  setReviewSlideIdx((p) => (p + 1) % displayReviews.length)
                }
                className="size-9 rounded-xl bg-white border border-slate-200 hover:border-[#0084C7] text-slate-700 flex items-center justify-center shadow-xs cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rotatedReviews.map((rev, idx) => (
            <div
              key={`${rev.id}-${idx}`}
              className={`bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3 shadow-sm flex flex-col justify-between ${
                idx === 1 ? "hidden md:flex" : idx === 2 ? "hidden lg:flex" : "flex"
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: Math.max(1, Math.min(5, rev.rating || 5)) }).map(
                      (_, i) => (
                        <Star key={i} className="size-3.5 fill-amber-400" />
                      )
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <BadgeCheck className="size-3" /> Verified
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  &ldquo;{rev.comment}&rdquo;
                </p>
                {rev.images && rev.images.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    {rev.images.slice(0, 3).map((imgUrl, iIdx) => (
                      <img
                        key={`${imgUrl}-${iIdx}`}
                        src={imgUrl}
                        alt="Customer review photo"
                        className="size-12 rounded-lg object-cover border border-slate-200"
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-800">
                <span>{rev.userName}</span>
                <span className="text-slate-400 font-medium">{rev.date}</span>
              </div>
            </div>
          ))}
        </div>

        {displayReviews.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {displayReviews.slice(0, 8).map((_, idx) => (
              <button
                key={`rev-dot-${idx}`}
                type="button"
                aria-label={`Go to review slide ${idx + 1}`}
                onClick={() => setReviewSlideIdx(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  reviewSlideIdx % Math.min(8, displayReviews.length) === idx
                    ? "w-6 bg-[#0084C7]"
                    : "w-2 bg-slate-300"
                }`}
              />
            ))}
          </div>
        )}
      </section>
    );
  };

  const renderBlock = (block: LandingPageBlock) => {
    switch (block.type) {
      case "hero":
        return (
          <section key={block.id} className="space-y-4">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0084C7] via-[#006DA6] to-[#FF7A00] text-white shadow-xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 p-6 sm:p-10 lg:p-12 items-center">
                <div className="lg:col-span-7 space-y-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur px-3.5 py-1 text-xs font-bold uppercase tracking-wider">
                      <Sparkles className="size-3.5 text-amber-300" />
                      {landingPage.badge || "Special Offer"}
                    </span>
                    {discountPct > 0 && (
                      <span className="inline-flex items-center rounded-full bg-amber-400 text-slate-950 px-3 py-1 text-xs font-black">
                        SAVE {discountPct}% (৳{savings.toLocaleString()})
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-[1.15] tracking-tight">
                    {block.heading || landingPage.title}
                  </h1>
                  <p className="text-sm sm:text-base text-sky-50/95 leading-relaxed max-w-2xl">
                    {block.subheading || block.body || landingPage.subtitle}
                  </p>

                  <div className="flex flex-wrap items-baseline gap-4 pt-1">
                    <div className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                      ৳{unitPrice.toLocaleString()}
                    </div>
                    {originalPrice > unitPrice && (
                      <div className="text-base sm:text-lg line-through text-sky-200 font-semibold">
                        ৳{originalPrice.toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => scrollToSection("order-now")}
                      className="inline-flex items-center gap-2 rounded-xl bg-white text-[#006DA6] hover:bg-amber-50 px-6 py-3.5 text-sm sm:text-base font-black shadow-lg transition cursor-pointer"
                    >
                      <ShoppingBag className="size-4.5" />
                      {block.ctaText || landingPage.ctaText || "Order Now — Cash on Delivery"}
                    </button>
                    {product?.slug && (
                      <Link
                        href={`/product/${product.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 px-4 py-3.5 text-xs sm:text-sm font-bold text-white transition"
                      >
                        View Full Details <ChevronRight className="size-4" />
                      </Link>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-white/15 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-emerald-300 shrink-0" />
                      <span>{landingPage.warrantyNote || "Official Brand Warranty"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="size-4 text-amber-300 shrink-0" />
                      <span>{landingPage.deliveryNote || "Fast Nationwide Delivery"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="size-4 text-sky-200 shrink-0" />
                      <span>0% EMI &amp; COD Available</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-2xl border border-white/40">
                    <div className="aspect-square w-full overflow-hidden rounded-xl bg-slate-50 flex items-center justify-center">
                      <img
                        src={selectedImage || landingPage.heroImage || "/logo.png"}
                        alt={landingPage.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {gallery.length > 1 && (
                      <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
                        {gallery.slice(0, 6).map((imgUrl) => (
                          <button
                            key={imgUrl}
                            type="button"
                            onClick={() => setSelectedImage(imgUrl)}
                            className={`size-14 rounded-lg border-2 overflow-hidden shrink-0 bg-slate-50 cursor-pointer ${
                              selectedImage === imgUrl
                                ? "border-[#0084C7]"
                                : "border-slate-200 opacity-80 hover:opacity-100"
                            }`}
                          >
                            <img
                              src={imgUrl}
                              alt=""
                              className="w-full h-full object-contain"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Section Jump Bar */}
            <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200/80 px-4 py-3 shadow-xs flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-2 shrink-0">
                {[
                  { id: "lp-highlights", label: "Key Benefits" },
                  { id: "lp-specs", label: "Specifications" },
                  { id: "lp-reviews", label: "Customer Reviews" },
                  { id: "lp-faq", label: "FAQ" },
                ].map((nav) => (
                  <button
                    key={nav.id}
                    type="button"
                    onClick={() => scrollToSection(nav.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-sky-50 hover:text-[#0084C7] text-xs font-bold text-slate-700 transition cursor-pointer whitespace-nowrap"
                  >
                    {nav.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => scrollToSection("order-now")}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#0084C7] to-[#FF7A00] text-white text-xs font-black shrink-0 cursor-pointer shadow-xs"
              >
                Order Now • ৳{unitPrice.toLocaleString()}
              </button>
            </div>
          </section>
        );

      case "highlights":
        return (
          <section
            key={block.id}
            id="lp-highlights"
            className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  {block.heading || "Why Customers Love This Model"}
                </h2>
                {block.subheading && (
                  <p className="text-sm text-slate-600 mt-1">{block.subheading}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => scrollToSection("order-now")}
                className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#0084C7] hover:bg-[#006DA6] text-white text-xs font-bold cursor-pointer transition"
              >
                Order With Discount
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(block.bulletPoints && block.bulletPoints.length > 0
                ? block.bulletPoints
                : [
                    "100% Genuine & Factory Sealed Box",
                    "Official Brand Warranty & Service",
                    "Super Fast Delivery Across Bangladesh",
                  ]
              ).map((point, idx) => (
                <div
                  key={`${block.id}-${idx}`}
                  className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-[#F4FAFF] to-white border border-sky-100"
                >
                  <CheckCircle2 className="size-5 text-[#0084C7] shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </section>
        );

      case "video": {
        const videoSrc = block.videoUrl || landingPage.videoUrl || "";
        const embedUrl = getYouTubeEmbedUrl(videoSrc);
        if (!videoSrc) return null;
        return (
          <section
            key={block.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="size-9 rounded-xl bg-[#FF7A00]/10 text-[#FF7A00] flex items-center justify-center">
                <Play className="size-4.5" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  {block.heading || "Product Video Overview"}
                </h2>
                {block.subheading && (
                  <p className="text-sm text-slate-600">{block.subheading}</p>
                )}
              </div>
            </div>
            <div className="aspect-video w-full overflow-hidden rounded-2xl bg-slate-950 border border-slate-200">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={block.heading || landingPage.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={videoSrc} controls className="w-full h-full object-contain" />
              )}
            </div>
          </section>
        );
      }

      case "gallery":
        return (
          <section
            key={block.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm"
          >
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-5">
              {block.heading || "Product Photo Gallery"}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {(block.imageUrl ? [block.imageUrl, ...gallery] : gallery)
                .slice(0, 8)
                .map((imgUrl, idx) => (
                  <div
                    key={`${imgUrl}-${idx}`}
                    className="aspect-square rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-center overflow-hidden"
                  >
                    <img
                      src={imgUrl}
                      alt={`${landingPage.title} view ${idx + 1}`}
                      className="w-full h-full object-contain hover:scale-105 transition"
                    />
                  </div>
                ))}
            </div>
          </section>
        );

      case "description": {
        const rawText =
          block.body ||
          product?.description ||
          landingPage.subtitle ||
          "Official genuine appliance from Rango Electronics with nationwide delivery and warranty support.";
        const formattedHtml = formatRichOrPlainToHtml(rawText);
        return (
          <section
            key={block.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className={block.imageUrl ? "lg:col-span-7 space-y-3" : "lg:col-span-12 space-y-3"}>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  {block.heading || "Detailed Overview & Benefits"}
                </h2>
                {block.subheading && (
                  <p className="text-sm font-semibold text-[#0084C7]">{block.subheading}</p>
                )}
                <div
                  className="prose prose-sm sm:prose-base max-w-none text-slate-700 leading-relaxed space-y-3 [&_h2]:text-lg [&_h2]:font-extrabold [&_h2]:text-slate-900 [&_h3]:text-base [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                  dangerouslySetInnerHTML={{ __html: formattedHtml }}
                />
              </div>
              {block.imageUrl && (
                <div className="lg:col-span-5">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <img
                      src={block.imageUrl}
                      alt={block.heading}
                      className="w-full h-64 object-contain rounded-xl"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        );
      }

      case "specs": {
        const customRows = parsePlainSpecsText(block.body || "").map((r) => ({
          key: r.label,
          value: r.value,
        }));
        const groups =
          customRows.length > 0
            ? [{ group: "Key Specifications", items: customRows }]
            : product?.specifications && product.specifications.length > 0
            ? product.specifications
            : [
                {
                  group: "Product Specifications",
                  items: [
                    { key: "Brand", value: product?.brand || "Rango Official" },
                    {
                      key: "Model",
                      value: product?.model || product?.title || landingPage.title,
                    },
                    {
                      key: "Warranty",
                      value:
                        landingPage.warrantyNote ||
                        product?.warranty ||
                        "Official Brand Warranty Included",
                    },
                    {
                      key: "Delivery",
                      value:
                        landingPage.deliveryNote ||
                        "Express Cash on Delivery Across Bangladesh",
                    },
                  ],
                },
              ];
        const safeGroupIdx = Math.min(activeSpecGroupIdx, groups.length - 1);
        const currentGroup = groups[safeGroupIdx];
        const sliderImg = gallery[specsSlideIdx % Math.max(1, gallery.length)] || "/logo.png";

        return (
          <section
            key={block.id}
            id="lp-specs"
            className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-8 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#0084C7]">
                  <PackageCheck className="size-3.5" /> Verified Product Specs
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  {block.heading || "Complete Technical Specifications"}
                </h2>
              </div>
              {block.subheading && (
                <p className="text-xs sm:text-sm text-slate-500 max-w-md">{block.subheading}</p>
              )}
            </div>

            {/* Balanced 2-column split: Auto-sliding Product Image Carousel + Structured Specs Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* Left: Product Image Slider */}
              <div
                className="lg:col-span-5 space-y-3"
                onMouseEnter={() => setSpecsPaused(true)}
                onMouseLeave={() => setSpecsPaused(false)}
              >
                <div className="relative aspect-square w-full rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-sky-50/40 p-4 flex items-center justify-center overflow-hidden">
                  <img
                    src={sliderImg}
                    alt={`${landingPage.title} slide ${specsSlideIdx + 1}`}
                    className="w-full h-full object-contain transition-all duration-300"
                  />
                  {gallery.length > 1 && (
                    <>
                      <button
                        type="button"
                        aria-label="Previous image"
                        onClick={() =>
                          setSpecsSlideIdx((p) => (p - 1 + gallery.length) % gallery.length)
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md border border-slate-200 flex items-center justify-center cursor-pointer"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Next image"
                        onClick={() => setSpecsSlideIdx((p) => (p + 1) % gallery.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md border border-slate-200 flex items-center justify-center cursor-pointer"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                      <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/75 text-white text-[10px] font-bold">
                        {specsSlideIdx + 1} / {gallery.length}
                      </span>
                    </>
                  )}
                </div>

                {gallery.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {gallery.slice(0, 8).map((imgUrl, idx) => (
                      <button
                        key={`spec-thumb-${idx}`}
                        type="button"
                        onClick={() => setSpecsSlideIdx(idx)}
                        className={`size-14 rounded-xl border-2 overflow-hidden shrink-0 bg-slate-50 p-1 cursor-pointer transition ${
                          specsSlideIdx === idx
                            ? "border-[#0084C7] shadow-xs"
                            : "border-slate-200 opacity-75 hover:opacity-100"
                        }`}
                      >
                        <img src={imgUrl} alt="" className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Clean Specification Table */}
              <div className="lg:col-span-7 space-y-4">
                {groups.length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    {groups.map((grp, gIdx) => (
                      <button
                        key={grp.group}
                        type="button"
                        onClick={() => setActiveSpecGroupIdx(gIdx)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition ${
                          safeGroupIdx === gIdx
                            ? "bg-gradient-to-r from-[#0084C7] to-[#006DA6] text-white shadow-xs"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {grp.group}
                      </button>
                    ))}
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="bg-gradient-to-r from-[#0084C7] to-[#006DA6] text-white px-5 py-3 text-sm font-extrabold flex items-center justify-between">
                    <span>{currentGroup.group}</span>
                    <span className="text-[11px] font-semibold text-sky-100">
                      {currentGroup.items.length} Specifications
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {currentGroup.items.map((item, idx) => (
                      <div
                        key={`${item.key}-${idx}`}
                        className={`grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 px-5 py-3 text-xs sm:text-sm ${
                          idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"
                        }`}
                      >
                        <span className="sm:col-span-5 font-semibold text-slate-500">
                          {item.key}
                        </span>
                        <span className="sm:col-span-7 font-bold text-slate-900">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-sky-50 to-orange-50/60 border border-sky-100 p-4">
                  <div className="text-xs sm:text-sm font-bold text-slate-800">
                    Special Campaign Price:{" "}
                    <span className="text-[#0084C7] font-black text-base">
                      ৳{unitPrice.toLocaleString()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => scrollToSection("order-now")}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0084C7] to-[#FF7A00] text-white text-xs font-extrabold cursor-pointer shadow-xs"
                  >
                    Order This Model Now
                  </button>
                </div>
              </div>
            </div>
          </section>
        );
      }

      case "testimonial":
        return renderReviewsSection(block.heading, block.id);

      case "checkout":
        return (
          <React.Fragment key={block.id}>
            {!hasExplicitTestimonialBlock &&
              renderReviewsSection("Verified Customer Reviews", `${block.id}-reviews`)}
            {/* Essential Buyer Trust Guarantees */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                {
                  icon: Award,
                  title: "100% Genuine Unit",
                  desc: "Factory sealed authorized stock",
                },
                {
                  icon: ShieldCheck,
                  title: "Official Warranty",
                  desc: landingPage.warrantyNote || "Brand warranty card included",
                },
                {
                  icon: Truck,
                  title: "Cash on Delivery",
                  desc: "Check product before payment",
                },
                {
                  icon: CreditCard,
                  title: "0% EMI Available",
                  desc: "Up to 36 months bank EMI",
                },
              ].map((badge) => (
                <div
                  key={badge.title}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-start gap-3 shadow-xs"
                >
                  <div className="size-10 rounded-xl bg-sky-50 text-[#0084C7] flex items-center justify-center shrink-0">
                    <badge.icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                      {badge.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {badge.desc}
                    </div>
                  </div>
                </div>
              ))}
            </section>

            {/* Frequently Asked Questions */}
            <section
              id="lp-faq"
              className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-4"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="size-5 text-[#0084C7]" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Frequently Asked Questions
                </h2>
              </div>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                {faqItems.map((item, idx) => {
                  const isOpen = openFaqIdx === idx;
                  return (
                    <div key={item.q} className="bg-white">
                      <button
                        type="button"
                        onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                        className="w-full px-5 py-4 text-left flex items-center justify-between gap-3 font-bold text-xs sm:text-sm text-slate-900 hover:bg-slate-50 cursor-pointer"
                      >
                        <span>{item.q}</span>
                        <ChevronDown
                          className={`size-4 text-slate-500 shrink-0 transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 1-Step Express Order Form */}
            <section
              id="order-now"
              className="bg-white rounded-3xl border-2 border-[#0084C7]/20 p-6 sm:p-10 shadow-xl"
            >
              <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 text-[#FF7A00] border border-orange-200 px-3 py-1 text-xs font-black uppercase">
                  1-Step Express Order Form
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                  {block.heading || "Order Now — Fast Home Delivery"}
                </h2>
                <p className="text-sm text-slate-600">
                  {block.subheading ||
                    "Fill in your delivery information below to confirm your order and download your official invoice immediately."}
                </p>
              </div>

              <form
                onSubmit={handleCheckoutSubmit}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
              >
                <div className="lg:col-span-7 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Tariqul Islam"
                        className="w-full h-11 rounded-xl border border-slate-300 px-3.5 text-sm font-medium focus:border-[#0084C7] outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Bangladesh Mobile Number (11 Digits) *
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={14}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="017XXXXXXXX"
                        className="w-full h-11 rounded-xl border border-slate-300 px-3.5 text-sm font-medium focus:border-[#0084C7] outline-none"
                      />
                    </div>
                  </div>
                  {/* Anti-bot hidden honeypot */}
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        City / District *
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Dhaka"
                        className="w-full h-11 rounded-xl border border-slate-300 px-3.5 text-sm font-medium focus:border-[#0084C7] outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Email (Optional for E-Invoice)
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full h-11 rounded-xl border border-slate-300 px-3.5 text-sm font-medium focus:border-[#0084C7] outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Full Delivery Address *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House / Road / Area / Police Station..."
                      className="w-full rounded-xl border border-slate-300 p-3.5 text-sm font-medium focus:border-[#0084C7] outline-none"
                    />
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Delivery Zone
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setDeliveryArea("dhaka")}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                          deliveryArea === "dhaka"
                            ? "border-[#0084C7] bg-sky-50 text-[#006DA6]"
                            : "border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        <div className="text-sm font-bold">Inside Dhaka City</div>
                        <div className="text-xs text-slate-500">Free Express Delivery</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryArea("outside")}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                          deliveryArea === "outside"
                            ? "border-[#0084C7] bg-sky-50 text-[#006DA6]"
                            : "border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        <div className="text-sm font-bold">Outside Dhaka Nationwide</div>
                        <div className="text-xs text-slate-500">Courier Charge ৳120</div>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {(
                        [
                          { id: "cod", label: "Cash on Delivery" },
                          { id: "bkash", label: "bKash Payment" },
                          { id: "nagad", label: "Nagad Payment" },
                        ] as const
                      ).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id)}
                          className={`p-2.5 rounded-xl border text-xs sm:text-sm font-bold cursor-pointer transition ${
                            paymentMethod === m.id
                              ? "border-[#0084C7] bg-[#0084C7] text-white"
                              : "border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(paymentMethod === "bkash" || paymentMethod === "nagad") && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                      <p className="text-xs font-bold text-amber-900">
                        Send Payment to{" "}
                        {paymentMethod === "bkash"
                          ? "bKash Merchant: 01798565001"
                          : "Nagad Personal: 01911116359"}{" "}
                        &amp; enter your TrxID below:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={trxPhone}
                          onChange={(e) => setTrxPhone(e.target.value)}
                          placeholder="Sender Phone Number"
                          className="h-10 rounded-lg border border-amber-300 bg-white px-3 text-sm"
                        />
                        <input
                          type="text"
                          value={trxId}
                          onChange={(e) => setTrxId(e.target.value)}
                          placeholder="Transaction ID (TrxID) *"
                          className="h-10 rounded-lg border border-amber-300 bg-white px-3 text-sm font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-5 bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
                  <h3 className="text-base font-black text-slate-900 border-b border-slate-200 pb-3">
                    Your Order Summary
                  </h3>

                  <div className="flex items-center gap-3">
                    <img
                      src={selectedImage || landingPage.heroImage || "/logo.png"}
                      alt={landingPage.title}
                      className="size-16 rounded-xl object-contain bg-white border border-slate-200 p-1 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-slate-900 line-clamp-2">
                        {product?.title || landingPage.title}
                      </div>
                      <div className="text-xs text-[#0084C7] font-bold mt-0.5">
                        ৳{unitPrice.toLocaleString()} each
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-3.5 py-2">
                    <span className="text-xs font-bold text-slate-600">Quantity</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="size-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-black">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="size-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm border-t border-slate-200 pt-3">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-bold">৳{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Delivery Charge</span>
                      <span className="font-bold">
                        {shippingFee === 0 ? "FREE" : `৳${shippingFee.toLocaleString()}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-black text-slate-900 border-t border-slate-200 pt-2">
                      <span>Total Payable</span>
                      <span className="text-[#0084C7]">৳{grandTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {errorMsg && (
                    <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                      {errorMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-[#0084C7] via-[#006DA6] to-[#FF7A00] text-white font-black text-sm sm:text-base shadow-lg hover:opacity-95 transition cursor-pointer disabled:opacity-60"
                  >
                    {submitting
                      ? "Confirming Order..."
                      : `Confirm Order • ৳${grandTotal.toLocaleString()}`}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-1">
                    <PhoneCall className="size-3.5 text-[#0084C7]" />
                    <span>Need help? Call +88 01798-565001</span>
                  </div>
                </div>
              </form>
            </section>
          </React.Fragment>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4FAFF] via-[#F8FAFC] to-[#FFF6EE] pb-24 sm:pb-20">
      <div className="container py-6 sm:py-10 space-y-8">
        {visibleBlocks.map((block) => renderBlock(block))}
      </div>

      {/* Mobile Sticky Bottom Quick Order Bar (spaced cleanly left of floating chat icons) */}
      <div className="fixed bottom-[68px] left-3 right-20 z-30 sm:hidden pointer-events-none">
        <div className="pointer-events-auto bg-white/95 backdrop-blur border border-sky-200 shadow-xl rounded-2xl px-3.5 py-2 flex items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase">Campaign Offer</div>
            <div className="text-sm font-black text-[#0084C7]">
              ৳{unitPrice.toLocaleString()}
            </div>
          </div>
          <button
            type="button"
            onClick={() => scrollToSection("order-now")}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0084C7] to-[#FF7A00] text-white text-xs font-black shadow cursor-pointer shrink-0"
          >
            Order Now
          </button>
        </div>
      </div>
    </div>
  );
}
