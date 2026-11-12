"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ArrowRight } from "lucide-react";
import { useStoreRuntime } from "@/lib/useStoreRuntime";
import { AdminPopupItem } from "@/types/admin";

export const PromoPopupModal: React.FC = () => {
  const pathname = usePathname();
  const runtime = useStoreRuntime();
  const [activePopup, setActivePopup] = useState<AdminPopupItem | null>(null);

  useEffect(() => {
    if (!runtime?.popups?.length || !pathname || pathname.startsWith("/admin")) return;

    const today = new Date().toISOString().slice(0, 10);
    const hasVisitedBefore = Boolean(localStorage.getItem("rango_repeat_visitor"));
    if (!hasVisitedBefore) {
      localStorage.setItem("rango_repeat_visitor", "1");
    }

    const match = runtime.popups.find((p) => {
      if (!p.active) return false;
      if (p.startDate && today < p.startDate) return false;
      if (p.endDate && today > p.endDate) return false;

      if (p.targetPages === "homepage" && pathname !== "/") return false;
      if (
        p.targetPages === "selected" &&
        !(p.selectedPaths || []).some((path) => pathname.startsWith(path))
      ) {
        return false;
      }

      if (p.visitorRule === "first_visit" && hasVisitedBefore) return false;
      if (p.visitorRule === "repeat_visit" && !hasVisitedBefore) return false;

      const storageKey = `rango_popup_seen_${p.id}`;
      if (p.frequency === "once_per_session" && sessionStorage.getItem(storageKey)) {
        return false;
      }
      if (p.frequency === "once_per_day" && localStorage.getItem(storageKey) === today) {
        return false;
      }
      return true;
    });

    if (!match) return;

    const timer = setTimeout(() => {
      setActivePopup(match);
      const storageKey = `rango_popup_seen_${match.id}`;
      sessionStorage.setItem(storageKey, "1");
      localStorage.setItem(storageKey, today);
    }, Math.max(0, Number(match.delaySeconds || 2)) * 1000);

    return () => clearTimeout(timer);
  }, [runtime?.popups, pathname]);

  if (!activePopup) return null;

  if (activePopup.displayPosition === "top-bar") {
    return (
      <div className="fixed top-0 inset-x-0 z-50 bg-gradient-to-r from-[#0084C7] via-[#006DA6] to-[#FF7A00] text-white px-4 py-2.5 shadow-lg flex items-center justify-center gap-4 text-xs sm:text-sm font-semibold">
        <span className="truncate">{activePopup.title} — {activePopup.description}</span>
        <Link
          href={activePopup.buttonLink || "/offer"}
          onClick={() => setActivePopup(null)}
          className="px-3 py-1 rounded-full bg-white text-[#0084C7] text-xs font-bold shrink-0"
        >
          {activePopup.buttonText || "View Offer"}
        </Link>
        <button
          type="button"
          aria-label="Close announcement"
          onClick={() => setActivePopup(null)}
          className="p-1 hover:bg-white/20 rounded-full"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  if (activePopup.displayPosition === "bottom-right") {
    return (
      <div className="fixed bottom-20 right-4 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        <button
          type="button"
          aria-label="Close popup"
          onClick={() => setActivePopup(null)}
          className="absolute top-2.5 right-2.5 size-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black z-10"
        >
          <X className="size-4" />
        </button>
        {(activePopup.desktopImage || activePopup.mobileImage) && (
          <>
            {activePopup.desktopImage && (
              <img
                src={activePopup.desktopImage}
                alt={activePopup.title}
                className={`${activePopup.mobileImage ? "hidden sm:block" : "block"} w-full h-36 object-cover`}
              />
            )}
            {activePopup.mobileImage && (
              <img
                src={activePopup.mobileImage}
                alt={activePopup.title}
                className="sm:hidden block w-full h-36 object-cover"
              />
            )}
          </>
        )}
        <div className="p-4">
          <h4 className="font-bold text-slate-900 text-sm">{activePopup.title}</h4>
          <p className="text-xs text-slate-600 mt-1 line-clamp-2">{activePopup.description}</p>
          <Link
            href={activePopup.buttonLink || "/offer"}
            onClick={() => setActivePopup(null)}
            className="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#0084C7] hover:bg-[#006DA6] text-white text-xs font-bold"
          >
            <span>{activePopup.buttonText || "Claim Offer"}</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        <button
          type="button"
          aria-label="Close promotional popup"
          onClick={() => setActivePopup(null)}
          className="absolute top-3 right-3 size-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black z-10"
        >
          <X className="size-4" />
        </button>
        {(activePopup.desktopImage || activePopup.mobileImage) && (
          <>
            {activePopup.desktopImage && (
              <img
                src={activePopup.desktopImage}
                alt={activePopup.title}
                className={`${activePopup.mobileImage ? "hidden sm:block" : "block"} w-full max-h-64 object-cover`}
              />
            )}
            {activePopup.mobileImage && (
              <img
                src={activePopup.mobileImage}
                alt={activePopup.title}
                className="sm:hidden block w-full max-h-56 object-cover"
              />
            )}
          </>
        )}
        <div className="p-6 text-center">
          <h3 className="text-xl font-extrabold text-slate-900">{activePopup.title}</h3>
          <p className="text-sm text-slate-600 mt-2">{activePopup.description}</p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              href={activePopup.buttonLink || "/offer"}
              onClick={() => setActivePopup(null)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0084C7] to-[#006DA6] text-white text-sm font-bold shadow-md hover:opacity-95 inline-flex items-center gap-2"
            >
              <span>{activePopup.buttonText || "Shop Now"}</span>
              <ArrowRight className="size-4" />
            </Link>
            <button
              type="button"
              onClick={() => setActivePopup(null)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
