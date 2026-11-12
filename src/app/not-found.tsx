import React from "react";
import Link from "next/link";
import { Search, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-gray-50/60 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center space-y-6">
        <div className="size-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto text-3xl font-black">
          404
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Page Not Found</h1>
          <p className="text-xs text-gray-500 leading-relaxed">
            The product or page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
          <Link
            href="/"
            className="h-10 px-5 bg-primary hover:bg-[#00542c] text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Home className="size-4" />
            <span>Go to Homepage</span>
          </Link>
          <Link
            href="/category/air-conditioner"
            className="h-10 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Search className="size-4" />
            <span>Browse Products</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
