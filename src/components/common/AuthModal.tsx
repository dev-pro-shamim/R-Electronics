"use client";

import React from "react";
import { useCart } from "@/context/CartContext";
import AuthPanel from "./AuthPanel";

export function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen } = useCart();

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <AuthPanel variant="modal" onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}

export default AuthModal;
