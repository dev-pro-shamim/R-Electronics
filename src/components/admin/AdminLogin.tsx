"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";

interface AdminLoginProps {
  onSuccess: (user: { email: string; role: string; name?: string }) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState("admin@rangoelectronics.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Sign in failed. Please verify credentials.");
      } else {
        onSuccess({
          email: json.email,
          role: json.role || "Super Admin",
          name: json.name || "Rango Admin",
        });
      }
    } catch {
      setError("Network error while verifying admin credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#004E7C] to-[#0084C7] flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl border border-white/20 shadow-2xl p-7 sm:p-9 space-y-6">
        <div className="text-center space-y-2.5">
          <div className="size-16 mx-auto rounded-2xl bg-gradient-to-br from-[#0084C7] to-[#006DA6] text-white flex items-center justify-center shadow-lg">
            <ShieldCheck className="size-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Rango Electronics Enterprise
          </h1>
          <p className="text-xs text-slate-500">
            Centralized E-Commerce Control — Sales, Accounts, Inventory, Courier &amp; CMS
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700 font-semibold">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Administrator Email
            </label>
            <div className="relative">
              <Mail className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@rangoelectronics.com"
                className="w-full h-11 pl-10 pr-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#0084C7] text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter administrator password"
                className="w-full h-11 pl-10 pr-10 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#0084C7] text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <button
            id="admin-login-submit"
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[#0084C7] to-[#006DA6] text-white font-bold text-sm hover:opacity-95 transition-opacity flex items-center justify-center gap-2 shadow-md disabled:opacity-60 cursor-pointer"
          >
            <span>{loading ? "Authenticating..." : "Sign In to Enterprise Dashboard"}</span>
            <ArrowRight className="size-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <Link href="/" className="hover:text-[#0084C7] font-semibold">
            ← Back to Storefront
          </Link>
          <span>Role-Based Session Auth</span>
        </div>
      </div>
    </div>
  );
};
