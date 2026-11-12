"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, PhoneCall } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected runtime error to console or error tracking service
    console.error("Critical Runtime Error caught by ErrorBoundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-200/80 p-8 text-center space-y-5 animate-fadeIn">
        {/* Warning Icon Badge */}
        <div className="size-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle className="size-8 stroke-[2.2]" />
        </div>

        {/* Heading */}
        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">
            Unexpected Glitch Encountered
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            We encountered a temporary network or rendering issue. Your cart and stored orders are safe and preserved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => reset()}
            className="w-full h-11 bg-primary hover:bg-[#00542c] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="size-4" />
            <span>Reload &amp; Try Again</span>
          </button>

          <Link
            href="/"
            className="w-full h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Home className="size-4" />
            <span>Return to Homepage</span>
          </Link>
        </div>

        {/* Hotline Support Footer */}
        <div className="pt-4 border-t border-gray-100 text-[11px] text-gray-400">
          <p>Need urgent help? Call Rango Support:</p>
          <a
            href="tel:+8801798565001"
            className="text-primary font-bold hover:underline inline-flex items-center gap-1 mt-1"
          >
            <PhoneCall className="size-3" /> +88 01798-565001
          </a>
        </div>
      </div>
    </div>
  );
}
