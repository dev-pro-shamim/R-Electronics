"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Completing Google Sign-In...");

  useEffect(() => {
    let active = true;
    async function completeOAuth() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const errDesc = urlParams.get("error_description") || urlParams.get("error");
        if (errDesc) {
          throw new Error(decodeURIComponent(errDesc));
        }

        const code = urlParams.get("code");
        if (code) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) throw exErr;
        }

        const { data } = await supabase.auth.getSession();
        let accessToken = data.session?.access_token;

        if (!accessToken && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
          accessToken = hashParams.get("access_token") || undefined;
        }

        if (!accessToken) {
          throw new Error("Could not retrieve a verified Google session token.");
        }

        const res = await fetch("/api/auth/customer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "sync_oauth", accessToken }),
        });
        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload.error || "Failed to finalize customer account.");
        }

        if (payload.user) {
          localStorage.setItem("rango_user", JSON.stringify(payload.user));
        }

        if (!active) return;
        setStatus("success");
        setMessage("Signed in successfully! Redirecting to your account...");
        setTimeout(() => {
          window.location.href = "/account";
        }, 700);
      } catch (err) {
        if (!active) return;
        setStatus("error");
        setMessage(
          err instanceof Error
            ? err.message
            : "Google Sign-In failed. Please try email or mobile OTP login."
        );
      }
    }

    completeOAuth();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="min-h-[65vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-lg p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 text-[#0084C7] animate-spin mx-auto mb-4" />
            <h1 className="text-lg font-bold text-slate-900">Signing you in...</h1>
            <p className="text-sm text-slate-500 mt-1">{message}</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="w-11 h-11 text-emerald-600 mx-auto mb-4" />
            <h1 className="text-lg font-bold text-slate-900">Welcome to Rango Electronics!</h1>
            <p className="text-sm text-slate-500 mt-1">{message}</p>
          </>
        )}
        {status === "error" && (
          <>
            <AlertCircle className="w-11 h-11 text-red-500 mx-auto mb-4" />
            <h1 className="text-lg font-bold text-slate-900">Authentication Incomplete</h1>
            <p className="text-sm text-red-600 mt-1.5">{message}</p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/"
                className="px-5 py-2.5 rounded-xl bg-[#0084C7] text-white text-sm font-semibold hover:bg-[#006DA6]"
              >
                Return Home
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
