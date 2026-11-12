"use client";

import React, { useMemo, useState } from "react";
import {
  Users,
  Mail,
  Bot,
  BookOpen,
  FileCode2,
  Layout,
  Percent,
  Truck,
  CreditCard,
  Settings,
  UserCog,
  Shield,
  ClipboardList,
  Database,
  Trash2,
  Send,
  Plus,
} from "lucide-react";
import {
  AdminDatabase,
  AdminOrderRecord,
  AdminRoleName,
  AdminTabId,
  ChatbotFaqItem,
  ContactInquiryRecord,
} from "@/types/admin";
import { formatRichOrPlainToHtml, htmlToReadableText } from "@/lib/plainTextFormatter";

interface AdminSupportWebsiteSystemModuleProps {
  activeTab: AdminTabId;
  db: AdminDatabase;
  orders: AdminOrderRecord[];
  userRole: string;
  onPersistPatch: (section: string, permKey: string, desc: string, patch: Partial<AdminDatabase>) => Promise<boolean>;
  onSyncResponse: (nextDbPayload: any, toastText?: string) => void;
}

const ROLE_PERM_GROUPS = [
  { key: "overview", label: "Dashboard Overview" },
  { key: "sales", label: "Orders, Payments, Invoices & Courier" },
  { key: "catalog", label: "Products, Categories, Brands & Reviews" },
  { key: "inventory", label: "Inventory & Stock Alerts" },
  { key: "marketing", label: "Coupons, Banners, Popups, Pixel & GTM" },
  { key: "customers", label: "Customers Directory" },
  { key: "support", label: "Inquiries, Chatbot & FAQs" },
  { key: "finance", label: "Accounts, Ledger & Financial Reports" },
  { key: "website", label: "CMS, Homepage, EMI, Delivery & Pay Settings" },
  { key: "system", label: "Global Settings, Users, Roles & Logs" },
];

export const AdminSupportWebsiteSystemModule: React.FC<
  AdminSupportWebsiteSystemModuleProps
> = ({
  activeTab,
  db,
  orders,
  userRole,
  onPersistPatch,
  onSyncResponse,
}) => {
  // Inquiries state
  const [inqReplies, setInqReplies] = useState<Record<string, string>>({});
  const [inqStatusFilter, setInqStatusFilter] = useState("all");

  // Chatbot state
  const [chatReplies, setChatReplies] = useState<Record<string, string>>({});
  const [newFaq, setNewFaq] = useState({
    keywords: "",
    question: "",
    answer: "",
    productLink: "",
  });

  // CMS state
  const policySlugs = Object.keys(db.policies || {});
  const [activeCmsSlug, setActiveCmsSlug] = useState(policySlugs[0] || "about-us");
  const [newPageTitle, setNewPageTitle] = useState("");
  const currentCms = db.policies?.[activeCmsSlug];
  const [cmsDraft, setCmsDraft] = useState(
    currentCms
      ? { ...currentCms, content: htmlToReadableText(currentCms.content || "") }
      : null
  );
  const [cmsPreviewMode, setCmsPreviewMode] = useState(false);

  // Sync CMS draft when slug changes
  const selectCmsSlug = (slug: string) => {
    setActiveCmsSlug(slug);
    const pg = db.policies?.[slug];
    setCmsDraft(
      pg ? { ...pg, content: htmlToReadableText(pg.content || "") } : null
    );
  };

  // Global Settings state
  const [settingsDraft, setSettingsDraft] = useState(db.settings);
  const [emailSecretDraft, setEmailSecretDraft] = useState({ smtpPassword: "", resendApiKey: "" });
  const [googleOAuthDraft, setGoogleOAuthDraft] = useState({
    googleClientId: "",
    googleClientSecret: "",
  });
  const [googleSaveMsg, setGoogleSaveMsg] = useState<string | null>(null);
  const [testEmailTarget, setTestEmailTarget] = useState(
    db.settings?.smtpSettings?.adminNotificationEmail || "electronics.rango@gmail.com"
  );
  const [emailSaveMsg, setEmailSaveMsg] = useState<string | null>(null);
  const [emailBusy, setEmailBusy] = useState(false);

  // Admin Users & Password change
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Order Manager" as AdminRoleName,
  });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [userMsg, setUserMsg] = useState("");

  // Log search & Customers/Roles states
  const [logSearch, setLogSearch] = useState("");
  const [custSearch, setCustSearch] = useState("");
  const [selectedCustKeys, setSelectedCustKeys] = useState<string[]>([]);
  const [bulkCustStatus, setBulkCustStatus] = useState<"active" | "vip" | "blocked">("vip");
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    permissions: ["overview", "orders"] as string[],
  });
  const [roleMsg, setRoleMsg] = useState("");

  // Derived Customer Directory (Checkout Orders + Registered Accounts)
  const customers = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        name: string;
        phone: string;
        email: string;
        city: string;
        source: string;
        ordersCount: number;
        totalSpend: number;
        lastDate: string;
      }
    >();

    for (const cu of db.customerUsers || []) {
      const phone = (cu.phone || "").trim();
      const email = (cu.email || "").trim();
      const key = phone || email || cu.id;
      map.set(key, {
        key,
        name: cu.fullName || cu.name || "Registered Customer",
        phone: phone || "N/A",
        email,
        city: cu.addresses?.[0]?.city || "Dhaka",
        source: "Registered",
        ordersCount: 0,
        totalSpend: 0,
        lastDate: new Date(cu.createdAt || Date.now()).toLocaleDateString("en-GB"),
      });
    }

    for (const o of orders) {
      const phone = (o.shippingAddress?.phone || o.shippingAddress?.phoneNumber || "N/A").trim();
      const email = (o.shippingAddress?.email || "").trim();
      const existingByPhone = phone !== "N/A" ? map.get(phone) : undefined;
      const existingByEmail = email
        ? Array.from(map.values()).find((c) => c.email.toLowerCase() === email.toLowerCase())
        : undefined;
      const matched = existingByPhone || existingByEmail;
      const key = matched?.key || (phone !== "N/A" ? phone : o.shippingAddress?.fullName || o.id);
      const prev = map.get(key) || {
        key,
        name: o.shippingAddress?.fullName || "Customer",
        phone,
        email,
        city: o.shippingAddress?.city || "Dhaka",
        source: "Checkout",
        ordersCount: 0,
        totalSpend: 0,
        lastDate: o.date,
      };
      map.set(key, {
        ...prev,
        source: prev.source === "Registered" ? "Registered + Checkout" : "Checkout",
        ordersCount: prev.ordersCount + 1,
        totalSpend: prev.totalSpend + Number(o.total || 0),
      });
    }

    const q = custSearch.trim().toLowerCase();
    return Array.from(map.values())
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q)
      )
      .sort((a, b) => b.totalSpend - a.totalSpend);
  }, [orders, db.customerUsers, custSearch]);

  if (activeTab === "customers") {
    const allCustSelected =
      customers.length > 0 && customers.every((c) => selectedCustKeys.includes(c.key));

    const exportCustomersCsv = () => {
      const headers = ["Name", "Phone", "Email", "City", "Type", "Orders", "TotalSpend", "Tier"];
      const rows = customers.map((c) => {
        const ov = db.customerOverrides?.[c.key];
        return [
          `"${(ov?.notes ? `${c.name}` : c.name).replace(/"/g, '""')}"`,
          `"${c.phone}"`,
          `"${c.email}"`,
          `"${c.city}"`,
          `"${c.source}"`,
          c.ordersCount,
          c.totalSpend,
          ov?.status || "active",
        ].join(",");
      });
      const blob = new Blob([[headers.join(","), ...rows].join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rango-customers-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    };

    const exportCustomersExcel = () => {
      const rowsHtml = customers
        .map((c) => {
          const tier = db.customerOverrides?.[c.key]?.status || "active";
          return `<tr><td>${c.name}</td><td>${c.phone}</td><td>${c.email}</td><td>${c.city}</td><td>${c.source}</td><td>${c.ordersCount}</td><td>${c.totalSpend}</td><td>${tier}</td></tr>`;
        })
        .join("");
      const xls = `<table><thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>City</th><th>Type</th><th>Orders</th><th>Total Spend</th><th>Tier</th></tr></thead><tbody>${rowsHtml}</tbody></table>`;
      const blob = new Blob([xls], { type: "application/vnd.ms-excel" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rango-customers-${new Date().toISOString().slice(0, 10)}.xls`;
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="size-5 text-[#0084C7]" />
            <span>Registered &amp; Checkout Customers ({customers.length})</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <input
              type="text"
              value={custSearch}
              onChange={(e) => setCustSearch(e.target.value)}
              placeholder="Search name, phone, email, city..."
              className="h-9 px-3 rounded-xl border border-slate-300 w-56"
            />
            <button
              type="button"
              onClick={exportCustomersCsv}
              className="h-9 px-3.5 rounded-xl bg-slate-900 text-white font-bold cursor-pointer hover:opacity-90"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={exportCustomersExcel}
              className="h-9 px-3.5 rounded-xl bg-emerald-600 text-white font-bold cursor-pointer hover:bg-emerald-700"
            >
              Export Excel (.xls)
            </button>
          </div>
        </div>

        {selectedCustKeys.length > 0 && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#0084C7] to-[#006DA6] text-white flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-extrabold">{selectedCustKeys.length} Customer(s) Selected</span>
            <div className="flex items-center gap-2">
              <select
                value={bulkCustStatus}
                onChange={(e) => setBulkCustStatus(e.target.value as "active" | "vip" | "blocked")}
                className="h-8 px-2.5 rounded-lg bg-white text-slate-900 font-bold"
              >
                <option value="active">Set Tier: Active</option>
                <option value="vip">Set Tier: VIP Member</option>
                <option value="blocked">Set Tier: Blocked</option>
              </select>
              <button
                type="button"
                onClick={async () => {
                  const nextOverrides = { ...(db.customerOverrides || {}) };
                  for (const key of selectedCustKeys) {
                    nextOverrides[key] = { ...(nextOverrides[key] || {}), key, status: bulkCustStatus };
                  }
                  await onPersistPatch(
                    "Customers",
                    "customers",
                    `Bulk updated ${selectedCustKeys.length} customers -> ${bulkCustStatus}`,
                    { customerOverrides: nextOverrides }
                  );
                }}
                className="h-8 px-3.5 rounded-lg bg-[#FF7A00] text-white font-extrabold cursor-pointer"
              >
                Apply Bulk Edit
              </button>
              <button
                type="button"
                onClick={() => setSelectedCustKeys([])}
                className="h-8 px-3 rounded-lg bg-white/20 text-white font-bold cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
                <th className="p-3 w-9">
                  <input
                    type="checkbox"
                    checked={allCustSelected}
                    onChange={(e) =>
                      setSelectedCustKeys(
                        e.target.checked ? customers.map((c) => c.key) : []
                      )
                    }
                    className="size-4 accent-[#0084C7] cursor-pointer"
                  />
                </th>
                <th className="p-3">Customer</th>
                <th className="p-3">Phone &amp; Email</th>
                <th className="p-3">Type / City</th>
                <th className="p-3">Orders</th>
                <th className="p-3">Total Spend</th>
                <th className="p-3">Account Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => {
                const status = db.customerOverrides?.[c.key]?.status || "active";
                const checked = selectedCustKeys.includes(c.key);
                return (
                  <tr key={c.key} className={checked ? "bg-sky-50/70" : "hover:bg-slate-50"}>
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setSelectedCustKeys((prev) =>
                            e.target.checked
                              ? [...prev, c.key]
                              : prev.filter((k) => k !== c.key)
                          )
                        }
                        className="size-4 accent-[#0084C7] cursor-pointer"
                      />
                    </td>
                    <td className="p-3 font-bold text-slate-900">{c.name}</td>
                    <td className="p-3">
                      <div>{c.phone}</div>
                      <div className="text-[11px] text-slate-500">{c.email || "-"}</div>
                    </td>
                    <td className="p-3 text-slate-600">
                      <div className="font-semibold">{c.city}</div>
                      <div className="text-[10px] text-[#0084C7]">{c.source}</div>
                    </td>
                    <td className="p-3 font-bold">{c.ordersCount}</td>
                    <td className="p-3 font-extrabold text-[#0084C7]">৳{c.totalSpend.toLocaleString()}</td>
                    <td className="p-3">
                      <select
                        value={status}
                        onChange={(e) =>
                          onPersistPatch("Customers", "customers", `Updated ${c.name} status`, {
                            customerOverrides: {
                              ...(db.customerOverrides || {}),
                              [c.key]: { key: c.key, status: e.target.value as any },
                            },
                          })
                        }
                        className="h-8 px-2 rounded-lg border border-slate-300 bg-white font-bold text-xs"
                      >
                        <option value="active">Active</option>
                        <option value="vip">VIP Member</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (activeTab === "inquiries") {
    const list = (db.contactInquiries || []).filter(
      (i) => inqStatusFilter === "all" || i.status === inqStatusFilter
    );
    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Mail className="size-5 text-[#0084C7]" />
            <h2 className="text-base font-extrabold text-slate-900">
              Customer Messages &amp; Contact Inquiries ({list.length})
            </h2>
          </div>
          <select
            value={inqStatusFilter}
            onChange={(e) => setInqStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-300 text-xs bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Replied">Replied</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <div className="space-y-4">
          {list.map((inq) => (
            <div key={inq.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="font-mono font-bold text-[#0084C7] mr-2">{inq.id}</span>
                  <span className="font-extrabold text-slate-900 text-sm">{inq.subject}</span>
                  <p className="text-slate-500 mt-0.5">
                    From: <strong>{inq.name}</strong> ({inq.phone || "No phone"} · {inq.email})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={inq.status}
                    onChange={async (e) => {
                      const res = await fetch("/api/inquiries", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          id: inq.id,
                          status: e.target.value as ContactInquiryRecord["status"],
                        }),
                      });
                      if (res.ok) onSyncResponse(await res.json(), "Updated inquiry status");
                    }}
                    className="h-8 px-2 rounded-lg border border-slate-300 bg-white font-bold"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Replied">Replied</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await fetch(`/api/inquiries?id=${encodeURIComponent(inq.id)}`, {
                        method: "DELETE",
                      });
                      if (res.ok) onSyncResponse(await res.json(), "Deleted inquiry");
                    }}
                    className="p-1.5 text-rose-500"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              <p className="p-3 rounded-xl bg-slate-50 text-slate-700">{inq.message}</p>
              {(inq.replies || []).map((r, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-[#E0F2FE]/60 text-slate-800">
                  <strong>{r.sender}:</strong> {r.text}
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write official reply to customer..."
                  value={inqReplies[inq.id] || ""}
                  onChange={(e) => setInqReplies({ ...inqReplies, [inq.id]: e.target.value })}
                  className="flex-1 h-9 px-3 rounded-xl border border-slate-300"
                />
                <button
                  type="button"
                  onClick={async () => {
                    const txt = inqReplies[inq.id];
                    if (!txt?.trim()) return;
                    const res = await fetch("/api/inquiries", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: inq.id, replyText: txt, status: "Replied" }),
                    });
                    if (res.ok) {
                      onSyncResponse(await res.json(), "Sent inquiry reply");
                      setInqReplies({ ...inqReplies, [inq.id]: "" });
                    }
                  }}
                  className="px-4 rounded-xl bg-[#0084C7] text-white font-bold inline-flex items-center gap-1"
                >
                  <Send className="size-3.5" />
                  <span>Reply</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === "chatbot" || activeTab === "faqs") {
    return (
      <div className="space-y-6">
        {activeTab === "faqs" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen className="size-5 text-[#0084C7]" />
              <span>Rango Assistant Predefined Knowledge &amp; Auto-Responses</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <input
                type="text"
                placeholder="Keywords (comma separated: emi, card)"
                value={newFaq.keywords}
                onChange={(e) => setNewFaq({ ...newFaq, keywords: e.target.value })}
                className="h-10 px-3 rounded-xl border border-slate-300"
              />
              <input
                type="text"
                placeholder="Question Prompt"
                value={newFaq.question}
                onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                className="h-10 px-3 rounded-xl border border-slate-300"
              />
              <input
                type="text"
                placeholder="Product / Offer Link (optional)"
                value={newFaq.productLink}
                onChange={(e) => setNewFaq({ ...newFaq, productLink: e.target.value })}
                className="h-10 px-3 rounded-xl border border-slate-300"
              />
              <button
                type="button"
                onClick={async () => {
                  if (!newFaq.keywords.trim() || !newFaq.answer.trim()) return;
                  const item: ChatbotFaqItem = {
                    id: `faq-${Date.now()}`,
                    keywords: newFaq.keywords,
                    question: newFaq.question || newFaq.keywords,
                    answer: newFaq.answer,
                    productLink: newFaq.productLink || undefined,
                    active: true,
                  };
                  const res = await fetch("/api/chatbot", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      mode: "faqs",
                      chatbotFaqs: [item, ...(db.chatbotFaqs || [])],
                    }),
                  });
                  if (res.ok) {
                    onSyncResponse(await res.json(), "Added chatbot FAQ rule");
                    setNewFaq({ keywords: "", question: "", answer: "", productLink: "" });
                  }
                }}
                className="h-10 rounded-xl bg-[#0084C7] text-white font-extrabold"
              >
                + Save FAQ Rule
              </button>
              <textarea
                rows={2}
                placeholder="Bot Auto-Response Answer *"
                value={newFaq.answer}
                onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                className="sm:col-span-2 lg:col-span-4 p-3 rounded-xl border border-slate-300"
              />
            </div>

            <div className="space-y-2.5">
              {(db.chatbotFaqs || []).map((f) => (
                <div key={f.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-[#0084C7]">Keywords: {f.keywords}</p>
                    <p className="font-bold text-slate-900 mt-0.5">{f.question}</p>
                    <p className="text-slate-600 mt-0.5">{f.answer}</p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await fetch("/api/chatbot", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          mode: "faqs",
                          chatbotFaqs: db.chatbotFaqs.filter((x) => x.id !== f.id),
                        }),
                      });
                      if (res.ok) onSyncResponse(await res.json(), "Removed FAQ rule");
                    }}
                    className="p-1.5 text-rose-500"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Bot className="size-5 text-[#0084C7]" />
            <span>Customer Chatbot Conversations ({(db.chatConversations || []).length})</span>
          </h2>
          {(db.chatConversations || []).map((c) => (
            <div key={c.id} className="p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div>
                  <strong className="text-slate-900">{c.customerName}</strong>{" "}
                  <span className="text-slate-500">({c.customerPhone || c.customerEmail || "Visitor"})</span>
                </div>
                <select
                  value={c.status}
                  onChange={async (e) => {
                    const res = await fetch("/api/chatbot", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ conversationId: c.id, status: e.target.value }),
                    });
                    if (res.ok) onSyncResponse(await res.json(), "Updated chat status");
                  }}
                  className="h-8 px-2 rounded-lg border border-slate-300 bg-white font-bold"
                >
                  <option value="Open">Open</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto bg-slate-50 p-3 rounded-xl">
                {(c.messages || []).map((m) => (
                  <p key={m.id}>
                    <strong className={m.sender === "customer" ? "text-slate-900" : "text-[#0084C7]"}>
                      {m.sender.toUpperCase()}:
                    </strong>{" "}
                    {m.text}
                  </p>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type live agent message..."
                  value={chatReplies[c.id] || ""}
                  onChange={(e) => setChatReplies({ ...chatReplies, [c.id]: e.target.value })}
                  className="flex-1 h-9 px-3 rounded-xl border border-slate-300"
                />
                <button
                  type="button"
                  onClick={async () => {
                    const txt = chatReplies[c.id];
                    if (!txt?.trim()) return;
                    const res = await fetch("/api/chatbot", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ conversationId: c.id, replyText: txt }),
                    });
                    if (res.ok) {
                      onSyncResponse(await res.json(), "Sent agent chat reply");
                      setChatReplies({ ...chatReplies, [c.id]: "" });
                    }
                  }}
                  className="px-4 rounded-xl bg-[#0084C7] text-white font-bold"
                >
                  Reply
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === "cms" || activeTab === "homepage") {
    if (activeTab === "homepage") {
      return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Layout className="size-5 text-[#0084C7]" />
            <span>Homepage Layout Sections Control</span>
          </h2>
          <div className="space-y-2.5 text-xs">
            {(settingsDraft.homepageSections || []).map((sec, idx) => (
              <div key={sec.id} className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-800">{idx + 1}. {sec.label}</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextSecs = settingsDraft.homepageSections.map((s) =>
                      s.id === sec.id ? { ...s, enabled: !s.enabled } : s
                    );
                    const nextSettings = { ...settingsDraft, homepageSections: nextSecs };
                    setSettingsDraft(nextSettings);
                    onPersistPatch("Homepage Sections", "homepage", `Toggled ${sec.label}`, {
                      settings: nextSettings,
                    });
                  }}
                  className={`px-3 py-1 rounded-full font-bold cursor-pointer ${
                    sec.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {sec.enabled ? "Visible" : "Hidden"}
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    const activePage = cmsDraft || currentCms;
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <FileCode2 className="size-4 text-[#0084C7]" />
            <span>Website Pages (/page/[slug])</span>
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New Page Title..."
              value={newPageTitle}
              onChange={(e) => setNewPageTitle(e.target.value)}
              className="flex-1 h-9 px-3 rounded-xl border border-slate-300"
            />
            <button
              type="button"
              onClick={() => {
                if (!newPageTitle.trim()) return;
                const slug = newPageTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                const newPg = {
                  slug,
                  title: newPageTitle.trim(),
                  lastUpdated: new Date().toLocaleDateString(),
                  content: `## ${newPageTitle.trim()}\n\nPaste or write your page content directly here — no HTML tags required.`,
                  published: true,
                };
                onPersistPatch("Website CMS", "cms", `Created page /page/${slug}`, {
                  policies: { ...(db.policies || {}), [slug]: newPg },
                });
                selectCmsSlug(slug);
                setNewPageTitle("");
              }}
              className="px-3 rounded-xl bg-[#0084C7] text-white font-bold"
            >
              + Page
            </button>
          </div>
          <div className="space-y-1.5">
            {policySlugs.map((slug) => (
              <button
                key={slug}
                type="button"
                onClick={() => selectCmsSlug(slug)}
                className={`w-full px-3 py-2 rounded-xl text-left font-bold cursor-pointer ${
                  activeCmsSlug === slug
                    ? "bg-[#0084C7] text-white"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {db.policies[slug].title} (/page/{slug})
              </button>
            ))}
          </div>
        </div>

        {activePage && (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">
                Editing: {activePage.title}
              </h3>
              <label className="flex items-center gap-2 font-bold">
                <input
                  type="checkbox"
                  checked={activePage.published !== false}
                  onChange={(e) => setCmsDraft({ ...activePage, published: e.target.checked })}
                />
                <span>Published</span>
              </label>
            </div>
            <input
              type="text"
              value={activePage.title}
              onChange={(e) => setCmsDraft({ ...activePage, title: e.target.value })}
              placeholder="Page Title"
              className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold"
            />
            <input
              type="text"
              value={activePage.seoTitle || ""}
              onChange={(e) => setCmsDraft({ ...activePage, seoTitle: e.target.value })}
              placeholder="SEO Meta Title"
              className="w-full h-10 px-3 rounded-xl border border-slate-300"
            />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setCmsDraft({
                        ...activePage,
                        content: `${activePage.content ? activePage.content + "\n\n" : ""}## Section Heading\n`,
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-[11px] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    + Heading
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCmsDraft({
                        ...activePage,
                        content: `${activePage.content ? activePage.content + "\n" : ""}• Bullet point item`,
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-[11px] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    + Bullet Item
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCmsDraft({
                        ...activePage,
                        content: htmlToReadableText(activePage.content || ""),
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-[11px] font-bold text-[#0084C7] hover:bg-sky-50 cursor-pointer"
                  >
                    Clean HTML Tags
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setCmsPreviewMode((v) => !v)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                    cmsPreviewMode
                      ? "bg-[#0084C7] text-white"
                      : "bg-white border border-slate-300 text-slate-700"
                  }`}
                >
                  {cmsPreviewMode ? "Back to Editor" : "Live Preview"}
                </button>
              </div>
              {cmsPreviewMode ? (
                <div
                  className="w-full min-h-[240px] p-4 rounded-xl border border-slate-200 bg-slate-50/70 prose prose-sm max-w-none text-slate-700 [&_h2]:text-lg [&_h2]:font-extrabold [&_h2]:text-slate-900 [&_h3]:text-base [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{
                    __html: formatRichOrPlainToHtml(activePage.content),
                  }}
                />
              ) : (
                <textarea
                  rows={12}
                  value={activePage.content}
                  onChange={(e) => setCmsDraft({ ...activePage, content: e.target.value })}
                  placeholder="Just paste your text directly from Word, ChatGPT, or Notes — no HTML tags needed! Use blank lines for paragraphs and • or - for bullet points."
                  className="w-full p-3.5 rounded-xl border border-slate-300 text-sm leading-relaxed text-slate-800 focus:border-[#0084C7] outline-none"
                />
              )}
              <p className="text-[11px] text-slate-500">
                Copy &amp; paste plain text directly (headings, paragraphs, bullet points). No HTML tags required.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onPersistPatch("Website CMS", "cms", `Updated CMS page /page/${activePage.slug}`, {
                  policies: {
                    ...(db.policies || {}),
                    [activePage.slug]: {
                      ...activePage,
                      lastUpdated: new Date().toLocaleDateString("en-GB", {
                        month: "long",
                        year: "numeric",
                      }),
                    },
                  },
                })
              }
              className="px-6 py-2.5 rounded-xl bg-[#0084C7] text-white font-extrabold cursor-pointer"
            >
              Publish Page Updates
            </button>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === "emi") {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Percent className="size-5 text-[#0084C7]" />
            <span>0% EMI Partner Banks &amp; Rules ({(db.emiBanks || []).length})</span>
          </h2>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-600">Min EMI Order (৳):</span>
            <input
              type="number"
              value={settingsDraft.emiMinAmount}
              onChange={(e) =>
                setSettingsDraft({ ...settingsDraft, emiMinAmount: Number(e.target.value) })
              }
              className="h-9 w-28 px-3 rounded-xl border border-slate-300"
            />
            <button
              type="button"
              onClick={() =>
                onPersistPatch("EMI Settings", "emi", "Updated Min EMI Amount", {
                  settings: settingsDraft,
                })
              }
              className="px-3 py-2 rounded-xl bg-[#0084C7] text-white font-bold"
            >
              Save
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {(db.emiBanks || []).map((b) => (
            <div key={b.id} className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-extrabold text-slate-900">{b.name}</p>
                <p className="text-[11px] text-slate-500">
                  Tenures: {b.tenures.join(", ")} months · Fee: {b.processingFeePercent}%
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onPersistPatch("EMI Settings", "emi", `Toggled EMI bank ${b.shortName}`, {
                    emiBanks: db.emiBanks.map((x) =>
                      x.id === b.id ? { ...x, enabled: !x.enabled } : x
                    ),
                  })
                }
                className={`px-3 py-1 rounded-full font-bold ${
                  b.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                }`}
              >
                {b.enabled ? "Active" : "Off"}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === "delivery" || activeTab === "pay-settings") {
    return (
      <div className="space-y-6">
        {activeTab === "delivery" ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Truck className="size-5 text-[#0084C7]" />
              <span>Delivery Charges &amp; Free Shipping Threshold</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Inside Dhaka Charge (৳)</label>
                <input
                  type="number"
                  value={settingsDraft.insideDhakaShipping}
                  onChange={(e) =>
                    setSettingsDraft({
                      ...settingsDraft,
                      insideDhakaShipping: Number(e.target.value),
                    })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Outside Dhaka Charge (৳)</label>
                <input
                  type="number"
                  value={settingsDraft.outsideDhakaShipping}
                  onChange={(e) =>
                    setSettingsDraft({
                      ...settingsDraft,
                      outsideDhakaShipping: Number(e.target.value),
                    })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Free Delivery Threshold (৳)</label>
                <input
                  type="number"
                  value={settingsDraft.freeDeliveryThreshold}
                  onChange={(e) =>
                    setSettingsDraft({
                      ...settingsDraft,
                      freeDeliveryThreshold: Number(e.target.value),
                    })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-300"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onPersistPatch("Delivery Settings", "delivery", "Updated delivery fee settings", {
                  settings: settingsDraft,
                })
              }
              className="px-5 py-2.5 rounded-xl bg-[#0084C7] text-white font-extrabold"
            >
              Save Delivery Rules
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <CreditCard className="size-5 text-[#0084C7]" />
              <span>Storefront Payment Channels</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {(db.paymentChannels || []).map((ch) => (
                <div key={ch.id} className="p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-sm text-slate-900">{ch.name}</strong>
                    <button
                      type="button"
                      onClick={() =>
                        onPersistPatch("Payment Settings", "pay-settings", `Toggled ${ch.name}`, {
                          paymentChannels: db.paymentChannels.map((x) =>
                            x.id === ch.id ? { ...x, enabled: !x.enabled } : x
                          ),
                        })
                      }
                      className={`px-3 py-1 rounded-full font-bold ${
                        ch.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {ch.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                  <p className="text-slate-500">Account: {ch.accountNumber || "Gateway Managed"}</p>
                  <p className="text-slate-600">{ch.instructions}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === "users") {
    return (
      <div className="space-y-6">
        {userRole === "Super Admin" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <UserCog className="size-5 text-[#0084C7]" />
              <span>Create / Update Role-Based Admin User</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <input
                type="text"
                placeholder="Full Name *"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                className="h-10 px-3 rounded-xl border border-slate-300"
              />
              <input
                type="email"
                placeholder="Email *"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                className="h-10 px-3 rounded-xl border border-slate-300"
              />
              <input
                type="password"
                placeholder="Password (min 6 chars) *"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                className="h-10 px-3 rounded-xl border border-slate-300"
              />
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value as AdminRoleName })}
                className="h-10 px-3 rounded-xl border border-slate-300 bg-white"
              >
                {(db.roles || []).map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={async () => {
                  const res = await fetch("/api/admin/auth", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "upsert_user", ...userForm, active: true }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    setUserMsg(data.error || "Failed to save user.");
                  } else {
                    setUserMsg(`Saved admin user ${userForm.email}`);
                    onSyncResponse({ ...db, adminUsers: data.adminUsers }, "Saved admin user");
                    setUserForm({ name: "", email: "", password: "", role: "Order Manager" });
                  }
                }}
                className="h-10 rounded-xl bg-[#0084C7] text-white font-extrabold inline-flex items-center justify-center gap-1"
              >
                <Plus className="size-4" />
                <span>Save User</span>
              </button>
            </div>
            {userMsg && <p className="text-xs font-bold text-[#0084C7]">{userMsg}</p>}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
                <th className="p-3">Admin Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Assigned Role</th>
                <th className="p-3">Last Login</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(db.adminUsers || []).map((u) => (
                <tr key={u.id}>
                  <td className="p-3 font-bold text-slate-900">{u.name}</td>
                  <td className="p-3 text-slate-600">{u.email}</td>
                  <td className="p-3">
                    <span className="px-2.5 py-1 rounded-full bg-[#E0F2FE] text-[#0084C7] font-bold">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}
                  </td>
                  <td className="p-3 text-right">
                    {userRole === "Super Admin" && (
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await fetch("/api/admin/auth", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ action: "delete_user", id: u.id }),
                          });
                          const data = await res.json();
                          if (res.ok) {
                            onSyncResponse({ ...db, adminUsers: data.adminUsers }, "Removed admin user");
                          }
                        }}
                        className="p-1.5 text-rose-500"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (activeTab === "roles") {
    return (
      <div className="space-y-6">
        {/* Create New Access Role */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Plus className="size-5 text-[#0084C7]" />
            <span>Create Custom User Access Role</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <input
              type="text"
              placeholder="Role Name * (e.g. Warehouse Manager)"
              value={roleForm.name}
              onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
              className="h-10 px-3 rounded-xl border border-slate-300 font-semibold"
            />
            <input
              type="text"
              placeholder="Role Description"
              value={roleForm.description}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              className="h-10 px-3 rounded-xl border border-slate-300"
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-600">Assign Module Permissions:</p>
            <div className="flex flex-wrap gap-2 text-xs">
              {ROLE_PERM_GROUPS.map((grp) => {
                const selected = roleForm.permissions.includes(grp.key);
                return (
                  <button
                    key={grp.key}
                    type="button"
                    onClick={() =>
                      setRoleForm((prev) => ({
                        ...prev,
                        permissions: selected
                          ? prev.permissions.filter((p) => p !== grp.key)
                          : [...prev.permissions, grp.key],
                      }))
                    }
                    className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer ${
                      selected ? "bg-[#0084C7] text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {grp.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                const name = roleForm.name.trim();
                if (!name) {
                  setRoleMsg("Please enter a role name.");
                  return;
                }
                if ((db.roles || []).some((r) => r.name.toLowerCase() === name.toLowerCase())) {
                  setRoleMsg(`Role "${name}" already exists.`);
                  return;
                }
                const newRole = {
                  id: `role-custom-${Date.now()}`,
                  name,
                  description: roleForm.description.trim() || `Custom role (${roleForm.permissions.join(", ")})`,
                  permissions: roleForm.permissions.length ? roleForm.permissions : ["overview"],
                };
                const ok = await onPersistPatch(
                  "Roles Matrix",
                  "roles",
                  `Created custom role "${name}"`,
                  { roles: [...(db.roles || []), newRole] }
                );
                if (ok) {
                  setRoleMsg(`Created role "${name}"! Now available in Admin Users dropdown.`);
                  setRoleForm({ name: "", description: "", permissions: ["overview", "orders"] });
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0084C7] to-[#006DA6] text-white text-xs font-extrabold cursor-pointer shadow"
            >
              + Create Access Role
            </button>
            {roleMsg && <span className="text-xs font-bold text-[#0084C7]">{roleMsg}</span>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Shield className="size-5 text-[#0084C7]" />
            <span>Role-Based Access Control ({(db.roles || []).length} Roles)</span>
          </h2>
          <div className="space-y-4">
            {(db.roles || []).map((role) => (
              <div key={role.id} className="p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <strong className="text-sm text-slate-900">{role.name}</strong>
                    <p className="text-slate-500">{role.description}</p>
                  </div>
                  {role.name !== "Super Admin" && (
                    <button
                      type="button"
                      onClick={() => {
                        const nextRoles = (db.roles || []).filter((r) => r.id !== role.id);
                        onPersistPatch("Roles Matrix", "roles", `Deleted role "${role.name}"`, {
                          roles: nextRoles,
                        });
                      }}
                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                      title="Delete Role"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {ROLE_PERM_GROUPS.map((grp) => {
                    const has = role.permissions.includes("*") || role.permissions.includes(grp.key);
                    return (
                      <button
                        key={grp.key}
                        type="button"
                        disabled={role.name === "Super Admin"}
                        onClick={() => {
                          const nextPerms = has
                            ? role.permissions.filter((p) => p !== grp.key)
                            : [...role.permissions, grp.key];
                          const nextRoles = db.roles.map((r) =>
                            r.id === role.id ? { ...r, permissions: nextPerms } : r
                          );
                          onPersistPatch("Roles Matrix", "roles", `Updated permissions for ${role.name}`, {
                            roles: nextRoles,
                          });
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer ${
                          has ? "bg-[#0084C7] text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {grp.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "logs") {
    const q = logSearch.toLowerCase();
    const filteredLogs = (db.auditLogs || []).filter(
      (l) =>
        !q ||
        l.action.toLowerCase().includes(q) ||
        l.section.toLowerCase().includes(q) ||
        l.actor.toLowerCase().includes(q)
    );
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <ClipboardList className="size-5 text-[#0084C7]" />
            <span>Administrative Activity Audit Logs ({filteredLogs.length})</span>
          </h2>
          <input
            type="text"
            placeholder="Filter logs..."
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-300 text-xs"
          />
        </div>
        <div className="space-y-2 max-h-[600px] overflow-y-auto text-xs">
          {filteredLogs.map((l) => (
            <div key={l.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap justify-between gap-2">
              <div>
                <span className="px-2 py-0.5 rounded bg-[#E0F2FE] text-[#0084C7] font-bold text-[10px] mr-2">
                  {l.section}
                </span>
                <strong className="text-slate-900">{l.action}</strong>
              </div>
              <span className="text-slate-500">
                {l.actor} ({l.actorRole || "Admin"}) · {new Date(l.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === "db-sync") {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Database className="size-5 text-[#0084C7]" />
          <span>Supabase &amp; Persistent Store Health</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <p className="font-bold text-emerald-900">Primary Cloud Tables Connected</p>
            <p className="text-emerald-700 mt-1">
              `orders` ({orders.length} unified), `products`, `categories` sync in real time with Supabase.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#E0F2FE] border border-sky-200">
            <p className="font-bold text-[#006DA6]">Enterprise Ledger &amp; CMS Persistence</p>
            <p className="text-slate-700 mt-1">
              Double-entry accounts, coupons, popups, invoices, courier bookings &amp; RBAC persist automatically in server store (`data/admin-db.json`).
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <p className="font-bold text-slate-900">Full Postgres DDL Script Included</p>
            <p className="text-slate-600 mt-1">
              Run `supabase/schema_enterprise_admin.sql` inside your Supabase SQL Editor anytime to mirror all 25+ enterprise tables in cloud Postgres.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Global Settings
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Settings className="size-5 text-[#0084C7]" />
          <span>Global Storefront, Hotline, Invoice &amp; SEO Settings</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Store Brand Name</label>
            <input
              type="text"
              value={settingsDraft.storeName}
              onChange={(e) => setSettingsDraft({ ...settingsDraft, storeName: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Primary Hotline</label>
            <input
              type="text"
              value={settingsDraft.hotlinePrimary}
              onChange={(e) => setSettingsDraft({ ...settingsDraft, hotlinePrimary: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">WhatsApp Support</label>
            <input
              type="text"
              value={settingsDraft.whatsappNumber}
              onChange={(e) => setSettingsDraft({ ...settingsDraft, whatsappNumber: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Support Email</label>
            <input
              type="email"
              value={settingsDraft.supportEmail}
              onChange={(e) => setSettingsDraft({ ...settingsDraft, supportEmail: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Default VAT (%) &amp; Invoice Prefix</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={settingsDraft.defaultVatPercent}
                onChange={(e) =>
                  setSettingsDraft({ ...settingsDraft, defaultVatPercent: Number(e.target.value) })
                }
                className="w-20 h-10 px-3 rounded-lg border border-slate-300"
              />
              <input
                type="text"
                value={settingsDraft.invoicePrefix}
                onChange={(e) =>
                  setSettingsDraft({ ...settingsDraft, invoicePrefix: e.target.value })
                }
                className="flex-1 h-10 px-3 rounded-lg border border-slate-300"
              />
            </div>
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Showroom / Office Address</label>
            <input
              type="text"
              value={settingsDraft.officeAddress}
              onChange={(e) => setSettingsDraft({ ...settingsDraft, officeAddress: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">SEO Default Meta Title</label>
            <input
              type="text"
              value={settingsDraft.seoDefaultTitle}
              onChange={(e) => setSettingsDraft({ ...settingsDraft, seoDefaultTitle: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Google Search Console Verification Code</label>
            <input
              type="text"
              placeholder="google-site-verification token"
              value={settingsDraft.googleSiteVerification || ""}
              onChange={(e) =>
                setSettingsDraft({ ...settingsDraft, googleSiteVerification: e.target.value })
              }
              className="w-full h-10 px-3 rounded-lg border border-slate-300"
            />
          </div>
          <div className="flex items-end gap-2">
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noreferrer"
              className="h-10 px-3.5 rounded-lg border border-slate-200 bg-slate-50 font-bold text-[#0084C7] inline-flex items-center"
            >
              /sitemap.xml
            </a>
            <a
              href="/robots.txt"
              target="_blank"
              rel="noreferrer"
              className="h-10 px-3.5 rounded-lg border border-slate-200 bg-slate-50 font-bold text-[#0084C7] inline-flex items-center"
            >
              /robots.txt
            </a>
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            onPersistPatch("Global Settings", "settings", "Updated global store & SEO configuration", {
              settings: settingsDraft,
            })
          }
          className="px-6 py-2.5 rounded-lg bg-[#0084C7] hover:bg-[#006DA6] text-white font-bold cursor-pointer"
        >
          Save Global &amp; SEO Settings
        </button>
      </div>

      {/* Centralized Email Notification & SMTP/Resend System */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Mail className="size-5 text-[#0084C7]" />
              <span>Email Notification Settings (SMTP / Resend)</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Dispatches real-time order, invoice, review moderation, registration &amp; courier failure alerts to admin &amp; customers.
            </p>
          </div>
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={settingsDraft.emailAlertsEnabled !== false}
              onChange={(e) =>
                setSettingsDraft({ ...settingsDraft, emailAlertsEnabled: e.target.checked })
              }
            />
            <span>Email Alerts Enabled</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Admin Notification Email *</label>
            <input
              type="email"
              value={settingsDraft.smtpSettings?.adminNotificationEmail || "electronics.rango@gmail.com"}
              onChange={(e) =>
                setSettingsDraft({
                  ...settingsDraft,
                  smtpSettings: {
                    provider: settingsDraft.smtpSettings?.provider || "smtp",
                    host: settingsDraft.smtpSettings?.host || "smtp.gmail.com",
                    port: settingsDraft.smtpSettings?.port || 465,
                    username: settingsDraft.smtpSettings?.username || "electronics.rango@gmail.com",
                    senderName: settingsDraft.smtpSettings?.senderName || "Rango Electronics",
                    senderEmail: settingsDraft.smtpSettings?.senderEmail || "electronics.rango@gmail.com",
                    adminNotificationEmail: e.target.value,
                  },
                })
              }
              className="w-full h-10 px-3 rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Mail Transport Provider</label>
            <select
              value={settingsDraft.smtpSettings?.provider || "smtp"}
              onChange={(e) =>
                setSettingsDraft({
                  ...settingsDraft,
                  smtpSettings: {
                    ...(settingsDraft.smtpSettings || {
                      host: "smtp.gmail.com",
                      port: 465,
                      username: "electronics.rango@gmail.com",
                      senderName: "Rango Electronics",
                      senderEmail: "electronics.rango@gmail.com",
                      adminNotificationEmail: "electronics.rango@gmail.com",
                    }),
                    provider: e.target.value as "smtp" | "resend",
                  },
                })
              }
              className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white"
            >
              <option value="smtp">SMTP (Nodemailer / Gmail / Custom)</option>
              <option value="resend">Resend REST API</option>
            </select>
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Sender Display Name</label>
            <input
              type="text"
              value={settingsDraft.smtpSettings?.senderName || "Rango Electronics"}
              onChange={(e) =>
                setSettingsDraft({
                  ...settingsDraft,
                  smtpSettings: {
                    ...(settingsDraft.smtpSettings || {
                      provider: "smtp",
                      host: "smtp.gmail.com",
                      port: 465,
                      username: "",
                      senderEmail: "electronics.rango@gmail.com",
                      adminNotificationEmail: "electronics.rango@gmail.com",
                    }),
                    senderName: e.target.value,
                  },
                })
              }
              className="w-full h-10 px-3 rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Sender From Email</label>
            <input
              type="email"
              value={settingsDraft.smtpSettings?.senderEmail || "electronics.rango@gmail.com"}
              onChange={(e) =>
                setSettingsDraft({
                  ...settingsDraft,
                  smtpSettings: {
                    ...(settingsDraft.smtpSettings || {
                      provider: "smtp",
                      host: "smtp.gmail.com",
                      port: 465,
                      username: "",
                      senderName: "Rango Electronics",
                      adminNotificationEmail: "electronics.rango@gmail.com",
                    }),
                    senderEmail: e.target.value,
                  },
                })
              }
              className="w-full h-10 px-3 rounded-lg border border-slate-300"
            />
          </div>

          {(settingsDraft.smtpSettings?.provider || "smtp") === "smtp" ? (
            <>
              <div>
                <label className="font-bold text-slate-700 block mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={settingsDraft.smtpSettings?.host || "smtp.gmail.com"}
                  onChange={(e) =>
                    setSettingsDraft({
                      ...settingsDraft,
                      smtpSettings: {
                        ...(settingsDraft.smtpSettings || {
                          provider: "smtp",
                          port: 465,
                          username: "",
                          senderName: "Rango Electronics",
                          senderEmail: "electronics.rango@gmail.com",
                          adminNotificationEmail: "electronics.rango@gmail.com",
                        }),
                        host: e.target.value,
                      },
                    })
                  }
                  className="w-full h-10 px-3 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">SMTP Port</label>
                <input
                  type="number"
                  value={settingsDraft.smtpSettings?.port ?? 465}
                  onChange={(e) =>
                    setSettingsDraft({
                      ...settingsDraft,
                      smtpSettings: {
                        ...(settingsDraft.smtpSettings || {
                          provider: "smtp",
                          host: "smtp.gmail.com",
                          username: "",
                          senderName: "Rango Electronics",
                          senderEmail: "electronics.rango@gmail.com",
                          adminNotificationEmail: "electronics.rango@gmail.com",
                        }),
                        port: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full h-10 px-3 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">SMTP Username</label>
                <input
                  type="text"
                  value={settingsDraft.smtpSettings?.username || ""}
                  onChange={(e) =>
                    setSettingsDraft({
                      ...settingsDraft,
                      smtpSettings: {
                        ...(settingsDraft.smtpSettings || {
                          provider: "smtp",
                          host: "smtp.gmail.com",
                          port: 465,
                          senderName: "Rango Electronics",
                          senderEmail: "electronics.rango@gmail.com",
                          adminNotificationEmail: "electronics.rango@gmail.com",
                        }),
                        username: e.target.value,
                      },
                    })
                  }
                  className="w-full h-10 px-3 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  SMTP App Password{" "}
                  {settingsDraft.smtpSettings?.hasPassword && (
                    <span className="text-emerald-600">(Configured)</span>
                  )}
                </label>
                <input
                  type="password"
                  placeholder={settingsDraft.smtpSettings?.hasPassword ? "•••••• (Saved)" : "Enter SMTP Password"}
                  value={emailSecretDraft.smtpPassword}
                  onChange={(e) => setEmailSecretDraft({ ...emailSecretDraft, smtpPassword: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300"
                />
              </div>
            </>
          ) : (
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Resend API Key</label>
              <input
                type="password"
                placeholder="re_••••••••••••••••••••"
                value={emailSecretDraft.resendApiKey}
                onChange={(e) => setEmailSecretDraft({ ...emailSecretDraft, resendApiKey: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-slate-300"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={emailBusy}
              onClick={async () => {
                setEmailBusy(true);
                setEmailSaveMsg(null);
                const res = await fetch("/api/admin/store", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    section: "Email Settings",
                    permissionKey: "settings",
                    actionDescription: "Updated SMTP & notification settings",
                    patch: { settings: settingsDraft },
                    secrets: emailSecretDraft,
                  }),
                });
                const data = await res.json();
                if (res.ok) {
                  onSyncResponse(data, "Saved email settings");
                  setEmailSecretDraft({ smtpPassword: "", resendApiKey: "" });
                  setEmailSaveMsg("Email configuration saved securely.");
                } else {
                  setEmailSaveMsg(data.error || "Failed to save email settings.");
                }
                setEmailBusy(false);
              }}
              className="px-5 py-2.5 rounded-lg bg-[#0084C7] hover:bg-[#006DA6] text-white font-bold cursor-pointer"
            >
              Save Email Configuration
            </button>

            <input
              type="email"
              value={testEmailTarget}
              onChange={(e) => setTestEmailTarget(e.target.value)}
              placeholder="Recipient for test email"
              className="h-10 px-3 rounded-lg border border-slate-300 w-56"
            />
            <button
              type="button"
              disabled={emailBusy}
              onClick={async () => {
                setEmailBusy(true);
                setEmailSaveMsg(null);
                const res = await fetch("/api/admin/store", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "send_test_email", toEmail: testEmailTarget }),
                });
                const data = await res.json();
                if (res.ok) {
                  onSyncResponse(data, `Test email processed (${data.emailResult?.adminLog?.status || "ok"})`);
                  setEmailSaveMsg(
                    `Test email status: ${data.emailResult?.adminLog?.status || "sent"}${
                      data.emailResult?.adminLog?.error ? ` — ${data.emailResult.adminLog.error}` : ""
                    }`
                  );
                } else {
                  setEmailSaveMsg(data.error || "Test email failed.");
                }
                setEmailBusy(false);
              }}
              className="px-4 py-2.5 rounded-lg border border-[#0084C7] text-[#0084C7] hover:bg-sky-50 font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="size-3.5" />
              <span>Send Test Email</span>
            </button>
          </div>
          {emailSaveMsg && <span className="font-semibold text-[#0084C7]">{emailSaveMsg}</span>}
        </div>

        {/* Email Delivery Logs */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <h4 className="font-bold text-slate-800">
            Recent Email Delivery Logs ({(db.emailLogs || []).length})
          </h4>
          {(db.emailLogs || []).length === 0 ? (
            <p className="text-slate-400 py-3">No notification emails dispatched yet.</p>
          ) : (
            <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase">
                  <tr>
                    <th className="p-2.5">Event</th>
                    <th className="p-2.5">Recipient</th>
                    <th className="p-2.5">Subject</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(db.emailLogs || []).slice(0, 30).map((log) => (
                    <tr key={log.id}>
                      <td className="p-2.5 font-semibold text-slate-800">
                        {log.eventType} ({log.audience})
                      </td>
                      <td className="p-2.5 text-slate-600">{log.recipient}</td>
                      <td className="p-2.5 text-slate-700 truncate max-w-[220px]">
                        {log.subject}
                        {log.error && <span className="block text-rose-600">{log.error}</span>}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            log.status === "sent"
                              ? "bg-emerald-100 text-emerald-700"
                              : log.status === "failed"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* First-Party Google OAuth Sign-In Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              First-Party Google Sign-In (Custom Domain — No Supabase Domain Shown)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Users sign in directly via <code>/api/auth/google/callback</code> on your own domain instead of <code>*.supabase.co</code>.
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full font-bold text-[11px] ${
              (db.settings as any)?.googleOAuthStatus?.configured
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {(db.settings as any)?.googleOAuthStatus?.configured
              ? "Active (First-Party OAuth)"
              : "Not Configured Yet"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Google OAuth Client ID
              {(db.settings as any)?.googleOAuthStatus?.maskedClientId && (
                <span className="ml-2 text-emerald-700 font-semibold">
                  (Saved: {(db.settings as any).googleOAuthStatus.maskedClientId})
                </span>
              )}
            </label>
            <input
              type="text"
              placeholder="xxxxxxxxxx.apps.googleusercontent.com"
              value={googleOAuthDraft.googleClientId}
              onChange={(e) =>
                setGoogleOAuthDraft({ ...googleOAuthDraft, googleClientId: e.target.value })
              }
              className="w-full h-10 px-3 rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Google OAuth Client Secret
              {(db.settings as any)?.googleOAuthStatus?.hasSecret && (
                <span className="ml-2 text-emerald-700 font-semibold">(Secret Saved)</span>
              )}
            </label>
            <input
              type="password"
              placeholder="GOCSPX-..."
              value={googleOAuthDraft.googleClientSecret}
              onChange={(e) =>
                setGoogleOAuthDraft({ ...googleOAuthDraft, googleClientSecret: e.target.value })
              }
              className="w-full h-10 px-3 rounded-lg border border-slate-300"
            />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
          <p className="font-bold text-slate-800">Google Cloud Console Authorized Redirect URIs:</p>
          <p>Production: <code>https://rangoelectronics.com/api/auth/google/callback</code></p>
          <p>Local Testing: <code>http://localhost:3000/api/auth/google/callback</code></p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={async () => {
              setGoogleSaveMsg(null);
              const res = await fetch("/api/admin/store", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  section: "Google OAuth",
                  permissionKey: "settings",
                  actionDescription: "Updated First-Party Google OAuth credentials",
                  patch: {},
                  secrets: googleOAuthDraft,
                }),
              });
              const data = await res.json();
              if (res.ok) {
                onSyncResponse(data, "Saved First-Party Google OAuth credentials");
                setGoogleOAuthDraft({ googleClientId: "", googleClientSecret: "" });
                setGoogleSaveMsg("Google Sign-In credentials saved securely on server.");
              } else {
                setGoogleSaveMsg(data.error || "Failed to save Google credentials.");
              }
            }}
            className="px-5 py-2.5 rounded-lg bg-[#0084C7] hover:bg-[#006DA6] text-white font-bold cursor-pointer"
          >
            Save Google Sign-In Credentials
          </button>
          {googleSaveMsg && <span className="font-semibold text-[#0084C7]">{googleSaveMsg}</span>}
        </div>
      </div>

      {/* Password Security Update */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
        <h3 className="text-sm font-extrabold text-slate-900">Change Your Admin Password</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
          <input
            type="password"
            placeholder="Current Password"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
            className="h-10 px-3 rounded-xl border border-slate-300"
          />
          <input
            type="password"
            placeholder="New Password (min 6 chars)"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
            className="h-10 px-3 rounded-xl border border-slate-300"
          />
          <button
            type="button"
            onClick={async () => {
              const res = await fetch("/api/admin/auth", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pwForm),
              });
              const data = await res.json();
              setUserMsg(res.ok ? "Password updated successfully." : data.error || "Update failed.");
              if (res.ok) setPwForm({ currentPassword: "", newPassword: "" });
            }}
            className="h-10 rounded-xl bg-slate-900 text-white font-bold"
          >
            Update Password
          </button>
        </div>
        {userMsg && <p className="font-bold text-[#0084C7]">{userMsg}</p>}
      </div>
    </div>
  );
};
