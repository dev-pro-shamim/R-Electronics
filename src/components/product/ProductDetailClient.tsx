"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PRODUCTS, Product } from "@/data/products";
import { ProductCard } from "@/components/common/ProductCard";
import { EmiModal } from "@/components/product/EmiModal";
import { useCart } from "@/context/CartContext";

interface ApprovedReviewDisplay {
  id: string;
  userName: string;
  userLocation?: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  adminReply?: string;
  date: string;
  verifiedBuyer?: boolean;
}

interface ApprovedQuestionDisplay {
  id: string;
  userName: string;
  date: string;
  question: string;
  answer: string;
  answeredBy: string;
}

export function ProductDetailClient({
  product,
  initialReviews,
  initialQuestions,
}: {
  product: Product;
  initialReviews?: Product["reviews"];
  initialQuestions?: ApprovedQuestionDisplay[];
}) {
  const router = useRouter();

  const { addToCart, toggleWishlist, isInWishlist, addToCompare, removeFromCompare, isInCompare, user } = useCart();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"specs" | "desc" | "reviews" | "questions">("specs");
  const [isEmiOpen, setIsEmiOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });

  // Dynamic approved reviews & questions preloaded via SSR fast resolver
  const [reviewsList, setReviewsList] = useState<ApprovedReviewDisplay[]>(() =>
    Array.isArray(initialReviews)
      ? initialReviews.map((r) => ({
          id: r.id,
          userName: r.userName,
          rating: Number(r.rating || 5),
          title: r.title,
          comment: r.comment,
          images: r.images || [],
          adminReply: r.adminReply,
          date: r.date || "",
          verifiedBuyer: Boolean(r.verified),
        }))
      : []
  );
  const [visibleReviewsLimit, setVisibleReviewsLimit] = useState<number>(10);
  const [averageRating, setAverageRating] = useState<number>(Number(product.rating || 0));
  const [reviewName, setReviewName] = useState("");
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewEmail, setReviewEmail] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmittedMsg, setReviewSubmittedMsg] = useState<string | null>(null);
  const [reviewErrorMsg, setReviewErrorMsg] = useState<string | null>(null);
  const [selectedReviewImage, setSelectedReviewImage] = useState<string | null>(null);

  const [questionsList, setQuestionsList] = useState<ApprovedQuestionDisplay[]>(
    () => (Array.isArray(initialQuestions) ? initialQuestions : [])
  );
  const [questionName, setQuestionName] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [questionSubmitting, setQuestionSubmitting] = useState(false);
  const [questionSubmittedMsg, setQuestionSubmittedMsg] = useState<string | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (user?.name && !reviewName) setReviewName(user.name);
    if (user?.email && !reviewEmail) setReviewEmail(user.email);
  }, [user]);

  useEffect(() => {
    setVisibleReviewsLimit(10);
    if (Array.isArray(initialReviews)) {
      setReviewsList(
        initialReviews.map((r) => ({
          id: r.id,
          userName: r.userName,
          rating: Number(r.rating || 5),
          title: r.title,
          comment: r.comment,
          images: r.images || [],
          adminReply: r.adminReply,
          date: r.date || "",
          verifiedBuyer: Boolean(r.verified),
        }))
      );
      setAverageRating(Number(product.rating || 0));
    } else {
      fetch(`/api/reviews?productId=${encodeURIComponent(product.id)}`, { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.reviews)) {
            setReviewsList(
              data.reviews.map((r: any) => ({
                id: r.id,
                userName: r.userName,
                rating: Number(r.rating || 5),
                title: r.title,
                comment: r.comment,
                images: r.images || [],
                adminReply: r.adminReply,
                date: new Date(r.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }),
                verifiedBuyer: Boolean(r.verifiedPurchase),
              }))
            );
            setAverageRating(Number(data.averageRating || 0));
          }
        })
        .catch(() => {});
    }

    if (Array.isArray(initialQuestions)) {
      setQuestionsList(initialQuestions);
    } else {
      fetch(`/api/questions?productId=${encodeURIComponent(product.id)}`, { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.questions)) {
            setQuestionsList(
              data.questions.map((q: any) => ({
                id: q.id,
                userName: q.userName,
                date: new Date(q.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }),
                question: q.question,
                answer: q.answer || "Our technical team is verifying your question.",
                answeredBy: "Rango Electronics Specialist",
              }))
            );
          }
        })
        .catch(() => {});
    }
  }, [product.id]);

  // Unique gallery images prioritizing featured thumbnail first
  const gallerySet = new Set<string>();
  if (product.thumbnail) gallerySet.add(product.thumbnail);
  for (const img of product.images || []) {
    if (img) gallerySet.add(img);
  }
  const images = gallerySet.size > 0 ? Array.from(gallerySet) : ["/logo.png"];

  const currentImage = images[selectedImageIndex] || images[0];

  // Related products from same category or brand
  const relatedProducts = PRODUCTS.filter(
    (p) => p.id !== product.id && (p.category === product.category || p.brand === product.brand)
  ).slice(0, 4);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    router.push("/cart");
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setReviewImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setReviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) return;
    setReviewSubmitting(true);
    setReviewErrorMsg(null);
    setReviewSubmittedMsg(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          productTitle: product.title,
          userName: reviewName.trim(),
          userEmail: reviewEmail.trim() || undefined,
          rating: reviewRating,
          title: reviewTitle.trim() || undefined,
          comment: reviewComment.trim(),
          images: reviewImages,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReviewErrorMsg(data.error || "Could not submit review.");
        return;
      }
      setReviewComment("");
      setReviewTitle("");
      setReviewImages([]);
      setReviewSubmittedMsg(
        data.message ||
          "Review submitted for moderation and will appear after admin approval."
      );
    } catch {
      setReviewErrorMsg("Network error submitting review. Please try again.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionName.trim() || !questionText.trim()) return;
    setQuestionSubmitting(true);
    setQuestionSubmittedMsg(null);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          productTitle: product.title,
          userName: questionName.trim(),
          userEmail: user?.email,
          question: questionText.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setQuestionName("");
        setQuestionText("");
        setQuestionSubmittedMsg(
          data.message ||
            "Your question has been submitted for moderation and will appear once answered."
        );
      }
    } finally {
      setQuestionSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-20 xl:pb-12 text-black font-sans">
      <div className="max-w-[1442px] mx-auto px-2 sm:px-4">
        {/* Breadcrumb matching Rango Electronics DOM */}
        <ol className="items-center whitespace-nowrap hidden lg:flex flex-wrap lg:flex-nowrap font-medium lg:mt-6 lg:mb-2.5">
          <li className="flex items-center text-lg text-black">
            <Link className="capitalize flex items-center hover:text-primary transition-colors" href="/">
              <svg className="mr-2" width="15" height="16" viewBox="0 0 15 16" fill="none">
                <path
                  d="M5.76923 15.4286V11.4231C5.76923 11.1432 6.05769 10.8575 6.34615 10.8575H8.65385C8.94231 10.8575 9.23077 11.1432 9.23077 11.4289V15.4286C9.23077 15.5802 9.29155 15.7255 9.39975 15.8326C9.50794 15.9398 9.65468 16 9.80769 16H14.4231C14.5761 16 14.7228 15.9398 14.831 15.8326C14.9392 15.7255 15 15.5802 15 15.4286V7.42912C15.0001 7.35403 14.9853 7.27966 14.9564 7.21024C14.9275 7.14083 14.8851 7.07773 14.8315 7.02457L13.2692 5.47839V1.7152C13.2692 1.56366 13.2084 1.41832 13.1003 1.31116C12.9921 1.20401 12.8453 1.14381 12.6923 1.14381H11.5385C11.3855 1.14381 11.2387 1.20401 11.1305 1.31116C11.0223 1.41832 10.9615 1.56366 10.9615 1.7152V3.19282L7.90846 0.167868C7.85487 0.114656 7.79121 0.0724385 7.72112 0.0436329C7.65102 0.0148274 7.57589 0 7.5 0C7.42411 0 7.34898 0.0148274 7.27888 0.0436329C7.20879 0.0724385 7.14513 0.114656 7.09154 0.167868L0.168462 7.02457C0.114922 7.07773 0.0724856 7.14083 0.0435798 7.21024C0.014674 7.27966 -0.00013448 7.35403 9.20187e-07 7.42912V15.4286C9.20187e-07 15.5802 0.0607837 15.7255 0.168978 15.8326C0.277172 15.9398 0.423914 16 0.576924 16H5.19231C5.34532 16 5.49206 15.9398 5.60025 15.8326C5.70845 15.7255 5.76923 15.5802 5.76923 15.4286Z"
                  fill="currentColor"
                />
              </svg>
              Home
            </Link>
          </li>
          <li className="flex items-center text-base text-black capitalize">
            <svg className="stroke-black mx-1" width="18" height="18" viewBox="0 0 18 18" stroke="currentColor" fill="none">
              <path d="M6.75 13.5L11.25 9L6.75 4.5" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <Link href={`/category/${product.category}`} className="hover:text-primary transition-colors">
              {product.category.replace(/-/g, " ")}
            </Link>
          </li>
          <li className="flex items-center text-base text-black capitalize">
            <svg className="stroke-black mx-1" width="18" height="18" viewBox="0 0 18 18" stroke="currentColor" fill="none">
              <path d="M6.75 13.5L11.25 9L6.75 4.5" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-gray-600 truncate max-w-[300px]">{product.brand}</span>
          </li>
        </ol>

        {/* Section 1: Main Product Box (2 Columns matching reference) */}
        <section className="bg-white md:mt-6 rounded-lg p-4 lg:grid lg:grid-cols-2 3xl:grid-cols-[613px,_1fr] lg:gap-3 3xl:gap-10 shadow-sm border border-gray-100">
          {/* Left Column: Image Gallery & Zoom */}
          <div className="space-y-4">
            <div className="overflow-hidden relative flex flex-col 2xl:flex-row 2xl:max-h-[600px]">
              {/* Prev/Next arrows for mobile */}
              <button
                type="button"
                onClick={() => setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                className="w-8 h-8 rounded-full bg-white/90 shadow grid place-items-center absolute left-2 top-1/2 -translate-y-1/2 z-20 md:hidden"
                aria-label="Prev Button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setSelectedImageIndex((prev) => (prev + 1) % images.length)}
                className="w-8 h-8 rounded-full bg-white/90 shadow grid place-items-center absolute right-2 top-1/2 -translate-y-1/2 z-20 md:hidden"
                aria-label="Next Button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>

              {/* Thumbnails (vertical on 2xl screens, horizontal below on smaller) */}
              {images.length > 1 && (
                <div className="order-2 2xl:order-1 flex 2xl:flex-col gap-2 overflow-x-auto 2xl:overflow-y-auto max-h-[500px] mt-3 2xl:mt-0 2xl:mr-4 scrollbar-none">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedImageIndex(i)}
                      className={`w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-md border p-1 bg-white transition-all ${
                        selectedImageIndex === i
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <img src={img} alt={`Thumb ${i}`} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Image with Zoom preview */}
              <div
                className="order-1 2xl:order-2 flex-1 relative flex items-center justify-center min-h-[300px] sm:min-h-[420px] 2xl:min-h-[520px] bg-white rounded-lg border border-gray-100 overflow-hidden cursor-crosshair group"
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleMouseMove}
              >
                <img
                  src={currentImage}
                  alt={product.title}
                  className="max-h-[460px] w-auto max-w-full object-contain transition-transform duration-150"
                  style={
                    isZoomed
                      ? {
                          transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                          transform: "scale(1.8)",
                        }
                      : { transform: "scale(1)" }
                  }
                />
              </div>
            </div>
          </div>

          {/* Right Column: Title, Price, EMI, Warranty, Quantity, Actions */}
          <div className="mt-4 lg:mt-0 space-y-4">
            {/* Title & Compare / Wishlist */}
            <div className="flex justify-between items-start gap-4">
              <h1 className="text-xl lg:text-3xl font-semibold text-primary leading-tight max-w-[480px]">
                {product.title}
              </h1>

              {/* Desktop Compare and Wishlist */}
              <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (isInCompare(product.id)) {
                      removeFromCompare(product.id);
                    } else {
                      addToCompare(product);
                    }
                  }}
                  className={`flex items-center gap-2 py-1.5 px-4 h-max rounded border text-sm transition-colors ${
                    isInCompare(product.id)
                      ? "bg-primary text-white border-primary shadow-xs"
                      : "text-black border-gray-300 hover:border-primary hover:text-primary"
                  }`}
                >
                  <svg width="18" height="18" viewBox="0 0 23 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M22.8875 18.9819C22.8875 19.2008 22.8013 19.4107 22.6481 19.5655C22.4948 19.7202 22.2869 19.8072 22.0701 19.8072H2.79194L7.93638 24.9997C8.08986 25.1546 8.17608 25.3648 8.17608 25.584C8.17608 25.8031 8.08986 26.0133 7.93638 26.1682C7.7829 26.3232 7.57474 26.4103 7.35769 26.4103C7.14064 26.4103 6.93248 26.3232 6.77901 26.1682L0.240156 19.5662C0.16404 19.4895 0.103649 19.3985 0.0624447 19.2982C0.0212383 19.1979 2.86102e-05 19.0905 2.86102e-05 18.9819C2.86102e-05 18.8734 0.0212383 18.7659 0.0624447 18.6656C0.103649 18.5654 0.16404 18.4743 0.240156 18.3976L6.77901 11.7956C6.93248 11.6406 7.14064 11.5536 7.35769 11.5536C7.57474 11.5536 7.7829 11.6406 7.93638 11.7956C8.08986 11.9506 8.17608 12.1607 8.17608 12.3799C8.17608 12.599 8.08986 12.8092 7.93638 12.9642L2.79194 18.1567H22.0701C22.2869 18.1567 22.4948 18.2436 22.6481 18.3984C22.8013 18.5531 22.8875 18.763 22.8875 18.9819ZM0.00148964 7.42834C0.00148964 7.64721 0.0876026 7.85712 0.240887 8.01188C0.394171 8.16665 0.602068 8.2536 0.818846 8.2536H20.097L14.9526 13.4461C14.8766 13.5228 14.8163 13.6139 14.7752 13.7142C14.734 13.8144 14.7129 13.9219 14.7129 14.0304C14.7129 14.1389 14.734 14.2463 14.7752 14.3466C14.8163 14.4468 14.8766 14.5379 14.9526 14.6147C15.0286 14.6914 15.1188 14.7523 15.2181 14.7938C15.3174 14.8353 15.4238 14.8567 15.5313 14.8567C15.6387 14.8567 15.7451 14.8353 15.8444 14.7938C15.9437 14.7523 16.0339 14.6914 16.1099 14.6147L22.6488 8.01262C22.7249 7.93596 22.7853 7.84489 22.8265 7.74463C22.8677 7.64437 22.8889 7.53689 22.8889 7.42834C22.8889 7.31979 22.8677 7.21231 22.8265 7.11205C22.7853 7.01179 22.7249 6.92072 22.6488 6.84406L16.1099 0.242017C15.9565 0.0870561 15.7483 0 15.5313 0C15.3142 0 15.106 0.0870561 14.9526 0.242017C14.7991 0.396978 14.7129 0.60715 14.7129 0.826298C14.7129 1.04545 14.7991 1.25562 14.9526 1.41058L20.097 6.60309H0.818846C0.602068 6.60309 0.394171 6.69003 0.240887 6.8448C0.0876026 6.99956 0.00148964 7.20947 0.00148964 7.42834Z"
                      fill="currentColor"
                    />
                  </svg>
                  {isInCompare(product.id) ? "In Compare" : "Compare"}
                </button>
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  className={`size-10 rounded-full border grid place-items-center transition-colors ${
                    isInWishlist(product.id)
                      ? "border-red-500 text-red-500 bg-red-50"
                      : "border-gray-300 text-gray-400 hover:border-red-500 hover:text-red-500"
                  }`}
                >
                  <svg width="18" height="16" viewBox="0 0 15 14" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M7.5 1.22644C11.6607 -3.03141 22.0635 4.41937 7.5 14C-7.06352 4.4203 3.33926 -3.03141 7.5 1.22644Z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Brand & Sold by & Rating */}
            <div className="space-y-1.5">
              <p className="text-base md:text-lg text-black">
                <span className="font-semibold">Brand :</span> {product.brand} | Sold by: {product.brand} Official
              </p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="none"
                      className={
                        reviewsList.length > 0 && averageRating >= star - 0.3
                          ? "text-orange-400"
                          : "text-slate-200"
                      }
                    >
                      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
                    </svg>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("reviews")}
                  className="text-slate-600 hover:text-primary font-medium text-sm"
                >
                  ({reviewsList.length} {reviewsList.length === 1 ? "Customer review" : "Customer reviews"})
                </button>
              </div>
            </div>

            {/* Price Box */}
            <div className="flex flex-wrap xl:flex-nowrap items-center justify-between border-y border-gray-200 py-3 gap-4">
              <div className="flex items-center gap-3">
                <p className="text-2xl lg:text-3xl font-bold text-primary">
                  ৳{product.price.toLocaleString()}
                </p>
                {product.originalPrice > product.price && (
                  <span className="text-gray-400 line-through text-lg font-normal">
                    ৳{product.originalPrice.toLocaleString()}
                  </span>
                )}
                {product.discount > 0 && (
                  <span className="bg-[#F17E23] text-white text-xs font-bold px-2 py-0.5 rounded">
                    -{product.discount}%
                  </span>
                )}
              </div>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                In Stock (Official Unit)
              </span>
            </div>

            {/* Mobile Compare and Wishlist */}
            <div className="sm:hidden flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isInCompare(product.id)) {
                    removeFromCompare(product.id);
                  } else {
                    addToCompare(product);
                  }
                }}
                className={`flex items-center gap-2 py-1.5 px-4 rounded border text-sm transition-colors ${
                  isInCompare(product.id)
                    ? "bg-primary text-white border-primary"
                    : "text-black/70 border-gray-300 hover:border-primary"
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 23 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M22.8875 18.9819C22.8875 19.2008 22.8013 19.4107 22.6481 19.5655C22.4948 19.7202 22.2869 19.8072 22.0701 19.8072H2.79194L7.93638 24.9997C8.08986 25.1546 8.17608 25.3648 8.17608 25.584C8.17608 25.8031 8.08986 26.0133 7.93638 26.1682C7.7829 26.3232 7.57474 26.4103 7.35769 26.4103C7.14064 26.4103 6.93248 26.3232 6.77901 26.1682L0.240156 19.5662C0.16404 19.4895 0.103649 19.3985 0.0624447 19.2982C0.0212383 19.1979 2.86102e-05 19.0905 2.86102e-05 18.9819C2.86102e-05 18.8734 0.0212383 18.7659 0.0624447 18.6656C0.103649 18.5654 0.16404 18.4743 0.240156 18.3976L6.77901 11.7956C6.93248 11.6406 7.14064 11.5536 7.35769 11.5536C7.57474 11.5536 7.7829 11.6406 7.93638 11.7956C8.08986 11.9506 8.17608 12.1607 8.17608 12.3799C8.17608 12.599 8.08986 12.8092 7.93638 12.9642L2.79194 18.1567H22.0701C22.2869 18.1567 22.4948 18.2436 22.6481 18.3984C22.8013 18.5531 22.8875 18.763 22.8875 18.9819Z" fill="currentColor" />
                </svg>
                Compare
              </button>
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                className={`size-9 rounded-full border grid place-items-center ${
                  isInWishlist(product.id) ? "border-red-500 text-red-500" : "border-gray-300 text-gray-400"
                }`}
              >
                <svg width="15" height="14" viewBox="0 0 15 14" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M7.5 1.22644C11.6607 -3.03141 22.0635 4.41937 7.5 14C-7.06352 4.4203 3.33926 -3.03141 7.5 1.22644Z" />
                </svg>
              </button>
            </div>

            {/* EMI Available */}
            <div className="flex items-center justify-between text-base md:text-lg border-b border-gray-200 pb-3">
              <div>
                <span className="font-semibold">EMI Available : </span>
                <span className="text-gray-700">From ৳{Math.round(product.price / 12).toLocaleString()}/month</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEmiOpen(true)}
                className="text-primary font-medium flex items-center gap-1 hover:underline ml-auto"
              >
                View Plans
                <svg width="18" height="18" viewBox="0 0 18 18" stroke="currentColor" fill="none">
                  <path d="M6.75 13.5L11.25 9L6.75 4.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Warranty */}
            <div className="text-base md:text-lg border-b border-gray-200 pb-3">
              <span className="font-semibold">Warranty : </span>
              <p className="text-gray-800 font-normal mt-0.5">{product.warranty}</p>
            </div>

            {/* Quantity Selector & Share */}
            <div className="flex xl:items-center justify-between xl:flex-row flex-col-reverse gap-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <p className="text-base font-semibold text-black">Quantity:</p>
                <div className="max-w-[124px] p-1 flex items-center justify-between bg-white border border-gray-300 rounded">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="bg-primary/10 size-8 grid place-items-center rounded hover:bg-primary/20 text-primary transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                      <path d="M4.1665 10H15.8332" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </button>
                  <span className="w-10 text-center font-bold text-gray-900 text-lg">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="bg-primary/10 size-8 grid place-items-center rounded hover:bg-primary/20 text-primary transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                      <path d="M10 4.166V15.833M4.1665 10H15.8332" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Share */}
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-black">Share:</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`)}
                    className="bg-white rounded-full grid place-items-center size-9 border border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                    title="Share on Facebook"
                  >
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`)}
                    className="bg-white rounded-full grid place-items-center size-9 border border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                    title="Share on WhatsApp"
                  >
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="bg-white rounded-full grid place-items-center size-9 border border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                    title="Copy Link"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  {copiedLink && (
                    <span className="text-xs text-primary font-semibold self-center">Copied!</span>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Add to Cart & Buy Now Buttons */}
            <div className="gap-3 3xl:gap-4 items-center hidden xl:inline-flex w-full pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="whitespace-nowrap font-semibold bg-primary text-white shadow py-2 inline-flex items-center text-xl justify-center gap-2 w-full h-14 md:h-16 px-4 rounded hover:bg-black transition-colors"
              >
                Add To Cart
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="whitespace-nowrap font-semibold border-2 border-primary bg-white text-primary shadow py-2 inline-flex items-center text-xl justify-center gap-2 w-full h-14 md:h-16 px-4 rounded hover:bg-primary hover:text-white transition-colors"
              >
                Buy Now
              </button>
            </div>
          </div>
        </section>

        {/* Section 2: Tabs (Specification, Description, Reviews, Questions) + Related Products Sidebar */}
        <section className="my-10 lg:mt-16 lg:mb-16 grid lg:grid-cols-[1fr,_300px] 2xl:grid-cols-[1fr,_351px] lg:gap-4 2xl:gap-6">
          {/* Left Column: Tabs & Content */}
          <div className="overflow-hidden">
            {/* Tab Buttons matching reference styling */}
            <div className="flex items-center gap-2 lg:gap-4 px-1 overflow-x-auto scrollbar-none pb-2">
              <button
                type="button"
                onClick={() => setActiveTab("specs")}
                className={`whitespace-nowrap px-6 py-3 rounded inline-flex items-center font-semibold text-base md:text-lg justify-center h-12 md:h-14 transition-colors ${
                  activeTab === "specs"
                    ? "bg-black text-white hover:bg-black/90 shadow"
                    : "bg-white text-gray-800 hover:bg-primary hover:text-white border border-gray-200"
                }`}
              >
                Specification
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("desc")}
                className={`whitespace-nowrap px-6 py-3 rounded inline-flex items-center font-semibold text-base md:text-lg justify-center h-12 md:h-14 transition-colors ${
                  activeTab === "desc"
                    ? "bg-black text-white hover:bg-black/90 shadow"
                    : "bg-white text-gray-800 hover:bg-primary hover:text-white border border-gray-200"
                }`}
              >
                Description
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("reviews")}
                className={`whitespace-nowrap px-6 py-3 rounded inline-flex items-center font-semibold text-base md:text-lg justify-center h-12 md:h-14 transition-colors ${
                  activeTab === "reviews"
                    ? "bg-black text-white hover:bg-black/90 shadow"
                    : "bg-white text-gray-800 hover:bg-primary hover:text-white border border-gray-200"
                }`}
              >
                Reviews ({reviewsList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("questions")}
                className={`whitespace-nowrap px-6 py-3 rounded inline-flex items-center font-semibold text-base md:text-lg justify-center h-12 md:h-14 transition-colors ${
                  activeTab === "questions"
                    ? "bg-black text-white hover:bg-black/90 shadow"
                    : "bg-white text-gray-800 hover:bg-primary hover:text-white border border-gray-200"
                }`}
              >
                Questions ({questionsList.length})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100 mt-4">
              {/* Specification Tab */}
              {activeTab === "specs" && (
                <div className="space-y-6">
                  {product.specifications && product.specifications.length > 0 ? (
                    product.specifications.map((group, gIdx) => (
                      <div key={gIdx} className="overflow-hidden rounded-md border border-gray-200">
                        <div className="bg-gray-200 text-primary font-bold text-base md:text-lg px-4 py-2.5">
                          {group.group}
                        </div>
                        <div className="divide-y divide-gray-200">
                          {group.items.map((item, iIdx) => (
                            <div
                              key={iIdx}
                              className="grid grid-cols-1 md:grid-cols-[240px,_1fr] py-3 px-4 text-sm md:text-base even:bg-gray-50/50"
                            >
                              <span className="font-semibold text-gray-700">{item.key}</span>
                              <span className="text-gray-900">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 py-4">Standard manufacturer specifications apply.</p>
                  )}
                </div>
              )}

              {/* Description Tab */}
              {activeTab === "desc" && (
                <div className="prose max-w-none text-gray-800 space-y-4">
                  <h3 className="text-xl font-bold text-primary">{product.title}</h3>
                  {(() => {
                    const rawDesc =
                      product.description ||
                      `${product.title} is available at Rango Electronics with full official brand warranty. Designed with premium energy-saving technology, modern aesthetics, and durable high-grade components for optimal performance.`;
                    const hasHtml = /<[a-z][\s\S]*>/i.test(rawDesc);
                    if (!hasHtml) {
                      return <p className="leading-relaxed text-base whitespace-pre-line">{rawDesc}</p>;
                    }
                    const sanitizedHtml = rawDesc
                      .replace(/<\s*(script|style|iframe|object|embed|form)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
                      .replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*\/?>/gi, "")
                      .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
                      .replace(/javascript\s*:/gi, "");
                    return (
                      <div
                        className="text-sm sm:text-base leading-relaxed text-gray-700 space-y-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1.5 [&_li]:leading-relaxed [&_p]:mb-2 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-gray-900 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-gray-900 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-gray-900 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-gray-200 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-gray-200 [&_th]:bg-gray-50 [&_th]:px-3 [&_th]:py-2"
                        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                      />
                    );
                  })()}
                  <div className="bg-gray-50 border-l-4 border-primary p-4 my-4 rounded-r">
                    <h4 className="font-bold text-primary mb-1">Key Highlights:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm md:text-base">
                      <li>100% Genuine and official authorized unit.</li>
                      <li>Nationwide delivery with professional safe transit packaging.</li>
                      <li>0% Interest EMI facility available for up to 36 months on all major bank credit cards.</li>
                      <li>{product.warranty}</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === "reviews" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-6 gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Customer Ratings &amp; Reviews</h3>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-3xl font-extrabold text-primary">
                          {reviewsList.length > 0 ? averageRating.toFixed(1) : "0.0"}
                        </span>
                        <div>
                          <div className="flex text-orange-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-5 h-5 fill-current ${
                                  reviewsList.length > 0 && averageRating >= star - 0.3
                                    ? "text-orange-400"
                                    : "text-slate-200"
                                }`}
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-xs text-gray-500 font-medium">
                            {reviewsList.length} Approved {reviewsList.length === 1 ? "Review" : "Reviews"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-2 rounded-lg flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Reviews are published after admin moderation</span>
                    </div>
                  </div>

                  {/* Reviews List */}
                  <div className="divide-y divide-gray-200">
                    {reviewsList.length === 0 ? (
                      <div className="py-8 text-center text-sm text-slate-500">
                        No approved reviews yet for this product. Be the first to share your experience below!
                      </div>
                    ) : (
                      <>
                        {reviewsList.slice(0, visibleReviewsLimit).map((rev) => (
                          <div key={rev.id} className="py-4 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-gray-900 text-sm md:text-base">{rev.userName}</span>
                                {rev.verifiedBuyer && (
                                  <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                    Verified Customer
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-400">{rev.date}</span>
                            </div>
                            <div className="flex text-orange-400">
                              {[...Array(rev.rating)].map((_, i) => (
                                <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                </svg>
                              ))}
                            </div>
                            {rev.title && (
                              <p className="font-semibold text-slate-900 text-sm">{rev.title}</p>
                            )}
                            <p className="text-gray-800 text-sm md:text-base leading-relaxed">{rev.comment}</p>

                            {rev.images && rev.images.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-2">
                                {rev.images.map((img, imgIdx) => (
                                  <button
                                    key={imgIdx}
                                    type="button"
                                    onClick={() => setSelectedReviewImage(img)}
                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-md border border-gray-200 overflow-hidden hover:opacity-80 transition-opacity bg-white"
                                  >
                                    <img src={img} alt="Customer product photo" className="w-full h-full object-cover" />
                                  </button>
                                ))}
                              </div>
                            )}

                            {rev.adminReply && (
                              <div className="mt-2 ml-3 pl-3 border-l-2 border-[#0084C7] bg-sky-50/70 rounded-r-lg p-2.5 text-xs text-slate-700">
                                <strong className="text-[#0084C7]">Store Reply:</strong> {rev.adminReply}
                              </div>
                            )}
                          </div>
                        ))}

                        {reviewsList.length > visibleReviewsLimit && (
                          <div className="pt-4 flex items-center justify-between gap-3">
                            <span className="text-xs text-slate-500">
                              Showing {Math.min(visibleReviewsLimit, reviewsList.length)} of {reviewsList.length} approved reviews
                            </span>
                            <button
                              type="button"
                              onClick={() => setVisibleReviewsLimit((prev) => prev + 15)}
                              className="px-4 py-2 rounded-lg border border-[#0084C7] text-[#0084C7] hover:bg-sky-50 text-xs font-bold transition-colors"
                            >
                              Load More Reviews ({reviewsList.length - visibleReviewsLimit} more)
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Submit Review Form */}
                  <form onSubmit={handleReviewSubmit} className="bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-200 space-y-4 mt-6">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Write a Customer Review</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Your review will appear after admin verification &amp; moderation.
                      </p>
                    </div>

                    {reviewSubmittedMsg && (
                      <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-800 font-medium text-sm flex items-center gap-2">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>{reviewSubmittedMsg}</span>
                      </div>
                    )}

                    {reviewErrorMsg && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium text-sm">
                        {reviewErrorMsg}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Your Name *</label>
                        <input
                          type="text"
                          required
                          value={reviewName}
                          onChange={(e) => setReviewName(e.target.value)}
                          placeholder="e.g. Tanvir Hasan"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Email (Optional)</label>
                        <input
                          type="email"
                          value={reviewEmail}
                          onChange={(e) => setReviewEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Rating *</label>
                        <select
                          value={reviewRating}
                          onChange={(e) => setReviewRating(Number(e.target.value))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white outline-none focus:border-primary"
                        >
                          <option value={5}>5 Stars - Excellent</option>
                          <option value={4}>4 Stars - Very Good</option>
                          <option value={3}>3 Stars - Good</option>
                          <option value={2}>2 Stars - Fair</option>
                          <option value={1}>1 Star - Poor</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Review Title (Optional)</label>
                      <input
                        type="text"
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        placeholder="Summarize your experience"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Your Review *</label>
                      <textarea
                        required
                        rows={3}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Write your honest review about delivery, packaging, warranty and performance..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white outline-none focus:border-primary"
                      />
                    </div>

                    {/* Image Upload Input */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Upload Product Photos (Optional)
                      </label>
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="cursor-pointer border-2 border-dashed border-gray-300 hover:border-primary rounded-lg px-4 py-2 text-xs font-medium text-gray-700 bg-white flex items-center gap-2 transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                            <circle cx="9" cy="9" r="2"/>
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                          </svg>
                          Choose Photos
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                        <span className="text-[11px] text-gray-500">Attach unboxing or product photos</span>
                      </div>

                      {/* Image Previews */}
                      {reviewImages.length > 0 && (
                        <div className="flex flex-wrap gap-2.5 mt-3">
                          {reviewImages.map((img, i) => (
                            <div key={i} className="relative w-16 h-16 rounded-md border border-gray-300 overflow-hidden group">
                              <img src={img} alt="Preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(i)}
                                className="absolute top-1 right-1 size-4 bg-red-600 text-white rounded-full flex items-center justify-center text-xs opacity-90 hover:opacity-100"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="verified-confirm"
                        defaultChecked
                        required
                        className="rounded accent-primary size-4"
                      />
                      <label htmlFor="verified-confirm" className="text-xs text-gray-600 cursor-pointer">
                        I confirm that I purchased this genuine product from Rango Electronics.
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-black transition-colors disabled:opacity-60"
                    >
                      {reviewSubmitting ? "Submitting..." : "Submit Review"}
                    </button>
                  </form>

                  {/* Lightbox Modal for Customer Photo */}
                  {selectedReviewImage && (
                    <div
                      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                      onClick={() => setSelectedReviewImage(null)}
                    >
                      <div className="relative max-w-2xl max-h-[90vh] bg-white rounded-lg p-2">
                        <button
                          type="button"
                          onClick={() => setSelectedReviewImage(null)}
                          className="absolute -top-3 -right-3 size-8 bg-black text-white rounded-full flex items-center justify-center font-bold shadow-lg"
                        >
                          ✕
                        </button>
                        <img src={selectedReviewImage} alt="Enlarged review photo" className="max-h-[80vh] w-auto object-contain rounded" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Questions Tab */}
              {activeTab === "questions" && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900">Questions & Answers</h3>
                  <div className="divide-y divide-gray-200">
                    {questionsList.map((q) => (
                      <div key={q.id} className="py-4 space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-primary text-sm">Q:</span>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm md:text-base">{q.question}</p>
                            <span className="text-xs text-gray-400">Asked by {q.userName} • {q.date}</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 pl-4 border-l-2 border-primary/40 bg-gray-50/80 p-2.5 rounded">
                          <span className="font-bold text-emerald-700 text-sm">A:</span>
                          <div>
                            <p className="text-gray-800 text-sm">{q.answer}</p>
                            <span className="text-xs text-primary font-medium">Answered by {q.answeredBy}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Ask Question Form */}
                  <form onSubmit={handleQuestionSubmit} className="bg-gray-50 p-4 rounded-lg space-y-3 mt-4">
                    <h4 className="font-bold text-gray-900">Ask a Question</h4>
                    {questionSubmittedMsg && (
                      <p className="text-emerald-700 font-medium text-sm bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                        {questionSubmittedMsg}
                      </p>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        value={questionName}
                        onChange={(e) => setQuestionName(e.target.value)}
                        placeholder="e.g. Mahbub Alam"
                        className="w-full px-3 py-2 text-sm border rounded bg-white outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Question</label>
                      <textarea
                        required
                        rows={3}
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        placeholder="Ask anything about specifications, delivery, or warranty..."
                        className="w-full px-3 py-2 text-sm border rounded bg-white outline-none focus:border-primary"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-primary text-white text-sm font-semibold px-5 py-2 rounded hover:bg-black transition-colors"
                    >
                      Ask Question
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Related Products Sidebar */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-primary border-b pb-2">Related Products</h2>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Mobile Sticky Bottom CTA Bar (positioned right above the bottom nav bar on mobile) */}
      <div className="fixed z-40 xl:hidden bg-white/95 backdrop-blur shadow-[0px_0px_10px_rgb(0_0_0_/_10%)] bottom-[54px] left-0 right-0 border-t border-gray-200">
        <div className="pt-2 pb-3 px-4">
          <div className="gap-2.5 items-center inline-flex w-full">
            <button
              type="button"
              onClick={handleAddToCart}
              className="whitespace-nowrap font-semibold bg-primary text-white shadow py-2 inline-flex items-center text-base justify-center gap-1.5 w-full h-12 rounded hover:bg-black transition-colors"
            >
              Add To Cart
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              className="whitespace-nowrap font-semibold border border-primary bg-white text-primary shadow py-2 inline-flex items-center text-base justify-center gap-1.5 w-full h-12 rounded hover:bg-primary hover:text-white transition-colors"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>

      {/* EMI Calculator / Plans Modal */}
      <EmiModal
        isOpen={isEmiOpen}
        onClose={() => setIsEmiOpen(false)}
        product={product}
      />
    </div>
  );
}
