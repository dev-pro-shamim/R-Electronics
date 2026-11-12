"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AuthModal } from "@/components/common/AuthModal";
import { Chatbot } from "@/components/chatbot/Chatbot";
import { TrackingScripts } from "@/components/layout/TrackingScripts";
import { PromoPopupModal } from "@/components/layout/PromoPopupModal";

export const StorefrontShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return <div className="min-h-screen bg-[#F8FAFC]">{children}</div>;
  }

  return (
    <>
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
      <CartDrawer />
      <AuthModal />
      <Chatbot />
      <TrackingScripts />
      <PromoPopupModal />
    </>
  );
};
