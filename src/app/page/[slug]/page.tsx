"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronRight,
  ShieldCheck,
  Send,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { POLICIES } from "@/data/policies";
import { formatRichOrPlainToHtml } from "@/lib/plainTextFormatter";
import { useStoreRuntime } from "@/lib/useStoreRuntime";

export default function StaticPolicyPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const runtime = useStoreRuntime();

  const livePolicy = runtime?.policies?.[slug];
  const policy = livePolicy ||
    POLICIES[slug] || {
      slug,
      title: slug.replace(/-/g, " ").toUpperCase(),
      lastUpdated: "November 2026",
      content: `
      <h2>${slug.replace(/-/g, " ").toUpperCase()}</h2>
      <p>Official policy and operational guidelines for Rango Electronics (RangoElectronics.com). For any questions or clarification regarding this section, please reach our customer assistance team at +88 01798-565001 / +88 01554-565001 or via email at electronics.rango@gmail.com.</p>
      <h3>Customer Support</h3>
      <p>Location: H-11 R-11 DIT Project Merul Badda Dhaka, Bangladesh.</p>
    `,
    };

  const isContactPage =
    slug === "contact-us" || slug === "contact" || slug === "customer-support";

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState("");

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Could not submit your inquiry.");
      } else {
        setSubmittedId(data.inquiryId || "SUBMITTED");
        setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      }
    } catch {
      setSubmitError("Network error while sending inquiry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50/50 min-h-screen py-8 md:py-12">
      <div className="container max-w-4xl space-y-6">
        <nav className="flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          <ChevronRight className="size-3.5 text-gray-400" />
          <span className="text-gray-800 font-semibold">{policy.title}</span>
        </nav>

        <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-10 shadow-xs space-y-6 text-left">
          <div className="border-b border-gray-200 pb-4">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {policy.title}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Last Updated: {policy.lastUpdated}
            </p>
          </div>

          <div
            className="prose prose-sm sm:prose-base max-w-none text-gray-700 leading-relaxed space-y-4 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-gray-900 [&_h2]:pt-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-gray-900 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
            dangerouslySetInnerHTML={{ __html: formatRichOrPlainToHtml(policy.content) }}
          />

          {isContactPage && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Send Us a Direct Inquiry
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Your message goes directly to Rango Electronics Customer Support &amp; Admin Desk.
              </p>
              {submittedId ? (
                <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm">
                      Thank you! Inquiry #{submittedId} received.
                    </p>
                    <p className="text-xs mt-1 text-emerald-700">
                      Our support specialist will respond via phone or email shortly.
                    </p>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleInquirySubmit}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200"
                >
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your Full Name *"
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:border-[#0084C7]"
                  />
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Mobile Number *"
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:border-[#0084C7]"
                  />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Email Address"
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:border-[#0084C7]"
                  />
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Subject (e.g. Product Warranty / Bulk Order) *"
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:border-[#0084C7]"
                  />
                  <textarea
                    required
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Write your question or request in detail..."
                    className="sm:col-span-2 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:border-[#0084C7]"
                  />
                  {submitError && (
                    <p className="sm:col-span-2 text-xs text-red-600 font-semibold">
                      {submitError}
                    </p>
                  )}
                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 rounded-xl bg-[#0084C7] hover:bg-[#006DA6] text-white text-sm font-bold inline-flex items-center gap-2 disabled:opacity-50"
                    >
                      <Send className="size-4" />
                      <span>{submitting ? "Sending..." : "Submit Inquiry"}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 bg-gray-50/50 p-4 rounded-xl">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-600" />
              <span>Rango Electronics Official Policy Center</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href={`tel:${(runtime?.settings?.hotlinePrimary || "+8801798565001").replace(/\s+/g, "")}`}
                className="hover:text-primary font-bold inline-flex items-center gap-1"
              >
                <Phone className="size-3.5" />
                <span>{runtime?.settings?.hotlinePrimary || "+88 01798-565001"}</span>
              </a>
              <a
                href={`mailto:${runtime?.settings?.supportEmail || "electronics.rango@gmail.com"}`}
                className="hover:text-primary font-semibold inline-flex items-center gap-1"
              >
                <Mail className="size-3.5" />
                <span>{runtime?.settings?.supportEmail || "electronics.rango@gmail.com"}</span>
              </a>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                <span>{runtime?.settings?.officeAddress || "Merul Badda, Dhaka"}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
