"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Eye,
  Printer,
  Mail,
  Plus,
  CheckCircle2,
  XCircle,
  Truck,
  CreditCard,
  FileText,
  X,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { Product } from "@/data/products";
import {
  AdminCourierBooking,
  AdminCourierProvider,
  AdminDatabase,
  AdminInvoiceRecord,
  AdminOrderRecord,
  AdminTabId,
  OrderStatus,
  PaymentStatusType,
} from "@/types/admin";

interface AdminSalesModuleProps {
  activeTab: AdminTabId;
  db: AdminDatabase;
  orders: AdminOrderRecord[];
  products: Product[];
  onAction: (
    action: string,
    payload: Record<string, unknown>,
    msg?: string,
    onSuccessMeta?: (meta: Record<string, any>) => void
  ) => Promise<boolean>;
  onCourierAction: (payload: Record<string, unknown>, msg?: string) => Promise<boolean>;
  quickIntent?: string | null;
  onConsumeQuickIntent?: () => void;
}

const ORDER_STATUSES: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Processing",
  "Ready to Ship",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Returned",
  "Refunded",
];

const PAYMENT_STATUSES: PaymentStatusType[] = [
  "Paid",
  "Unpaid",
  "Partial Payment",
  "Pending Verification",
  "Failed",
  "Refunded",
];

export const AdminSalesModule: React.FC<AdminSalesModuleProps> = ({
  activeTab,
  db,
  orders,
  products,
  onAction,
  onCourierAction,
  quickIntent,
  onConsumeQuickIntent,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [payMethodFilter, setPayMethodFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderRecord | null>(null);
  const [orderNoteDraft, setOrderNoteDraft] = useState("");

  // Payment verification modal state
  const [verifyTarget, setVerifyTarget] = useState<AdminOrderRecord | null>(null);
  const [verifyNote, setVerifyNote] = useState("");
  const [gatewayRef, setGatewayRef] = useState("");

  // Manual Invoice modal state
  const [showManualInvoice, setShowManualInvoice] = useState(false);
  const [manualInv, setManualInv] = useState({
    sourceChannel: "Walk-in" as AdminInvoiceRecord["sourceChannel"],
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "Merul Badda, Dhaka",
    productId: products[0]?.id || "",
    customTitle: "",
    quantity: 1,
    unitPrice: products[0]?.price || 0,
    discount: 0,
    vatPercent: db.settings?.defaultVatPercent || 0,
    deliveryCharge: 0,
    paymentMethod: "Cash",
    paymentStatus: "Paid" as PaymentStatusType,
  });

  // Print preview modal & bulk selection
  const [printInvoice, setPrintInvoice] = useState<AdminInvoiceRecord | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkOrderStatus, setBulkOrderStatus] = useState<OrderStatus>("Confirmed");
  const [bulkPayStatus, setBulkPayStatus] = useState<PaymentStatusType>("Paid");
  const [bulkPrintOrders, setBulkPrintOrders] = useState<AdminOrderRecord[]>([]);

  // Courier booking form & 1-click quick courier
  const [bookOrderId, setBookOrderId] = useState(orders[0]?.id || "");
  const [bookCourierId, setBookCourierId] = useState("steadfast");
  const [quickCourierId, setQuickCourierId] = useState<string>(() => {
    const enabled = (db.couriers || []).find((c) => c.enabled);
    return enabled?.id || (db.couriers || [])[0]?.id || "steadfast";
  });
  const [bookingOrderId, setBookingOrderId] = useState<string | null>(null);
  const [bookMode, setBookMode] = useState<"auto" | "manual">("auto");
  const [manualTrackId, setManualTrackId] = useState("");
  const [manualCharge, setManualCharge] = useState(120);

  // Per-provider Courier API Configuration state
  const [selectedCourierId, setSelectedCourierId] = useState<AdminCourierProvider["id"]>("steadfast");
  const currentCourier = useMemo(
    () =>
      (db.couriers || []).find((c) => c.id === selectedCourierId) ||
      (db.couriers || [])[0] || {
        id: "steadfast" as const,
        name: "Steadfast Courier",
        enabled: false,
        sandboxMode: true,
        defaultCharge: 120,
      },
    [db.couriers, selectedCourierId]
  );

  const [courierDraft, setCourierDraft] = useState<{
    name: string;
    enabled: boolean;
    sandboxMode: boolean;
    baseUrl: string;
    storeId: string;
    trackingUrlPattern: string;
    defaultCharge: number;
    apiKey: string;
    secretKey: string;
    clientId: string;
    clientSecret: string;
    apiToken: string;
    username: string;
    password: string;
    authHeaderName: string;
  }>({
    name: currentCourier.name || "",
    enabled: currentCourier.enabled,
    sandboxMode: currentCourier.sandboxMode,
    baseUrl: currentCourier.baseUrl || "",
    storeId: currentCourier.storeId || "",
    trackingUrlPattern: currentCourier.trackingUrlPattern || "",
    defaultCharge: currentCourier.defaultCharge ?? 120,
    apiKey: "",
    secretKey: "",
    clientId: "",
    clientSecret: "",
    apiToken: "",
    username: "",
    password: "",
    authHeaderName: "Authorization",
  });
  const [courierFeedback, setCourierFeedback] = useState<string | null>(null);
  const [busyCourier, setBusyCourier] = useState<"save" | "test" | string | null>(null);

  useEffect(() => {
    setCourierDraft({
      name: currentCourier.name || "",
      enabled: currentCourier.enabled,
      sandboxMode: currentCourier.sandboxMode,
      baseUrl: currentCourier.baseUrl || "",
      storeId: currentCourier.storeId || "",
      trackingUrlPattern: currentCourier.trackingUrlPattern || "",
      defaultCharge: currentCourier.defaultCharge ?? 120,
      apiKey: "",
      secretKey: "",
      clientId: "",
      clientSecret: "",
      apiToken: "",
      username: "",
      password: "",
      authHeaderName: currentCourier.maskedSummary?.authHeaderName || "Authorization",
    });
    setCourierFeedback(null);
  }, [currentCourier]);

  useEffect(() => {
    if (quickIntent === "create_invoice") {
      setShowManualInvoice(true);
      onConsumeQuickIntent?.();
    }
  }, [quickIntent, onConsumeQuickIntent]);

  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (
        payMethodFilter !== "all" &&
        !o.paymentMethod.toLowerCase().includes(payMethodFilter)
      ) {
        return false;
      }
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        (o.shippingAddress?.fullName || "").toLowerCase().includes(q) ||
        (o.shippingAddress?.phone || o.shippingAddress?.phoneNumber || "").includes(q) ||
        (o.items || []).some((it) =>
          (it.title || it.product?.title || "").toLowerCase().includes(q)
        )
      );
    });
  }, [orders, search, statusFilter, payMethodFilter]);

  if (activeTab === "payments") {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-[#E0F2FE] text-[#0084C7] flex items-center justify-center">
              <CreditCard className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Payment Verification &amp; Gateway Logs
              </h2>
              <p className="text-xs text-slate-500">
                Verify bKash/Nagad Transaction IDs manually before marking Paid &amp; posting to Accounts.
              </p>
            </div>
          </div>
          <div className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
            Pending Verification:{" "}
            {orders.filter((o) => o.paymentStatus === "Pending Verification").length}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
                <th className="p-3">Order ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Method &amp; Sender / TrxID</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Verify Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="p-3 font-extrabold text-[#0084C7]">#{o.id}</td>
                  <td className="p-3">
                    <div className="font-bold text-slate-800">{o.shippingAddress?.fullName}</div>
                    <div className="text-[11px] text-slate-500">
                      {o.shippingAddress?.phone || o.shippingAddress?.phoneNumber}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-800">{o.paymentMethod}</div>
                    {(o.bkashTrxId || o.nagadTrxId) && (
                      <div className="text-[11px] text-[#0084C7] font-mono">
                        TrxID: {o.bkashTrxId || o.nagadTrxId} ({o.bkashPhone || o.nagadPhone || "N/A"})
                      </div>
                    )}
                  </td>
                  <td className="p-3 font-extrabold text-slate-900">
                    ৳{Number(o.total || 0).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        o.paymentStatus === "Paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : o.paymentStatus === "Pending Verification"
                          ? "bg-amber-100 text-amber-800"
                          : o.paymentStatus === "Failed" || o.paymentStatus === "Refunded"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                    {o.paymentStatus !== "Paid" && (
                      <button
                        type="button"
                        onClick={() =>
                          onAction(
                            "verify_payment",
                            {
                              order: o,
                              paymentStatus: "Paid",
                              gatewayReference: o.bkashTrxId || o.nagadTrxId || "",
                              notes: "Quick-approved from Payment Verification table",
                            },
                            `Approved payment for #${o.id}`
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="size-3.5" />
                        <span>Approve</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setVerifyTarget(o);
                        setVerifyNote("");
                        setGatewayRef(o.bkashTrxId || o.nagadTrxId || "");
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#0084C7] text-white font-bold cursor-pointer"
                    >
                      Inspect / Verify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {verifyTarget && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900">
                  Verify Payment · #{verifyTarget.id}
                </h3>
                <button type="button" onClick={() => setVerifyTarget(null)}>
                  <X className="size-5 text-slate-400" />
                </button>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <p><strong>Customer:</strong> {verifyTarget.shippingAddress?.fullName}</p>
                <p><strong>Method:</strong> {verifyTarget.paymentMethod}</p>
                <p><strong>Amount:</strong> ৳{Number(verifyTarget.total).toLocaleString()}</p>
                <p><strong>Customer Submitted TrxID:</strong> {verifyTarget.bkashTrxId || verifyTarget.nagadTrxId || "None (COD/Gateway)"}</p>
              </div>
              <input
                type="text"
                value={gatewayRef}
                onChange={(e) => setGatewayRef(e.target.value)}
                placeholder="Verified Bank / Merchant Reference ID"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs"
              />
              <textarea
                rows={2}
                value={verifyNote}
                onChange={(e) => setVerifyNote(e.target.value)}
                placeholder="Admin verification note..."
                className="w-full p-3 rounded-xl border border-slate-300 text-xs"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await onAction(
                      "verify_payment",
                      {
                        order: verifyTarget,
                        paymentStatus: "Paid",
                        notes: verifyNote,
                        gatewayReference: gatewayRef,
                      },
                      `Confirmed Order #${verifyTarget.id} as Paid`
                    );
                    setVerifyTarget(null);
                  }}
                  className="py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="size-4" />
                  <span>Confirm Paid</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onAction(
                      "verify_payment",
                      {
                        order: verifyTarget,
                        paymentStatus: "Failed",
                        notes: verifyNote,
                      },
                      `Rejected Order #${verifyTarget.id} payment`
                    );
                    setVerifyTarget(null);
                  }}
                  className="py-2.5 rounded-xl bg-rose-600 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1 cursor-pointer"
                >
                  <XCircle className="size-4" />
                  <span>Reject Payment</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onAction("verify_payment", {
                      order: verifyTarget,
                      paymentStatus: "Partial Payment",
                      notes: verifyNote,
                    });
                    setVerifyTarget(null);
                  }}
                  className="py-2 rounded-xl bg-amber-500 text-white text-xs font-bold cursor-pointer"
                >
                  Mark Partial
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onAction("verify_payment", {
                      order: verifyTarget,
                      paymentStatus: "Refunded",
                      notes: verifyNote,
                    });
                    setVerifyTarget(null);
                  }}
                  className="py-2 rounded-xl bg-slate-700 text-white text-xs font-bold cursor-pointer"
                >
                  Mark Refunded
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === "invoices") {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-[#E0F2FE] text-[#0084C7] flex items-center justify-center">
              <FileText className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Automatic &amp; Manual Invoice Manager
              </h2>
              <p className="text-xs text-slate-500">
                Create Walk-in / Phone / Facebook / WhatsApp invoices — prints ONLY the official A4 invoice.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowManualInvoice(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0084C7] to-[#006DA6] text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Create Manual Invoice</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto print:hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
                <th className="p-3">Invoice #</th>
                <th className="p-3">Type / Channel</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Total (incl. VAT/Delivery)</th>
                <th className="p-3">Payment</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(db.invoices || []).map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="p-3 font-extrabold text-[#0084C7]">{inv.invoiceNumber}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[10px] uppercase mr-1">
                      {inv.invoiceType}
                    </span>
                    <span className="text-slate-600">{inv.sourceChannel}</span>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-800">{inv.customerName}</div>
                    <div className="text-[11px] text-slate-500">{inv.customerPhone}</div>
                  </td>
                  <td className="p-3 font-extrabold text-slate-900">
                    ৳{inv.total.toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        inv.paymentStatus === "Paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {inv.paymentStatus}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                    <a
                      href={`/invoice/${encodeURIComponent(inv.invoiceNumber)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-[#0084C7] text-white font-bold inline-flex items-center gap-1"
                    >
                      <ExternalLink className="size-3.5" />
                      <span>Invoice Page</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setPrintInvoice(inv)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#E0F2FE] text-[#0084C7] font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="size-3.5" />
                      <span>Print / PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onAction("email_invoice", { invoiceId: inv.id })}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Mail className="size-3.5" />
                      <span>Email</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Manual Invoice Modal */}
        {showManualInvoice && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 print:hidden">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900">Create Manual Invoice</h3>
                <button type="button" onClick={() => setShowManualInvoice(false)}>
                  <X className="size-5 text-slate-400" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Order Channel</label>
                  <select
                    value={manualInv.sourceChannel}
                    onChange={(e) => setManualInv({ ...manualInv, sourceChannel: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Walk-in">Walk-in Showroom</option>
                    <option value="Phone">Phone Order</option>
                    <option value="Facebook">Facebook Page Order</option>
                    <option value="WhatsApp">WhatsApp Order</option>
                    <option value="Custom">Custom Offline Sale</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Customer Name *</label>
                  <input
                    type="text"
                    value={manualInv.customerName}
                    onChange={(e) => setManualInv({ ...manualInv, customerName: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={manualInv.customerPhone}
                    onChange={(e) => setManualInv({ ...manualInv, customerPhone: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Customer Email</label>
                  <input
                    type="email"
                    value={manualInv.customerEmail}
                    onChange={(e) => setManualInv({ ...manualInv, customerEmail: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-600 block mb-1">Select Product</label>
                  <select
                    value={manualInv.productId}
                    onChange={(e) => {
                      const p = products.find((item) => item.id === e.target.value);
                      setManualInv({
                        ...manualInv,
                        productId: e.target.value,
                        unitPrice: p?.price || 0,
                      });
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white"
                  >
                    {products.slice(0, 80).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} (৳{p.price.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={manualInv.quantity}
                    onChange={(e) => setManualInv({ ...manualInv, quantity: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Unit Price (৳)</label>
                  <input
                    type="number"
                    value={manualInv.unitPrice}
                    onChange={(e) => setManualInv({ ...manualInv, unitPrice: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Discount (৳)</label>
                  <input
                    type="number"
                    value={manualInv.discount}
                    onChange={(e) => setManualInv({ ...manualInv, discount: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">VAT % / Delivery (৳)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="VAT%"
                      value={manualInv.vatPercent}
                      onChange={(e) => setManualInv({ ...manualInv, vatPercent: Number(e.target.value) })}
                      className="w-1/2 h-10 px-3 rounded-xl border border-slate-300"
                    />
                    <input
                      type="number"
                      placeholder="Delivery"
                      value={manualInv.deliveryCharge}
                      onChange={(e) => setManualInv({ ...manualInv, deliveryCharge: Number(e.target.value) })}
                      className="w-1/2 h-10 px-3 rounded-xl border border-slate-300"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Payment Method</label>
                  <select
                    value={manualInv.paymentMethod}
                    onChange={(e) => setManualInv({ ...manualInv, paymentMethod: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Card / Bank">Card / Bank</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Payment Status</label>
                  <select
                    value={manualInv.paymentStatus}
                    onChange={(e) => setManualInv({ ...manualInv, paymentStatus: e.target.value as PaymentStatusType })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white"
                  >
                    {PAYMENT_STATUSES.map((ps) => (
                      <option key={ps} value={ps}>{ps}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const chosen = products.find((p) => p.id === manualInv.productId);
                  await onAction(
                    "create_invoice",
                    {
                      invoice: {
                        sourceChannel: manualInv.sourceChannel,
                        customerName: manualInv.customerName || "Walk-in Customer",
                        customerPhone: manualInv.customerPhone || "N/A",
                        customerEmail: manualInv.customerEmail || undefined,
                        customerAddress: manualInv.customerAddress,
                        discount: manualInv.discount,
                        vatPercent: manualInv.vatPercent,
                        deliveryCharge: manualInv.deliveryCharge,
                        paymentMethod: manualInv.paymentMethod,
                        paymentStatus: manualInv.paymentStatus,
                        items: [
                          {
                            productId: chosen?.id,
                            title: manualInv.customTitle || chosen?.title || "Electronics Item",
                            quantity: manualInv.quantity,
                            unitPrice: manualInv.unitPrice,
                            total: manualInv.quantity * manualInv.unitPrice,
                          },
                        ],
                      },
                    },
                    "Generated manual invoice",
                    (meta) => {
                      if (meta?.invoice) {
                        setPrintInvoice(meta.invoice as AdminInvoiceRecord);
                      }
                    }
                  );
                  setShowManualInvoice(false);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0084C7] to-[#006DA6] text-white text-xs font-extrabold cursor-pointer"
              >
                Generate &amp; Preview Official Invoice
              </button>
            </div>
          </div>
        )}

        {/* Print Invoice Sheet Modal - Prints Strictly ONLY the Official Invoice */}
        {printInvoice && (
          <div className="admin-print-portal fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-8 space-y-5 shadow-2xl print-invoice-sheet">
              <div className="flex justify-between items-start border-b-2 border-[#0084C7]/20 pb-4">
                <div>
                  <img src="/logo.png" alt="Rango Electronics" className="h-9 w-auto mb-1.5" />
                  <h2 className="text-xl font-black text-[#0084C7]">RANGO ELECTRONICS</h2>
                  <p className="text-xs text-slate-500">{db.settings?.officeAddress}</p>
                  <p className="text-xs text-slate-500">Hotline: {db.settings?.hotlinePrimary} · {db.settings?.supportEmail}</p>
                </div>
                <div className="text-right text-xs space-y-0.5">
                  <span className="inline-block px-2.5 py-0.5 rounded bg-sky-50 text-[#0084C7] font-extrabold uppercase text-[10px]">
                    Official Invoice
                  </span>
                  <p className="font-black text-base text-slate-900">{printInvoice.invoiceNumber}</p>
                  <p className="text-slate-500">{new Date(printInvoice.createdAt).toLocaleDateString("en-GB")}</p>
                  <p className="font-bold text-emerald-700">{printInvoice.paymentStatus} ({printInvoice.paymentMethod})</p>
                </div>
              </div>
              <div className="text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <p><strong>Billed To:</strong> {printInvoice.customerName} ({printInvoice.customerPhone})</p>
                <p><strong>Address:</strong> {printInvoice.customerAddress}</p>
                {printInvoice.customerEmail && <p><strong>Email:</strong> {printInvoice.customerEmail}</p>}
              </div>
              <table className="w-full text-xs border-y border-slate-200">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="py-2.5 px-2">Item Description</th>
                    <th className="py-2.5 px-2 text-center">Qty</th>
                    <th className="py-2.5 px-2 text-right">Unit Price</th>
                    <th className="py-2.5 px-2 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {printInvoice.items.map((it, idx) => (
                    <tr key={idx} className="border-t border-slate-100">
                      <td className="py-2.5 px-2 font-semibold text-slate-900">{it.title}</td>
                      <td className="py-2.5 px-2 text-center">{it.quantity}</td>
                      <td className="py-2.5 px-2 text-right">৳{it.unitPrice.toLocaleString()}</td>
                      <td className="py-2.5 px-2 text-right font-bold">৳{it.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-2">
                <p className="text-[11px] text-slate-500 max-w-xs">
                  {db.settings?.invoiceFooterNote || "Thank you for shopping genuine electronics at Rango Electronics! Official Brand Warranty Included."}
                </p>
                <div className="text-right text-xs space-y-1 ml-auto">
                  <p>Subtotal: ৳{printInvoice.subtotal.toLocaleString()}</p>
                  {printInvoice.discount > 0 && <p>Discount: -৳{printInvoice.discount.toLocaleString()}</p>}
                  {printInvoice.vatAmount > 0 && <p>VAT ({printInvoice.vatPercent}%): ৳{printInvoice.vatAmount.toLocaleString()}</p>}
                  <p>Delivery: ৳{printInvoice.deliveryCharge.toLocaleString()}</p>
                  <p className="text-lg font-black text-[#0084C7] pt-1 border-t border-slate-200">Total: ৳{printInvoice.total.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 print:hidden pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPrintInvoice(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
                <a
                  href={`/invoice/${encodeURIComponent(printInvoice.invoiceNumber)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl border border-[#0084C7] text-[#0084C7] text-xs font-bold inline-flex items-center gap-1"
                >
                  <ExternalLink className="size-3.5" />
                  <span>Open Dedicated Page</span>
                </a>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0084C7] to-[#006DA6] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Printer className="size-4" />
                  <span>Print Official Invoice</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === "courier" || activeTab === "tracking") {
    const masked = currentCourier.maskedSummary || {};

    return (
      <div className="space-y-6">
        {/* Per-Provider Courier API Configuration */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="size-5 text-[#0084C7]" />
                <span>Courier API Integration &amp; Credentials</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Credentials are stored strictly server-side with masked previews. Configure only the active carrier you use.
              </p>
            </div>
            <span
              className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                currentCourier.hasCredentials
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {currentCourier.hasCredentials ? "Credentials Configured" : "No API Keys Saved"}
            </span>
          </div>

          {/* Provider Selector Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            {(db.couriers || []).map((c) => {
              const active = c.id === selectedCourierId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCourierId(c.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition-colors flex items-center gap-2 cursor-pointer ${
                    active
                      ? "bg-[#0084C7] text-white border-[#0084C7]"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span>{c.name}</span>
                  <span
                    className={`size-2 rounded-full ${
                      c.enabled ? "bg-emerald-400" : active ? "bg-sky-200" : "bg-slate-300"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Provider-Specific Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <label className="h-10 flex items-center gap-2 px-3 rounded-lg border border-slate-200 bg-slate-50 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={courierDraft.enabled}
                onChange={(e) => setCourierDraft({ ...courierDraft, enabled: e.target.checked })}
              />
              <span>Enable {currentCourier.name}</span>
            </label>

            <label className="h-10 flex items-center gap-2 px-3 rounded-lg border border-slate-200 bg-slate-50 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={courierDraft.sandboxMode}
                onChange={(e) => setCourierDraft({ ...courierDraft, sandboxMode: e.target.checked })}
              />
              <span>Sandbox / Test Mode</span>
            </label>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Default Charge (৳)</label>
              <input
                type="number"
                value={courierDraft.defaultCharge}
                onChange={(e) => setCourierDraft({ ...courierDraft, defaultCharge: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg border border-slate-300"
              />
            </div>

            {selectedCourierId !== "rango_express" && (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    API Key {masked.apiKey && <span className="text-slate-400">({masked.apiKey})</span>}
                  </label>
                  <input
                    type="password"
                    placeholder={masked.apiKey ? "Saved (enter new to update)" : `Enter ${currentCourier.name} API Key`}
                    value={courierDraft.apiKey || courierDraft.apiToken || courierDraft.clientId}
                    onChange={(e) =>
                      setCourierDraft({
                        ...courierDraft,
                        apiKey: e.target.value,
                        apiToken: e.target.value,
                        clientId: selectedCourierId === "pathao" ? e.target.value : courierDraft.clientId,
                      })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Secret Key {masked.secretKey && <span className="text-slate-400">({masked.secretKey})</span>}
                  </label>
                  <input
                    type="password"
                    placeholder={masked.secretKey ? "Saved (enter new to update)" : `Enter ${currentCourier.name} Secret Key`}
                    value={courierDraft.secretKey || courierDraft.clientSecret}
                    onChange={(e) =>
                      setCourierDraft({
                        ...courierDraft,
                        secretKey: e.target.value,
                        clientSecret: selectedCourierId === "pathao" ? e.target.value : courierDraft.clientSecret,
                      })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-slate-300"
                  />
                </div>
              </>
            )}

            {selectedCourierId === "pathao" && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Store ID</label>
                <input
                  type="text"
                  placeholder="e.g. 148290"
                  value={courierDraft.storeId}
                  onChange={(e) => setCourierDraft({ ...courierDraft, storeId: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300"
                />
              </div>
            )}

            {selectedCourierId === "custom" && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Custom Carrier Name</label>
                <input
                  type="text"
                  value={courierDraft.name}
                  onChange={(e) => setCourierDraft({ ...courierDraft, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300"
                />
              </div>
            )}
          </div>

          {/* Save & Test Actions + Status Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="text-xs space-y-0.5">
              {currentCourier.lastTestedAt && (
                <p
                  className={`font-semibold ${
                    currentCourier.lastTestStatus === "ok" ? "text-emerald-700" : "text-rose-600"
                  }`}
                >
                  Last Test ({new Date(currentCourier.lastTestedAt).toLocaleString()}): {currentCourier.lastTestMessage}
                </p>
              )}
              {courierFeedback && <p className="text-[#0084C7] font-semibold">{courierFeedback}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={busyCourier !== null}
                onClick={async () => {
                  setBusyCourier("save");
                  setCourierFeedback(null);
                  const ok = await onCourierAction(
                    {
                      action: "save_config",
                      providerId: selectedCourierId,
                      config: {
                        name: courierDraft.name || currentCourier.name,
                        enabled: courierDraft.enabled,
                        sandboxMode: courierDraft.sandboxMode,
                        baseUrl: courierDraft.baseUrl,
                        storeId: courierDraft.storeId,
                        trackingUrlPattern: courierDraft.trackingUrlPattern,
                        defaultCharge: courierDraft.defaultCharge,
                      },
                      secrets: {
                        apiKey: courierDraft.apiKey,
                        secretKey: courierDraft.secretKey,
                        clientId: courierDraft.clientId,
                        clientSecret: courierDraft.clientSecret,
                        apiToken: courierDraft.apiToken,
                        username: courierDraft.username,
                        password: courierDraft.password,
                        storeId: courierDraft.storeId,
                        authHeaderName: courierDraft.authHeaderName,
                      },
                    },
                    `Saved ${currentCourier.name} configuration`
                  );
                  if (ok) {
                    setCourierFeedback("Configuration & credentials saved securely on server.");
                  }
                  setBusyCourier(null);
                }}
                className="h-10 px-5 rounded-lg bg-[#0084C7] hover:bg-[#006DA6] text-white text-xs font-bold cursor-pointer disabled:opacity-60"
              >
                {busyCourier === "save" ? "Saving..." : "Save Configuration"}
              </button>

              <button
                type="button"
                disabled={busyCourier !== null}
                onClick={async () => {
                  setBusyCourier("test");
                  setCourierFeedback(null);
                  const ok = await onCourierAction(
                    { action: "test_connection", providerId: selectedCourierId },
                    `Tested ${currentCourier.name} connection`
                  );
                  if (ok) {
                    setCourierFeedback(`Completed ${currentCourier.name} API health check.`);
                  }
                  setBusyCourier(null);
                }}
                className="h-10 px-4 rounded-lg border border-[#0084C7] text-[#0084C7] hover:bg-sky-50 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`size-3.5 ${busyCourier === "test" ? "animate-spin" : ""}`} />
                <span>{busyCourier === "test" ? "Testing..." : "Test Connection"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Book Shipment Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <Truck className="size-5 text-[#0084C7]" />
            <h2 className="text-base font-bold text-slate-900">
              Courier Dispatch &amp; Consignment Booking
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <select
              value={bookOrderId}
              onChange={(e) => setBookOrderId(e.target.value)}
              className="h-10 px-3 rounded-lg border border-slate-300 bg-white"
            >
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  #{o.id} — {o.shippingAddress?.fullName}
                </option>
              ))}
            </select>
            <select
              value={bookCourierId}
              onChange={(e) => setBookCourierId(e.target.value)}
              className="h-10 px-3 rounded-lg border border-slate-300 bg-white"
            >
              {(db.couriers || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.sandboxMode ? "Sandbox" : "Live"})
                </option>
              ))}
            </select>
            <select
              value={bookMode}
              onChange={(e) => setBookMode(e.target.value as "auto" | "manual")}
              className="h-10 px-3 rounded-lg border border-slate-300 bg-white"
            >
              <option value="auto">Automatic API Booking</option>
              <option value="manual">Manual Tracking Entry</option>
            </select>
            <input
              type="text"
              placeholder={bookMode === "manual" ? "Manual Tracking ID" : "Charge (৳)"}
              value={bookMode === "manual" ? manualTrackId : manualCharge}
              onChange={(e) =>
                bookMode === "manual"
                  ? setManualTrackId(e.target.value)
                  : setManualCharge(Number(e.target.value))
              }
              className="h-10 px-3 rounded-lg border border-slate-300"
            />
            <button
              type="button"
              onClick={async () => {
                const target = orders.find((o) => o.id === bookOrderId);
                if (!target) return;
                await onCourierAction(
                  {
                    action: "book_courier",
                    order: target,
                    courierId: bookCourierId,
                    mode: bookMode,
                    trackingId: manualTrackId,
                    deliveryCharge: manualCharge,
                  },
                  `Booked courier for Order #${target.id}`
                );
              }}
              className="h-10 rounded-lg bg-[#0084C7] hover:bg-[#006DA6] text-white font-bold cursor-pointer"
            >
              Create Consignment
            </button>
          </div>
        </div>

        {/* Bookings & Tracking List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
                <th className="p-3">Consignment / Tracking</th>
                <th className="p-3">Order ID</th>
                <th className="p-3">Courier Partner</th>
                <th className="p-3">Recipient</th>
                <th className="p-3">Charge</th>
                <th className="p-3">Delivery Status</th>
                <th className="p-3 text-right">Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(db.courierBookings || []).map((b: AdminCourierBooking & { trackingUrl?: string; apiResponseSummary?: string; lastSyncedAt?: string }) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-[#0084C7]">
                    <div>{b.consignmentId}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <span>{b.trackingId}</span>
                      {b.trackingUrl && (
                        <a href={b.trackingUrl} target="_blank" rel="noreferrer" title="Track Online" className="text-[#0084C7]">
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                    {b.lastError && (
                      <p className="text-[10px] font-sans text-rose-600 inline-flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="size-3" /> {b.lastError}
                      </p>
                    )}
                    {b.apiResponseSummary && (
                      <p className="text-[10px] font-sans text-slate-500 mt-0.5">{b.apiResponseSummary}</p>
                    )}
                  </td>
                  <td className="p-3 font-bold">#{b.orderId}</td>
                  <td className="p-3">
                    {b.courierName}{" "}
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 uppercase">
                      {b.mode}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold">{b.recipientName}</div>
                    <div className="text-[11px] text-slate-500">{b.recipientPhone}</div>
                  </td>
                  <td className="p-3 font-bold">৳{b.deliveryCharge}</td>
                  <td className="p-3">
                    <select
                      value={b.deliveryStatus}
                      onChange={(e) =>
                        onCourierAction({
                          action: "update_booking_status",
                          bookingId: b.id,
                          deliveryStatus: e.target.value,
                        })
                      }
                      className="h-8 px-2 rounded-lg border border-slate-300 bg-white text-xs font-bold"
                    >
                      {["Booked", "Picked Up", "In Transit", "Delivered", "Returned", "Cancelled"].map(
                        (s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        )
                      )}
                    </select>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      disabled={busyCourier === b.id}
                      onClick={async () => {
                        setBusyCourier(b.id);
                        await onCourierAction(
                          { action: "fetch_tracking", bookingId: b.id },
                          `Fetched live tracking for #${b.trackingId}`
                        );
                        setBusyCourier(null);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-sky-50 text-[#0084C7] hover:bg-sky-100 text-[11px] font-bold inline-flex items-center gap-1"
                    >
                      <RefreshCw className={`size-3 ${busyCourier === b.id ? "animate-spin" : ""}`} />
                      <span>Fetch Status</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const allFilteredSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((o) => selectedOrderIds.includes(o.id));
  const selectedOrderObjects = orders.filter((o) => selectedOrderIds.includes(o.id));

  return (
    <div className="space-y-5">
      {/* Advanced Order Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center gap-3 print:hidden">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Order ID, Customer Name, Mobile Number, Product..."
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-300 text-xs outline-none focus:border-[#0084C7]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-slate-300 text-xs bg-white"
        >
          <option value="all">All Order Statuses</option>
          {ORDER_STATUSES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
        <select
          value={payMethodFilter}
          onChange={(e) => setPayMethodFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-slate-300 text-xs bg-white"
        >
          <option value="all">All Payment Methods</option>
          <option value="cash">Cash on Delivery</option>
          <option value="bkash">bKash</option>
          <option value="nagad">Nagad</option>
          <option value="ssl">SSLCommerz / Card</option>
          <option value="emi">EMI</option>
        </select>
        <div className="flex items-center gap-1.5 bg-sky-50 border border-sky-200 rounded-xl px-2.5 h-10">
          <Truck className="size-3.5 text-[#0084C7] shrink-0" />
          <span className="text-[11px] font-bold text-[#006DA6] whitespace-nowrap">1-Click Courier:</span>
          <select
            value={quickCourierId}
            onChange={(e) => setQuickCourierId(e.target.value)}
            className="text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer"
          >
            {(db.couriers || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedOrderIds.length > 0 && (
        <div className="bg-gradient-to-r from-[#0084C7] via-[#006DA6] to-[#FF7A00] text-white rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2 text-xs font-extrabold">
            <CheckCircle2 className="size-4" />
            <span>{selectedOrderIds.length} Orders Selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={bulkOrderStatus}
              onChange={(e) => setBulkOrderStatus(e.target.value as OrderStatus)}
              className="h-9 px-2.5 rounded-lg bg-white text-slate-900 font-bold"
            >
              {ORDER_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={async () => {
                await onAction(
                  "bulk_update_orders",
                  { orders: selectedOrderObjects, status: bulkOrderStatus },
                  `Processed ${selectedOrderObjects.length} orders -> ${bulkOrderStatus}`
                );
              }}
              className="h-9 px-3 rounded-lg bg-slate-900 text-white font-bold cursor-pointer hover:opacity-95"
            >
              Process Orders
            </button>

            <select
              value={bulkPayStatus}
              onChange={(e) => setBulkPayStatus(e.target.value as PaymentStatusType)}
              className="h-9 px-2.5 rounded-lg bg-white text-slate-900 font-bold"
            >
              {PAYMENT_STATUSES.map((ps) => (
                <option key={ps} value={ps}>
                  {ps}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={async () => {
                await onAction(
                  "bulk_update_orders",
                  { orders: selectedOrderObjects, paymentStatus: bulkPayStatus },
                  `Updated payment status (${bulkPayStatus}) on ${selectedOrderObjects.length} orders`
                );
              }}
              className="h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
            >
              Process Payments
            </button>

            <select
              value={quickCourierId}
              onChange={(e) => setQuickCourierId(e.target.value)}
              className="h-9 px-2.5 rounded-lg bg-white text-slate-900 font-bold"
              title="Select courier for 1-click bulk entry"
            >
              {(db.couriers || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={async () => {
                const unbooked = selectedOrderObjects.filter((ord) => !ord.trackingNo);
                const targets = unbooked.length > 0 ? unbooked : selectedOrderObjects;
                await onCourierAction(
                  {
                    action: "book_courier_bulk",
                    orders: targets,
                    courierId: quickCourierId,
                  },
                  `1-Click Courier booked for ${targets.length} order(s)`
                );
              }}
              className="h-9 px-3 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Truck className="size-3.5" />
              <span>1-Click Courier</span>
            </button>

            <button
              type="button"
              onClick={() => setBulkPrintOrders(selectedOrderObjects)}
              className="h-9 px-3.5 rounded-lg bg-white text-[#0084C7] font-extrabold inline-flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Printer className="size-4" />
              <span>Print {selectedOrderObjects.length} Invoices</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedOrderIds([])}
              className="h-9 px-3 rounded-lg bg-white/20 text-white font-bold cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Orders List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto print:hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
              <th className="p-3 w-9">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={(e) =>
                    setSelectedOrderIds(
                      e.target.checked ? filteredOrders.map((o) => o.id) : []
                    )
                  }
                  className="size-4 accent-[#0084C7] cursor-pointer"
                  aria-label="Select all orders"
                />
              </th>
              <th className="p-3">Order ID</th>
              <th className="p-3">Customer &amp; Phone</th>
              <th className="p-3">Products</th>
              <th className="p-3">Total</th>
              <th className="p-3">Payment &amp; TrxID</th>
              <th className="p-3">Order Status</th>
              <th className="p-3">Courier</th>
              <th className="p-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.map((o) => {
              const checked = selectedOrderIds.includes(o.id);
              const senderNo = o.bkashPhone || o.nagadPhone;
              const trxId = o.bkashTrxId || o.nagadTrxId;
              return (
              <tr key={o.id} className={checked ? "bg-sky-50/70" : "hover:bg-slate-50"}>
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      setSelectedOrderIds((prev) =>
                        e.target.checked ? [...prev, o.id] : prev.filter((id) => id !== o.id)
                      )
                    }
                    className="size-4 accent-[#0084C7] cursor-pointer"
                    aria-label={`Select order ${o.id}`}
                  />
                </td>
                <td className="p-3 whitespace-nowrap">
                  <div className="font-extrabold text-[#0084C7]">#{o.id}</div>
                  <div className="text-[11px] text-slate-400">{o.date}</div>
                </td>
                <td className="p-3">
                  <div className="font-bold text-slate-800">{o.shippingAddress?.fullName}</div>
                  <div className="text-[11px] text-slate-500">
                    {o.shippingAddress?.phone || o.shippingAddress?.phoneNumber}
                  </div>
                </td>
                <td className="p-3 max-w-[200px]">
                  <p className="truncate font-semibold text-slate-700">
                    {o.items?.[0]?.title || o.items?.[0]?.product?.title || "Order Items"}
                  </p>
                  <p className="text-[11px] text-slate-400">{(o.items || []).length} item(s)</p>
                </td>
                <td className="p-3 font-extrabold text-slate-900 whitespace-nowrap">
                  ৳{Number(o.total || 0).toLocaleString()}
                </td>
                <td className="p-3 whitespace-nowrap space-y-1">
                  <div className="text-[11px] font-bold text-slate-800 truncate max-w-[155px]">
                    {o.paymentMethod}
                  </div>
                  {(senderNo || trxId) && (
                    <div className="text-[11px] font-mono text-[#0084C7] bg-sky-50 px-2 py-0.5 rounded border border-sky-100 inline-block">
                      {senderNo ? `${senderNo} · ` : ""}
                      {trxId ? `Trx: ${trxId}` : ""}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        o.paymentStatus === "Paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {o.paymentStatus}
                    </span>
                    {o.paymentStatus !== "Paid" && (
                      <button
                        type="button"
                        onClick={() =>
                          onAction(
                            "verify_payment",
                            {
                              order: o,
                              paymentStatus: "Paid",
                              gatewayReference: trxId || "",
                              notes: "Approved directly from Orders List",
                            },
                            `Payment approved for #${o.id}`
                          )
                        }
                        className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold cursor-pointer"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <select
                    value={o.status}
                    onChange={(e) =>
                      onAction(
                        "update_order",
                        { order: o, status: e.target.value },
                        `Order #${o.id} moved to ${e.target.value}`
                      )
                    }
                    className="h-8 px-2 rounded-lg border border-slate-300 bg-white text-xs font-bold"
                  >
                    {ORDER_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-3 text-[11px] text-slate-600 whitespace-nowrap">
                  {o.trackingNo ? (
                    <div>
                      <div className="font-semibold text-slate-800">{o.courier || "Assigned"}</div>
                      <div className="font-mono text-[#0084C7]">{o.trackingNo}</div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={bookingOrderId === o.id}
                        onClick={async () => {
                          setBookingOrderId(o.id);
                          try {
                            await onCourierAction(
                              {
                                action: "book_courier",
                                order: o,
                                courierId: quickCourierId,
                                mode: "auto",
                              },
                              `1-Click Courier booked for #${o.id}`
                            );
                          } finally {
                            setBookingOrderId(null);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#0084C7] to-[#006DA6] text-white text-[10px] font-bold inline-flex items-center gap-1 hover:opacity-95 cursor-pointer disabled:opacity-50 shadow-xs"
                        title={`Book ${quickCourierId} in 1 click`}
                      >
                        <Truck className="size-3" />
                        <span>
                          {bookingOrderId === o.id
                            ? "Booking..."
                            : `1-Click ${
                                (db.couriers || []).find((c) => c.id === quickCourierId)?.name?.split(" ")[0] ||
                                "Courier"
                              }`}
                        </span>
                      </button>
                    </div>
                  )}
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOrder(o);
                      setOrderNoteDraft(o.adminNote || "");
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#E0F2FE] text-[#0084C7] font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="size-3.5" />
                    <span>View</span>
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bulk Multi-Invoice Print Portal (prints ONLY invoices, 1 per page) */}
      {bulkPrintOrders.length > 0 && (
        <div className="admin-print-portal fixed inset-0 z-50 bg-black/75 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-lg print:hidden">
              <p className="text-sm font-extrabold text-slate-900">
                Bulk Invoice Print Queue ({bulkPrintOrders.length} Official Invoices)
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBulkPrintOrders([])}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0084C7] to-[#006DA6] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Printer className="size-4" />
                  <span>Print All {bulkPrintOrders.length} Invoices</span>
                </button>
              </div>
            </div>

            {bulkPrintOrders.map((ord, idx) => (
              <div
                key={ord.id}
                className={`bg-white rounded-2xl p-8 space-y-5 shadow-xl print-invoice-sheet ${
                  idx < bulkPrintOrders.length - 1 ? "print-page-break" : ""
                }`}
              >
                <div className="flex justify-between items-start border-b-2 border-slate-100 pb-4">
                  <div>
                    <img src="/logo.png" alt="Rango Electronics" className="h-9 w-auto mb-1.5" />
                    <h2 className="text-xl font-black text-[#0084C7]">RANGO ELECTRONICS</h2>
                    <p className="text-xs text-slate-500">{db.settings?.officeAddress}</p>
                    <p className="text-xs text-slate-500">Hotline: {db.settings?.hotlinePrimary}</p>
                  </div>
                  <div className="text-right text-xs space-y-0.5">
                    <span className="inline-block px-2.5 py-0.5 rounded bg-sky-50 text-[#0084C7] font-bold uppercase text-[10px]">
                      Official Invoice
                    </span>
                    <p className="font-black text-base text-slate-900">#{ord.id}</p>
                    <p className="text-slate-500">{ord.date}</p>
                    <p className="font-bold text-emerald-700">{ord.paymentStatus} ({ord.paymentMethod})</p>
                  </div>
                </div>
                <div className="text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <p><strong>Billed To:</strong> {ord.shippingAddress?.fullName} ({ord.shippingAddress?.phone || ord.shippingAddress?.phoneNumber})</p>
                  <p><strong>Address:</strong> {ord.shippingAddress?.address}, {ord.shippingAddress?.city}</p>
                </div>
                <table className="w-full text-xs border-y border-slate-200">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="py-2 px-2">Item</th>
                      <th className="py-2 px-2 text-center">Qty</th>
                      <th className="py-2 px-2 text-right">Unit</th>
                      <th className="py-2 px-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(ord.items || []).map((it, i2) => {
                      const price = Number(it.price || it.product?.price || 0);
                      return (
                        <tr key={i2} className="border-t border-slate-100">
                          <td className="py-2 px-2 font-semibold">{it.title || it.product?.title || "Item"}</td>
                          <td className="py-2 px-2 text-center">{it.quantity}</td>
                          <td className="py-2 px-2 text-right">৳{price.toLocaleString()}</td>
                          <td className="py-2 px-2 text-right font-bold">৳{(price * it.quantity).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="text-right text-xs space-y-1">
                  <p>Subtotal: ৳{Number(ord.subtotal || 0).toLocaleString()}</p>
                  {Number(ord.discount || 0) > 0 && <p>Discount: -৳{Number(ord.discount || 0).toLocaleString()}</p>}
                  <p>Delivery: ৳{Number(ord.shipping || 0).toLocaleString()}</p>
                  <p className="text-base font-black text-[#0084C7]">Total: ৳{Number(ord.total || 0).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rich Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Order #{selectedOrder.id}
                </h3>
                <p className="text-xs text-slate-500">
                  Placed: {selectedOrder.date} · Status:{" "}
                  <strong className="text-[#0084C7]">{selectedOrder.status}</strong>
                </p>
              </div>
              <button type="button" onClick={() => setSelectedOrder(null)}>
                <X className="size-5 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-extrabold text-slate-800 uppercase text-[11px]">
                  Customer &amp; Delivery Address
                </p>
                <p className="font-bold text-slate-900">{selectedOrder.shippingAddress?.fullName}</p>
                <p>{selectedOrder.shippingAddress?.phone || selectedOrder.shippingAddress?.phoneNumber}</p>
                <p>{selectedOrder.shippingAddress?.address}, {selectedOrder.shippingAddress?.city}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-extrabold text-slate-800 uppercase text-[11px]">
                  Payment &amp; Courier
                </p>
                <p><strong>Payment:</strong> {selectedOrder.paymentMethod} ({selectedOrder.paymentStatus})</p>
                <p><strong>Courier:</strong> {selectedOrder.courier || "Pending Assignment"}</p>
                <p><strong>Tracking ID:</strong> {selectedOrder.trackingNo || "Not Dispatched"}</p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3">Item</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedOrder.items || []).map((it, idx) => {
                    const price = Number(it.price || it.product?.price || 0);
                    return (
                      <tr key={idx}>
                        <td className="p-3 font-semibold">{it.title || it.product?.title}</td>
                        <td className="p-3 text-center">{it.quantity}</td>
                        <td className="p-3 text-right">৳{price.toLocaleString()}</td>
                        <td className="p-3 text-right font-bold">
                          ৳{(price * it.quantity).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Admin Order Notes</label>
                <textarea
                  rows={2}
                  value={orderNoteDraft}
                  onChange={(e) => setOrderNoteDraft(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div className="text-right text-xs space-y-1">
                <p>Subtotal: ৳{Number(selectedOrder.subtotal).toLocaleString()}</p>
                <p>Discount: -৳{Number(selectedOrder.discount || 0).toLocaleString()}</p>
                <p>Delivery: ৳{Number(selectedOrder.shipping || 0).toLocaleString()}</p>
                <p className="text-lg font-black text-[#0084C7]">
                  Total: ৳{Number(selectedOrder.total).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={async () => {
                  await onAction("create_invoice", { order: selectedOrder }, `Invoice ready for #${selectedOrder.id}`);
                  window.open(`/invoice/${selectedOrder.id}`, "_blank");
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="size-4" />
                <span>Print / Generate Invoice</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onAction(
                    "update_order",
                    { order: selectedOrder, adminNote: orderNoteDraft },
                    `Saved note on #${selectedOrder.id}`
                  );
                  setSelectedOrder(null);
                }}
                className="px-5 py-2 rounded-xl bg-[#0084C7] text-white text-xs font-bold cursor-pointer"
              >
                Save Admin Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
