"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

type AuthMode = "signin" | "register" | "otp";

interface AuthPanelProps {
  variant?: "modal" | "page";
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function AuthPanel({
  variant = "modal",
  onClose,
  onSuccess,
}: AuthPanelProps) {
  const { setIsAuthModalOpen, setAuthenticatedUser, showToast } = useCart();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sandboxOtpHint, setSandboxOtpHint] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const oauthErr = new URLSearchParams(window.location.search).get("oauth_error");
    if (oauthErr === "google_not_configured") {
      setError(
        "Direct Google Sign-In is not configured yet. Please sign in with Email & Password or Mobile OTP, or add Google Client ID & Secret in Admin Settings."
      );
    } else if (oauthErr) {
      setError("Google Sign-In could not be completed. Please try again or use Email & Password.");
    }
  }, []);

  const finishAuth = () => {
    setIsAuthModalOpen(false);
    onClose?.();
    onSuccess?.();
  };

  const resetForm = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError("");
    setOtp("");
    setOtpSent(false);
    setSandboxOtpHint(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          email: email.trim(),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid email or password.");
        return;
      }
      setAuthenticatedUser(data.user);
      finishAuth();
      showToast(`Welcome back, ${data.user?.fullName || data.user?.name || "Customer"}!`);
    } catch {
      setError("Network error while signing in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!fullName.trim() || !email.trim() || !password) {
      setError("Full name, email address, and password are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed.");
        return;
      }
      setAuthenticatedUser(data.user);
      finishAuth();
      showToast(`Account created! Welcome, ${data.user?.fullName || data.user?.name || "Customer"}`);
    } catch {
      setError("Network error during registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_otp", phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send OTP.");
        return;
      }
      setOtpSent(true);
      setSandboxOtpHint(data.sandboxCode || null);
      showToast("Verification code sent to your mobile number.");
    } catch {
      setError("Could not send OTP right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_otp",
          phone,
          otp: otp.trim(),
          fullName: fullName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid OTP code.");
        return;
      }
      setAuthenticatedUser(data.user);
      finishAuth();
      showToast(`Signed in as ${data.user?.fullName || data.user?.name || "Customer"}`);
    } catch {
      setError("Failed to verify OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setLoading(true);
    try {
      const checkRes = await fetch("/api/auth/google?check=1", { cache: "no-store" });
      const checkData = await checkRes.json().catch(() => ({ configured: false }));
      if (!checkData?.configured) {
        setError(
          "Direct Google Sign-In (using Rango Electronics domain instead of Supabase) needs GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET in .env.local or Admin Settings. Please use Email & Password or Mobile OTP for now."
        );
        setLoading(false);
        return;
      }
      window.location.href = "/api/auth/google";
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Google authentication could not start."
      );
      setLoading(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl w-full ${
        variant === "page"
          ? "max-w-lg mx-auto shadow-md border border-slate-200"
          : "max-w-md shadow-2xl border border-slate-100"
      } overflow-hidden relative`}
    >
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0084C7] to-[#006699] px-6 py-5 text-white relative">
        {variant === "modal" && (
          <button
            type="button"
            onClick={() => finishAuth()}
            aria-label="Close modal"
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="size-5" />
          </button>
        )}
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-100 mb-1">
          <ShieldCheck className="w-4 h-4 text-[#FF7A00]" />
          <span>Customer Portal</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight">Welcome to Rango Electronics</h2>
        <p className="text-xs text-sky-100 mt-1">
          {mode === "signin"
            ? "Sign in with your account to track orders and manage saved items."
            : mode === "register"
            ? "Create your customer account for faster checkout & order tracking."
            : "Quick verification via Bangladeshi mobile OTP."}
        </p>
      </div>

      {/* Mode Switch Tabs */}
      <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50 text-xs font-semibold">
        <button
          type="button"
          onClick={() => resetForm("signin")}
          className={`py-3 transition-colors border-b-2 ${
            mode === "signin"
              ? "border-[#0084C7] text-[#0084C7] bg-white"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => resetForm("register")}
          className={`py-3 transition-colors border-b-2 ${
            mode === "register"
              ? "border-[#0084C7] text-[#0084C7] bg-white"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Register
        </button>
        <button
          type="button"
          onClick={() => resetForm("otp")}
          className={`py-3 transition-colors border-b-2 ${
            mode === "otp"
              ? "border-[#0084C7] text-[#0084C7] bg-white"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Mobile OTP
        </button>
      </div>

      <div className="p-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        {/* Email Sign In */}
        {mode === "signin" && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-[#0084C7] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-xl focus:border-[#0084C7] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0084C7] hover:bg-[#006DA6] text-white font-semibold py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              <span>Sign In</span>
            </button>
          </form>
        )}

        {/* Email Registration */}
        {mode === "register" && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-[#0084C7] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-[#0084C7] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-[#0084C7] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password (min 6 characters) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-xl focus:border-[#0084C7] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF7A00] hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              <span>Create Account</span>
            </button>
          </form>
        )}

        {/* Mobile OTP */}
        {mode === "otp" && (
          !otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name (Optional for new customer)
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-[#0084C7] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bangladeshi Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-[#0084C7] outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0084C7] hover:bg-[#006DA6] text-white font-semibold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                <span>Send Verification OTP</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-3.5">
              <div className="bg-emerald-50 text-emerald-800 px-3 py-2 rounded-xl text-xs flex items-center gap-2 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  OTP sent to <strong>{phone}</strong>
                  {sandboxOtpHint ? ` (Code: ${sandboxOtpHint})` : ""}
                </span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enter 6-digit OTP
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="6-digit code"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-[#0084C7] outline-none text-center text-lg tracking-widest"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                <span>Verify &amp; Sign In</span>
              </button>
            </form>
          )
        )}

        {/* Divider & Google OAuth */}
        <div className="relative flex py-1 items-center">
          <div className="grow border-t border-slate-200" />
          <span className="shrink mx-3 text-[11px] uppercase tracking-wider text-slate-400 font-medium">
            OR
          </span>
          <div className="grow border-t border-slate-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 border border-slate-300 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors disabled:opacity-60"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-8.97z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.09C3.11 20.53 7.21 23 12 23z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>
      </div>
    </div>
  );
}
