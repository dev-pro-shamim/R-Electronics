"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";

interface MobileBottomNavProps {
  onOpenCategoryDrawer?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenCategoryDrawer }) => {
  const pathname = usePathname();
  const { totalItems, user, setIsAuthModalOpen, wishlist } = useCart();

  const isHome = pathname === "/";
  const isOffer = pathname === "/offer";
  const isWishlist = pathname.includes("/wishlist");
  const isAccount = pathname.startsWith("/account");
  const isCart = pathname === "/cart";

  const handleAccountClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      setIsAuthModalOpen(true);
    }
  };

  return (
    <div className="fixed z-40 xl:hidden bg-white/95 backdrop-blur shadow-[0px_0px_10px_rgb(0_0_0_/_10%)] bottom-0 left-0 right-0 border-t border-gray-200 print:hidden">
      <div className="shadow-md pt-2.5 pb-2 grid grid-cols-5 items-center gap-1 px-1">
        {/* 1. Home */}
        <Link
          href="/"
          className={`text-xs font-medium flex flex-col gap-1 items-center transition-colors ${
            isHome ? "text-primary" : "text-gray-600 hover:text-primary"
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              opacity="0.8"
              d="M12.8149 0.53712C12.5314 0.254481 12.1468 0.0957031 11.7458 0.0957031C11.3448 0.0957031 10.9603 0.254481 10.6767 0.53712L0.625057 10.5569C0.554758 10.627 0.498994 10.7102 0.460948 10.8018C0.422902 10.8933 0.40332 10.9915 0.40332 11.0906C0.40332 11.1897 0.422902 11.2879 0.460948 11.3794C0.498994 11.471 0.554758 11.5542 0.625057 11.6243C0.767033 11.7659 0.959594 11.8454 1.16038 11.8454C1.2598 11.8454 1.35824 11.8259 1.45009 11.7879C1.54194 11.75 1.6254 11.6944 1.6957 11.6243L2.67258 10.6489V18.6288C2.67258 19.2286 2.91156 19.8038 3.33695 20.2279C3.76234 20.652 4.3393 20.8903 4.94089 20.8903H18.5507C19.1523 20.8903 19.7293 20.652 20.1547 20.2279C20.5801 19.8038 20.819 19.2286 20.819 18.6288V10.6489L21.7959 11.6243C21.9379 11.7659 22.1305 11.8454 22.3312 11.8454C22.532 11.8454 22.7246 11.7659 22.8666 11.6243C23.0085 11.4828 23.0883 11.2908 23.0883 11.0906C23.0883 10.8904 23.0085 10.6984 22.8666 10.5569L19.3068 7.00942V2.04476C19.3068 1.84484 19.2272 1.6531 19.0854 1.51173C18.9436 1.37036 18.7513 1.29094 18.5507 1.29094H17.0385C16.838 1.29094 16.6457 1.37036 16.5039 1.51173C16.3621 1.6531 16.2824 1.84484 16.2824 2.04476V3.99414L12.8149 0.53712ZM19.3068 9.14123V18.6288C19.3068 18.8287 19.2272 19.0205 19.0854 19.1618C18.9436 19.3032 18.7513 19.3826 18.5507 19.3826H4.94089C4.74036 19.3826 4.54804 19.3032 4.40625 19.1618C4.26445 19.0205 4.18479 18.8287 4.18479 18.6288V9.14123L11.7458 1.60302L19.3068 9.14123Z"
              fill="currentColor"
            />
          </svg>
          <span>Home</span>
        </Link>

        {/* 2. Category */}
        <button
          type="button"
          onClick={() => {
            if (onOpenCategoryDrawer) {
              onOpenCategoryDrawer();
            } else {
              // Trigger category drawer or mobile menu event
              window.dispatchEvent(new CustomEvent("open-mobile-categories"));
            }
          }}
          className="text-xs font-medium text-gray-600 hover:text-primary flex flex-col gap-1 items-center transition-colors"
        >
          <svg width="22" height="22" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              opacity="0.8"
              d="M0.0200195 3.01177C0.0200195 2.47459 0.233414 1.95941 0.613259 1.57957C0.993103 1.19972 1.50828 0.986328 2.04546 0.986328H6.09635C6.63354 0.986328 7.14872 1.19972 7.52856 1.57957C7.9084 1.95941 8.1218 2.47459 8.1218 3.01177V7.06266C8.1218 7.59984 7.9084 8.11502 7.52856 8.49487C7.14872 8.87471 6.63354 9.08811 6.09635 9.08811H2.04546C1.50828 9.08811 0.993103 8.87471 0.613259 8.49487C0.233414 8.11502 0.0200195 7.59984 0.0200195 7.06266V3.01177ZM10.8224 3.01177C10.8224 2.47459 11.0358 1.95941 11.4156 1.57957C11.7955 1.19972 12.3107 0.986328 12.8478 0.986328H16.8987C17.4359 0.986328 17.9511 1.19972 18.3309 1.57957C18.7108 1.95941 18.9242 2.47459 18.9242 3.01177V7.06266C18.9242 7.59984 18.7108 8.11502 18.3309 8.49487C17.9511 8.87471 17.4359 9.08811 16.8987 9.08811H12.8478C12.3107 9.08811 11.7955 8.87471 11.4156 8.49487C11.0358 8.11502 10.8224 7.59984 10.8224 7.06266V3.01177ZM0.0200195 13.8141C0.0200195 13.277 0.233414 12.7618 0.613259 12.3819C0.993103 12.0021 1.50828 11.7887 2.04546 11.7887H6.09635C6.63354 11.7887 7.14872 12.0021 7.52856 12.3819C7.9084 12.7618 8.1218 13.277 8.1218 13.8141V17.865C8.1218 18.4022 7.9084 18.9174 7.52856 19.2972C7.14872 19.6771 6.63354 19.8905 6.09635 19.8905H2.04546C1.50828 19.8905 0.993103 19.6771 0.613259 19.2972C0.233414 18.9174 0.0200195 18.4022 0.0200195 17.865V13.8141ZM10.8224 13.8141C10.8224 13.277 11.0358 12.7618 11.4156 12.3819C11.7955 12.0021 12.3107 11.7887 12.8478 11.7887H16.8987C17.4359 11.7887 17.9511 12.0021 18.3309 12.3819C18.7108 12.7618 18.9242 13.277 18.9242 13.8141V17.865C18.9242 18.4022 18.7108 18.9174 18.3309 19.2972C17.9511 19.6771 17.4359 19.8905 16.8987 19.8905H12.8478C12.3107 19.8905 11.7955 19.6771 11.4156 19.2972C11.0358 18.9174 10.8224 18.4022 10.8224 17.865V13.8141Z"
              fill="currentColor"
            />
          </svg>
          <span>Category</span>
        </button>

        {/* 3. Offer (Center Highlighted with animated gift box) */}
        <Link
          href="/offer"
          className="text-xs font-medium flex flex-col gap-1 items-center size-full -mt-2 group"
        >
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 p-0.5 shadow-md flex items-center justify-center transition-transform group-hover:scale-105">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
              <span className="text-xl">🎁</span>
            </div>
          </div>
          <span className={`text-[11px] ${isOffer ? "text-primary font-bold" : "text-gray-700"}`}>
            Offers
          </span>
        </Link>

        {/* 4. Cart / Wishlist */}
        <Link
          href="/cart"
          className={`text-xs font-medium flex flex-col gap-1 items-center relative transition-colors ${
            isCart ? "text-primary" : "text-gray-600 hover:text-primary"
          }`}
        >
          <div className="relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-primary text-white text-[10px] font-bold rounded-full size-4.5 flex items-center justify-center border border-white">
                {totalItems}
              </span>
            )}
          </div>
          <span>Cart</span>
        </Link>

        {/* 5. Sign In / Account */}
        <Link
          href={user ? "/account/order" : "/account"}
          onClick={handleAccountClick}
          className={`text-xs font-medium flex flex-col gap-1 items-center transition-colors ${
            isAccount ? "text-primary" : "text-gray-600 hover:text-primary"
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 28 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M27.9954 29.0467C27.9753 28.8836 27.9592 28.7206 27.9419 28.5575C27.9138 28.2814 27.8843 27.9974 27.8415 27.7107C27.6435 26.3655 27.2302 25.0638 26.6148 23.8396C25.1419 20.9152 22.8611 18.7363 19.827 17.357C20.3501 16.9862 20.8464 16.5851 21.2865 16.0973C23.2544 13.9145 24.1012 11.3675 23.8028 8.52723C23.6303 6.88882 23.0644 5.42005 22.1213 4.16035C19.6665 0.884863 16.3663 -0.466883 12.3142 0.141929C9.9651 0.49433 7.98255 1.61991 6.42273 3.48448C4.50171 5.78034 3.79136 8.41809 4.31175 11.3228C4.61274 13.0032 5.3766 14.5588 6.58326 15.946C7.05816 16.4917 7.58657 16.9704 8.16181 17.3754C6.20467 18.2511 4.5298 19.5082 3.18268 21.1177C1.29377 23.3714 0.223568 26.05 0.00283803 29.0782C-0.0212416 29.4057 0.112534 29.62 0.228919 29.741C0.389449 29.908 0.612854 30 0.860339 30C0.864352 30 0.869704 30 0.873717 30L1.1319 29.9961C1.53189 29.9908 1.93188 29.9855 2.33187 29.9855C2.73587 29.9855 3.16128 29.7291 3.20275 29.1584C3.2081 29.0874 3.21211 29.0177 3.21746 28.9467C3.23084 28.7298 3.24422 28.5247 3.27365 28.3327C3.53585 26.5891 4.16459 25.0361 5.14249 23.7173C7.05682 21.1374 9.65207 19.6476 12.8587 19.2873C14.1697 19.14 15.5061 19.2399 16.8331 19.5818C18.8384 20.0999 20.5548 21.1361 22.0798 22.7508C23.3895 24.1367 24.251 25.8185 24.6389 27.7502C24.6991 28.05 24.7299 28.3655 24.762 28.6995C24.7767 28.8573 24.7928 29.0138 24.8102 29.1703C24.8436 29.7436 25.2623 29.9987 25.665 29.9987H25.673C25.875 29.9974 26.077 29.9947 26.2804 29.9921C26.572 29.9882 26.8623 29.9855 27.1539 29.9829C27.4857 29.9816 27.6863 29.8343 27.7974 29.7107C27.9084 29.5871 28.0315 29.3728 27.9927 29.0467H27.9954ZM20.6952 9.60152C20.7126 11.2991 20.013 12.973 18.7756 14.1946C17.5034 15.449 15.7897 16.1328 13.9596 16.1196C10.2808 16.0946 7.30029 13.1466 7.31635 9.54892C7.3324 6.05122 10.3704 3.08737 13.9516 3.07553C13.9596 3.07553 13.9663 3.07553 13.9744 3.07553C15.8151 3.07553 17.5261 3.7685 18.7929 5.0282C20.0277 6.25634 20.722 7.91578 20.6966 9.58311V9.59232V9.60152H20.6952Z"
              fill="currentColor"
            />
          </svg>
          <span>{user ? "Account" : "Sign In"}</span>
        </Link>
      </div>
    </div>
  );
};
