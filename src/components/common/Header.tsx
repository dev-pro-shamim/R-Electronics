"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/data/categories";
import { PRODUCTS, Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { MobileBottomNav } from "@/components/common/MobileBottomNav";
import { useStoreRuntime } from "@/lib/useStoreRuntime";

export const Header: React.FC = () => {
  const router = useRouter();
  const runtime = useStoreRuntime();
  const liveCategories =
    runtime?.categories && runtime.categories.length > 0
      ? runtime.categories
      : CATEGORIES;
  const liveProducts =
    runtime?.products && runtime.products.length > 0
      ? runtime.products
      : PRODUCTS;
  const {
    totalItems,
    compareList,
    user,
    setIsCartDrawerOpen,
    setIsAuthModalOpen
  } = useCart();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Live search filtering against runtime merged catalog
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const q = searchQuery.toLowerCase();
      const matches = liveProducts.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.model || "").toLowerCase().includes(q)
      ).slice(0, 8);
      setSearchResults(matches);
      setIsSearching(true);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery, liveProducts]);

  // Click outside to dismiss search results & category listener
  useEffect(() => {
    const handleOpenCategories = () => setMobileMenuOpen(true);
    window.addEventListener("open-mobile-categories", handleOpenCategories);

    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node) &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(e.target as Node)
      ) {
        setIsSearching(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("open-mobile-categories", handleOpenCategories);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(false);
      router.push(`/category/all?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 left-0 w-full z-50 bg-white print:hidden">
      {/* Top Bar - Exact Reference Height: 94px desktop, bg-primary #006A4E */}
      <div className="bg-primary pt-4 xl:pt-4.5 pb-4">
        <div className="container flex justify-between items-center">
          {/* Mobile hamburger & Logo */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Open"
              onClick={() => setMobileMenuOpen(true)}
              className="xl:hidden size-6 flex items-center justify-center text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-menu text-white"
              >
                <path d="M4 5h16"></path>
                <path d="M4 12h16"></path>
                <path d="M4 19h16"></path>
              </svg>
            </button>

            <Link className="h-auto w-36 md:w-52 block" href="/">
              <div className="bg-white/95 hover:bg-white px-2.5 py-1 rounded-md shadow-sm inline-flex items-center transition-all">
                <img
                  alt="Rango Electronics"
                  src="/logo.png"
                  className="h-7 md:h-9 w-auto object-contain"
                />
              </div>
            </Link>
          </div>

          {/* Desktop Search Bar */}
          <div className="relative hidden xl:flex 2xl:w-[580px] 3xl:w-[713px]" ref={searchContainerRef}>
            <form
              onSubmit={handleSearchSubmit}
              className="items-center h-11 md:h-15 rounded xl:rounded-lg overflow-hidden w-full flex bg-white shadow-inner"
            >
              <label htmlFor="search-desktop" className="sr-only">Search</label>
              <input
                id="search-desktop"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products brands and more"
                className="w-full bg-white text-gray-900 h-full py-2 px-3 border-0 outline-0 bg-transparent placeholder:text-sm xs:placeholder:text-base font-normal"
                name="search"
                autoComplete="off"
              />
              <button
                type="submit"
                aria-label="Submit Search"
                className="w-17.5 h-full bg-[#F6F6F6] hover:bg-gray-200 transition-colors grid place-items-center cursor-pointer border-l border-gray-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-search text-primary size-6"
                >
                  <path d="m21 21-4.34-4.34"></path>
                  <circle cx="11" cy="11" r="8"></circle>
                </svg>
              </button>
            </form>

            {/* Desktop Live Search Dropdown */}
            {isSearching && searchResults.length > 0 && (
              <div className="absolute top-[102%] left-0 w-full bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden divide-y divide-gray-100 max-h-[420px] overflow-y-auto">
                {searchResults.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    onClick={() => setIsSearching(false)}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                  >
                    <img
                      src={product.thumbnail || product.images?.[0] || "/placeholder.png"}
                      alt={product.title}
                      className="size-12 object-contain rounded border border-gray-100 p-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{product.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-semibold text-primary">৳ {product.price.toLocaleString()}</span>
                        {product.originalPrice && (
                          <span className="text-xs text-gray-400 line-through">৳ {product.originalPrice.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
                <div className="p-2.5 bg-gray-50 text-center">
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    View all results for &ldquo;{searchQuery}&rdquo;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Action Icons & Links */}
          <div className="flex items-center gap-7.5">
            <div className="hidden xl:flex items-center gap-7">
              {/* Offers link with animated gift icon */}
              <Link
                className="flex items-center text-base leading-[60px] font-semibold text-white hover:text-secondary transition-colors"
                href="/offer"
              >
                <img src="/gift.gif" alt="Offers" width="40" height="40" className="mr-2" />
                Offers
              </Link>

              {/* Compare link */}
              <Link
                className="height-6 text-base leading-[60px] font-semibold text-white flex items-center gap-1.5 hover:text-secondary transition-colors"
                href="/compare"
              >
                <div className="relative">
                  <svg className="mr-2.5" width="23" height="26" viewBox="0 0 23 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M22.8875 18.9819C22.8875 19.2008 22.8013 19.4107 22.6481 19.5655C22.4948 19.7202 22.2869 19.8072 22.0701 19.8072H2.79194L7.93638 24.9997C8.08986 25.1546 8.17608 25.3648 8.17608 25.584C8.17608 25.8031 8.08986 26.0133 7.93638 26.1682C7.7829 26.3232 7.57474 26.4103 7.35769 26.4103C7.14064 26.4103 6.93248 26.3232 6.77901 26.1682L0.240156 19.5662C0.16404 19.4895 0.103649 19.3985 0.0624447 19.2982C0.0212383 19.1979 2.86102e-05 19.0905 2.86102e-05 18.9819C2.86102e-05 18.8734 0.0212383 18.7659 0.0624447 18.6656C0.103649 18.5654 0.16404 18.4743 0.240156 18.3976L6.77901 11.7956C6.93248 11.6406 7.14064 11.5536 7.35769 11.5536C7.57474 11.5536 7.7829 11.6406 7.93638 11.7956C8.08986 11.9506 8.17608 12.1607 8.17608 12.3799C8.17608 12.599 8.08986 12.8092 7.93638 12.9642L2.79194 18.1567H22.0701C22.2869 18.1567 22.4948 18.2436 22.6481 18.3984C22.8013 18.5531 22.8875 18.763 22.8875 18.9819ZM0.00148964 7.42834C0.00148964 7.64721 0.0876026 7.85712 0.240887 8.01188C0.394171 8.16665 0.602068 8.2536 0.818846 8.2536H20.097L14.9526 13.4461C14.8766 13.5228 14.8163 13.6139 14.7752 13.7142C14.734 13.8144 14.7129 13.9219 14.7129 14.0304C14.7129 14.1389 14.734 14.2463 14.7752 14.3466C14.8163 14.4468 14.8766 14.5379 14.9526 14.6147C15.0286 14.6914 15.1188 14.7523 15.2181 14.7938C15.3174 14.8353 15.4238 14.8567 15.5313 14.8567C15.6387 14.8567 15.7451 14.8353 15.8444 14.7938C15.9437 14.7523 16.0339 14.6914 16.1099 14.6147L22.6488 8.01262C22.7249 7.93596 22.7853 7.84489 22.8265 7.74463C22.8677 7.64437 22.8889 7.53689 22.8889 7.42834C22.8889 7.31979 22.8677 7.21231 22.8265 7.11205C22.7853 7.01179 22.7249 6.92072 22.6488 6.84406L16.1099 0.242017C15.9565 0.0870561 15.7483 0 15.5313 0C15.3142 0 15.106 0.0870561 14.9526 0.242017C14.7991 0.396978 14.7129 0.60715 14.7129 0.826298C14.7129 1.04545 14.7991 1.25562 14.9526 1.41058L20.097 6.60309H0.818846C0.602068 6.60309 0.394171 6.69003 0.240887 6.8448C0.0876026 6.99956 0.00148964 7.20947 0.00148964 7.42834Z" fill="currentColor"></path>
                  </svg>
                  {compareList.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-secondary text-white text-[10px] rounded-full size-4 flex items-center justify-center font-bold">
                      {compareList.length}
                    </span>
                  )}
                </div>
                Compare
              </Link>
            </div>

            <div className="flex items-center gap-4">
              {/* Cart Button with Count Badge */}
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(true)}
                className="relative text-white border border-gray-400 size-10 2xl:size-15 rounded-full grid place-items-center hover:border-white transition-colors"
                aria-label="View Cart"
              >
                <svg className="size-4.5 xl:size-7.5" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 19C4 19.5304 4.21071 20.0391 4.58579 20.4142C4.96086 20.7893 5.46957 21 6 21C6.53043 21 7.03914 20.7893 7.41421 20.4142C7.78929 20.0391 8 19.5304 8 19C8 18.4696 7.78929 17.9609 7.41421 17.5858C7.03914 17.2107 6.53043 17 6 17C5.46957 17 4.96086 17.2107 4.58579 17.5858C4.21071 17.9609 4 18.4696 4 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                  <path d="M15 19C15 19.5304 15.2107 20.0391 15.5858 20.4142C15.9609 20.7893 16.4696 21 17 21C17.5304 21 18.0391 20.7893 18.4142 20.4142C18.7893 20.0391 19 19.5304 19 19C19 18.4696 18.7893 17.9609 18.4142 17.5858C18.0391 17.2107 17.5304 17 17 17C16.4696 17 15.9609 17.2107 15.5858 17.5858C15.2107 17.9609 15 18.4696 15 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                  <path d="M17 17H6V3H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                  <path d="M6 5L20 6L19 13H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                <span className="absolute top-1 right-1 xl:top-1.5 xl:right-1.5 bg-white text-primary text-xs font-bold rounded-full size-4 xl:size-5 flex items-center justify-center">
                  {totalItems}
                </span>
              </button>

              {/* Account / Login Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (user) {
                      router.push("/account");
                    } else {
                      setIsAuthModalOpen(true);
                    }
                  }}
                  className="relative text-white border border-gray-400 size-10 2xl:size-15 rounded-full hidden xl:grid place-items-center overflow-hidden hover:border-white transition-colors"
                  aria-label="User Account"
                >
                  <svg className="size-4.5 xl:size-6" width="28" height="30" viewBox="0 0 28 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M27.9954 29.0467C27.9753 28.8836 27.9592 28.7206 27.9419 28.5575C27.9138 28.2814 27.8843 27.9974 27.8415 27.7107C27.6435 26.3655 27.2302 25.0638 26.6148 23.8396C25.1419 20.9152 22.8611 18.7363 19.827 17.357C20.3501 16.9862 20.8464 16.5851 21.2865 16.0973C23.2544 13.9145 24.1012 11.3675 23.8028 8.52723C23.6303 6.88882 23.0644 5.42005 22.1213 4.16035C19.6665 0.884863 16.3663 -0.466883 12.3142 0.141929C9.9651 0.49433 7.98255 1.61991 6.42273 3.48448C4.50171 5.78034 3.79136 8.41809 4.31175 11.3228C4.61274 13.0032 5.3766 14.5588 6.58326 15.946C7.05816 16.4917 7.58657 16.9704 8.16181 17.3754C6.20467 18.2511 4.5298 19.5082 3.18268 21.1177C1.29377 23.3714 0.223568 26.05 0.00283803 29.0782C-0.0212416 29.4057 0.112534 29.62 0.228919 29.741C0.389449 29.908 0.612854 30 0.860339 30C0.864352 30 0.869704 30 0.873717 30L1.1319 29.9961C1.53189 29.9908 1.93188 29.9855 2.33187 29.9855C2.73587 29.9855 3.16128 29.7291 3.20275 29.1584C3.2081 29.0874 3.21211 29.0177 3.21746 28.9467C3.23084 28.7298 3.24422 28.5247 3.27365 28.3327C3.53585 26.5891 4.16459 25.0361 5.14249 23.7173C7.05682 21.1374 9.65207 19.6476 12.8587 19.2873C14.1697 19.14 15.5061 19.2399 16.8331 19.5818C18.8384 20.0999 20.5548 21.1361 22.0798 22.7508C23.3895 24.1367 24.251 25.8185 24.6389 27.7502C24.6991 28.05 24.7299 28.3655 24.762 28.6995C24.7767 28.8573 24.7928 29.0138 24.8102 29.1703C24.8436 29.7436 25.2623 29.9987 25.665 29.9987H25.673C25.875 29.9974 26.077 29.9947 26.2804 29.9921C26.572 29.9882 26.8623 29.9855 27.1539 29.9829C27.4857 29.9816 27.6863 29.8343 27.7974 29.7107C27.9084 29.5871 28.0315 29.3728 27.9927 29.0467H27.9954ZM20.6952 9.60152C20.7126 11.2991 20.013 12.973 18.7756 14.1946C17.5034 15.449 15.7897 16.1328 13.9596 16.1196C10.2808 16.0946 7.30029 13.1466 7.31635 9.54892C7.3324 6.05122 10.3704 3.08737 13.9516 3.07553C13.9596 3.07553 13.9663 3.07553 13.9744 3.07553C15.8151 3.07553 17.5261 3.7685 18.7929 5.0282C20.0277 6.25634 20.722 7.91578 20.6966 9.58311V9.59232V9.60152H20.6952Z" fill="currentColor"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar - Directly under logo and hamburger */}
        <div className="relative xl:hidden flex mx-4 mt-3" ref={mobileSearchRef}>
          <form
            onSubmit={handleSearchSubmit}
            className="items-center h-11 md:h-15 rounded xl:rounded-lg overflow-hidden 2xl:w-[580px] 3xl:w-[713px] flex w-full bg-white shadow-inner"
          >
            <label htmlFor="search-mobile" className="sr-only">Search</label>
            <input
              id="search-mobile"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products brands and more"
              className="w-full bg-white text-gray-900 h-full py-2 px-3 border-0 outline-0 bg-transparent placeholder:text-sm xs:placeholder:text-base font-normal"
              name="search"
              autoComplete="off"
            />
            <button
              type="submit"
              aria-label="Search"
              className="w-17.5 h-full bg-[#F6F6F6] hover:bg-gray-200 transition-colors grid place-items-center cursor-pointer border-l border-gray-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-search text-primary size-6"
              >
                <path d="m21 21-4.34-4.34"></path>
                <circle cx="11" cy="11" r="8"></circle>
              </svg>
            </button>
          </form>

          {/* Mobile Live Search Dropdown */}
          {isSearching && searchResults.length > 0 && (
            <div className="absolute top-[102%] left-0 w-full bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden divide-y divide-gray-100 max-h-[360px] overflow-y-auto">
              {searchResults.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  onClick={() => setIsSearching(false)}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                >
                  <img
                    src={product.thumbnail || product.images?.[0] || "/placeholder.png"}
                    alt={product.title}
                    className="size-10 object-contain rounded border border-gray-100 p-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 line-clamp-1">{product.title}</p>
                    <span className="text-xs font-semibold text-primary">৳ {product.price.toLocaleString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Secondary Category Navigation - Exact Reference Height: 52px, shadow-sm hidden xl:block */}
      <nav className="relative z-40 bg-white shadow-sm hidden xl:block border-b border-gray-100">
        <div className="relative z-10 bg-white">
          <div className="container flex items-center justify-between gap-2 3xl:gap-2.5 overflow-visible">
            {liveCategories.map((category, idx) => {
              const isRightAligned = idx >= 6;
              return (
                <span key={category.id} className="relative flex gap-1 items-center group h-[52px] shrink-0">
                  <Link
                    className="text-[13px] 2xl:text-[14.5px] whitespace-nowrap text-gray-900 transition-colors font-semibold block group-hover:text-primary duration-200 tracking-tight"
                    href={`/category/${category.slug}`}
                  >
                    {category.name}
                  </Link>

                  {category.subcategories && category.subcategories.length > 0 && (
                    <>
                      <svg
                        strokeWidth="2"
                        className="stroke-gray-900 group-hover:stroke-primary group-hover:rotate-180 transition-transform duration-200"
                        width="18"
                        height="18"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>

                      <div
                        className={`absolute bg-white shadow-xl rounded-xl w-[230px] top-full hidden group-hover:flex flex-col animated fadeInUp ${
                          isRightAligned ? "right-0" : "left-0"
                        } p-1.5 border border-gray-200 z-50`}
                      >
                        {category.subcategories.map((sub) => (
                          <span key={sub.id} className="relative">
                            <Link
                              className="text-sm font-medium text-gray-800 hover:text-primary hover:bg-white transition-colors p-2.5 flex items-center justify-between rounded duration-150"
                              href={`/category/${sub.slug}`}
                            >
                              {sub.name}
                            </Link>
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 w-[300px] max-w-[85vw] bg-white shadow-2xl flex flex-col z-50">
            {/* Drawer Header */}
            <div className="p-4 bg-primary flex items-center justify-between">
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                <div className="bg-white px-2 py-1 rounded inline-block">
                  <img src="/logo.png" alt="Rango Electronics" className="h-7 w-auto object-contain" />
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="text-white hover:bg-white/10 p-1.5 rounded-full"
                aria-label="Close menu"
              >
                <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Quick Links in Drawer */}
            <div className="p-3 bg-gray-50 border-b flex items-center justify-around text-xs font-medium">
              <Link
                href="/offer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-1.5 text-primary hover:text-secondary"
              >
                <img src="/gift.gif" alt="Offer" className="size-5" />
                Offers
              </Link>
              <Link
                href="/compare"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-1.5 text-gray-700 hover:text-primary"
              >
                Compare ({compareList.length})
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (user) router.push("/account");
                  else setIsAuthModalOpen(true);
                }}
                className="text-gray-700 hover:text-primary"
              >
                {user ? "Account" : "Login"}
              </button>
            </div>

            {/* Categories Accordion */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-2">Categories</p>
              {liveCategories.map((cat) => {
                const isExpanded = expandedMobileCategory === cat.id;
                return (
                  <div key={cat.id} className="border-b border-gray-100 last:border-0 pb-1">
                    <div className="flex items-center justify-between py-2">
                      <Link
                        href={`/category/${cat.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-sm font-medium text-gray-800 hover:text-primary flex-1"
                      >
                        {cat.name}
                      </Link>
                      {cat.subcategories && cat.subcategories.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedMobileCategory(isExpanded ? null : cat.id)}
                          className="p-1 text-gray-400 hover:text-primary"
                          aria-label={`Expand ${cat.name}`}
                        >
                          <svg
                            className={`size-4 transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Subcategories list */}
                    {isExpanded && cat.subcategories && (
                      <div className="pl-4 py-1 space-y-1.5 bg-gray-50 rounded-lg mb-2">
                        {cat.subcategories.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/category/${sub.slug}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block text-xs font-normal text-gray-600 hover:text-primary py-1"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Drawer Footer with Hotline & Location */}
            <div className="p-4 bg-gray-100 border-t text-sm text-gray-700">
              <p className="font-bold text-gray-900 mb-2 text-base">Customer Support</p>
              <div className="space-y-1.5">
                <a href="tel:+8801798565001" className="text-primary font-bold text-base flex items-center gap-2 hover:underline">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  +88 01798-565001
                </a>
                <a href="tel:+8801554565001" className="text-primary font-bold text-base flex items-center gap-2 hover:underline">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  +88 01554-565001
                </a>
              </div>
              <p className="text-xs text-gray-800 mt-2.5 font-medium leading-relaxed">
                <strong>Location:</strong> H-11 R-11 DIT Project Merul Badda Dhaka
              </p>
              <a href="mailto:electronics.rango@gmail.com" className="text-xs text-primary mt-1 block font-medium hover:underline">
                Email: electronics.rango@gmail.com
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Mobile Bottom Navigation Bar matching reference */}
      <MobileBottomNav onOpenCategoryDrawer={() => setMobileMenuOpen(true)} />
    </header>
  );
};
