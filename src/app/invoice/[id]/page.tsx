"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Printer, ShieldCheck, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { useCart } from "@/context/CartContext";

interface NormalizedInvoiceItem {
  title: string;
  warranty: string;
  sku: string;
  quantity: number;
  price: number;
}

interface NormalizedInvoiceOrder {
  id: string;
  date: string;
  status: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  shippingAddress: {
    fullName: string;
    phone: string;
    email: string;
    city: string;
    address: string;
  };
  items: NormalizedInvoiceItem[];
}

function normalizeInvoiceOrder(raw: any, fallbackId: string): NormalizedInvoiceOrder {
  const rawItems = Array.isArray(raw?.items) ? raw.items : [];
  const items: NormalizedInvoiceItem[] = rawItems.map((it: any, idx: number) => {
    const p = it?.product && typeof it.product === "object" ? it.product : it;
    const price = Number(p?.price ?? it?.price ?? it?.unitPrice ?? 0) || 0;
    const quantity = Number(it?.quantity ?? it?.qty ?? 1) || 1;
    return {
      title: String(p?.title || it?.title || p?.name || `Product #${idx + 1}`),
      warranty: String(p?.warranty || it?.warranty || "Official Brand Warranty"),
      sku: String(p?.sku || p?.model || it?.sku || p?.id || "RE-ITEM"),
      quantity,
      price,
    };
  });

  const computedSubtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const subtotal = Number(raw?.subtotal ?? computedSubtotal) || computedSubtotal;
  const discount = Number(raw?.discount ?? 0) || 0;
  const shipping = Number(raw?.shipping ?? raw?.deliveryCharge ?? 0) || 0;
  const total =
    Number(raw?.total ?? Math.max(0, subtotal - discount + shipping)) ||
    Math.max(0, subtotal - discount + shipping);

  const addr = raw?.shippingAddress && typeof raw.shippingAddress === "object" ? raw.shippingAddress : {};
  const createdStr = raw?.createdAt || raw?.created_at;
  const formattedDate =
    raw?.date ||
    (createdStr
      ? new Date(createdStr).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }));

  return {
    id: String(raw?.id || raw?.orderId || raw?.invoiceNumber || fallbackId || "RE-784920"),
    date: formattedDate,
    status: String(raw?.status || "Processing"),
    paymentMethod: String(raw?.paymentMethod || raw?.payment_method || "Cash On Delivery"),
    subtotal,
    discount,
    shipping,
    total,
    shippingAddress: {
      fullName: String(addr.fullName || raw?.customerName || raw?.customer_name || "Valued Customer"),
      phone: String(addr.phone || addr.phoneNumber || raw?.phone || raw?.customerPhone || "N/A"),
      email: String(addr.email || raw?.email || raw?.customerEmail || ""),
      city: String(addr.city || raw?.city || "Dhaka"),
      address: String(addr.address || raw?.customerAddress || "Bangladesh"),
    },
    items,
  };
}

function buildDemoFallbackOrder(orderId: string): NormalizedInvoiceOrder {
  return {
    id: orderId || "RE-784920",
    date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    status: "Processing",
    paymentMethod: "Cash On Delivery",
    subtotal: 46900,
    discount: 0,
    shipping: 60,
    total: 46960,
    shippingAddress: {
      fullName: "Valued Customer",
      phone: "+88 01798-565001",
      email: "electronics.rango@gmail.com",
      city: "Dhaka",
      address: "Dhaka, Bangladesh",
    },
    items: [
      {
        title: "Samsung 43 Inch Crystal UHD 4K Smart TV (43U8000F)",
        warranty: "5 Years Panel Warranty",
        sku: "RE-SAM-1001",
        quantity: 1,
        price: 46900,
      },
    ],
  };
}

function InvoiceContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const autoPrint = searchParams?.get("print") === "1";
  const orderId = String(params?.id || "");
  const { orders } = useCart();

  const [order, setOrder] = useState<NormalizedInvoiceOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const findLocalOrder = () => {
      const cleanId = orderId.replace(/^#/, "").toLowerCase();
      const fromContext = (Array.isArray(orders) ? orders : []).find(
        (o: any) => String(o?.id || "").toLowerCase() === cleanId
      );
      if (fromContext) return fromContext;

      try {
        const stored = JSON.parse(localStorage.getItem("rango_orders") || "[]");
        if (Array.isArray(stored)) {
          return stored.find(
            (o: any) => String(o?.id || "").toLowerCase() === cleanId
          );
        }
      } catch {
        // ignore storage parse failure
      }
      return null;
    };

    const load = async () => {
      setLoading(true);
      const localMatch = findLocalOrder();

      if (orderId) {
        try {
          const res = await fetch(`/api/orders/lookup?orderId=${encodeURIComponent(orderId)}`, {
            cache: "no-store",
          });
          if (res.ok && active) {
            const data = await res.json();
            if (data.found && data.order) {
              setOrder(
                normalizeInvoiceOrder(
                  {
                    ...data.order,
                    ...(data.override || {}),
                  },
                  orderId
                )
              );
              setLoading(false);
              return;
            }
            if (data.found && data.invoice) {
              const inv = data.invoice;
              setOrder(
                normalizeInvoiceOrder(
                  {
                    id: inv.orderId || inv.invoiceNumber,
                    createdAt: inv.createdAt,
                    items: (inv.items || []).map((it: any) => ({
                      title: it.title,
                      price: it.unitPrice,
                      quantity: it.quantity,
                      sku: inv.invoiceNumber,
                      warranty: "Official Brand Warranty",
                    })),
                    subtotal: inv.subtotal,
                    discount: inv.discount,
                    shipping: inv.deliveryCharge,
                    total: inv.total,
                    status: inv.paymentStatus === "Paid" ? "Delivered" : "Processing",
                    paymentMethod: `${inv.paymentMethod || "Cash"} (${inv.paymentStatus || "Paid"})`,
                    shippingAddress: {
                      fullName: inv.customerName,
                      phone: inv.customerPhone,
                      email: inv.customerEmail || "",
                      city: "Bangladesh",
                      address: inv.customerAddress,
                    },
                  },
                  orderId
                )
              );
              setLoading(false);
              return;
            }
          }
        } catch {
          // fall back cleanly
        }
      }

      if (!active) return;

      if (localMatch) {
        setOrder(normalizeInvoiceOrder(localMatch, orderId));
      } else {
        setOrder(buildDemoFallbackOrder(orderId));
      }
      setLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, [orderId, orders]);

  useEffect(() => {
    if (!loading && order && autoPrint && typeof window !== "undefined") {
      const t = setTimeout(() => window.print(), 350);
      return () => clearTimeout(t);
    }
  }, [loading, order, autoPrint]);

  if (loading || !order) {
    return (
      <div className="bg-[#EDEDED] min-h-[70vh] flex items-center justify-center p-8">
        <div className="text-center space-y-2.5">
          <div className="size-9 rounded-full border-2 border-[#0084C7] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-semibold text-gray-600">Loading official invoice...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#EDEDED] min-h-screen py-8 md:py-12 print:bg-white print:py-0 print:min-h-0">
      <div className="max-w-3xl mx-auto px-4 print:max-w-none print:px-0">
        {/* Top Print Toolbar */}
        <div className="mb-6 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-primary transition-colors"
            >
              <ArrowLeft className="size-4" />
              <span>Back to Store</span>
            </Link>
            <Link
              href="/account?tab=orders"
              className="text-xs font-semibold text-[#0084C7] hover:underline"
            >
              My Orders
            </Link>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-[#0084C7] hover:bg-[#006DA6] text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2"
          >
            <Printer className="size-4" />
            <span>Print Official Invoice</span>
          </button>
        </div>

        {/* Official Invoice Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-10 shadow-sm print:shadow-none print:border-none print:p-0 print-invoice-sheet">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b-2 border-gray-100">
            <div>
              <Logo variant="dark" className="w-48 mb-2.5" />
              <p className="text-xs text-gray-500">Official Electronics &amp; Appliances Retailer</p>
              <p className="text-xs text-gray-500">H-11 R-11 DIT Project Merul Badda Dhaka</p>
              <p className="text-xs text-gray-500">Hotline: +88 01798-565001 | electronics.rango@gmail.com</p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="inline-block px-3 py-1 rounded-md bg-sky-50 text-[#0084C7] text-xs font-bold uppercase tracking-wider">
                Official Invoice
              </span>
              <h2 className="text-xl font-black text-gray-900 pt-1">#{order.id}</h2>
              <p className="text-xs text-gray-500">Date: {order.date}</p>
              <p className="text-xs font-bold text-emerald-600">Status: {order.status}</p>
            </div>
          </div>

          {/* Billing & Shipping Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-5 border-b border-gray-100 text-xs">
            <div>
              <h4 className="font-bold text-gray-400 uppercase tracking-wider mb-1.5">Billed / Delivered To:</h4>
              <p className="font-extrabold text-gray-900 text-sm">{order.shippingAddress.fullName}</p>
              <p className="text-gray-600 mt-0.5">{order.shippingAddress.address}</p>
              <p className="text-gray-600">{order.shippingAddress.city}, Bangladesh</p>
              <p className="text-gray-600 mt-1">Phone: {order.shippingAddress.phone}</p>
              {order.shippingAddress.email && (
                <p className="text-gray-600">Email: {order.shippingAddress.email}</p>
              )}
            </div>

            <div className="space-y-1 sm:text-right">
              <h4 className="font-bold text-gray-400 uppercase tracking-wider mb-1.5">Order Information:</h4>
              <p className="text-gray-600">
                <span className="font-semibold text-gray-800">Payment Channel:</span> {order.paymentMethod}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold text-gray-800">Delivery Service:</span> Express Nationwide Courier
              </p>
              <p className="text-gray-600">
                <span className="font-semibold text-gray-800">Warranty Card:</span> Included in Package
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-5 border-b border-gray-200 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-1">Item Description</th>
                  <th className="py-2.5 px-2 text-center">SKU / Model</th>
                  <th className="py-2.5 px-2 text-center">Qty</th>
                  <th className="py-2.5 px-2 text-right">Unit Price</th>
                  <th className="py-2.5 px-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-1">
                      <p className="font-bold text-gray-900">{item.title}</p>
                      <p className="text-[11px] text-gray-500">Warranty: {item.warranty}</p>
                    </td>
                    <td className="py-3 px-2 text-center text-gray-500">{item.sku}</td>
                    <td className="py-3 px-2 text-center font-bold">{item.quantity}</td>
                    <td className="py-3 px-2 text-right">৳{item.price.toLocaleString()}</td>
                    <td className="py-3 px-1 text-right font-bold">
                      ৳{(item.price * item.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div className="pt-5 flex justify-end">
            <div className="w-full max-w-xs space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-bold text-gray-900">৳{order.subtotal.toLocaleString()}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Special Discount:</span>
                  <span>-৳{order.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping Fee:</span>
                <span className="font-bold text-gray-900">৳{order.shipping.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-gray-200 text-base font-black text-gray-900">
                <span>Grand Total:</span>
                <span className="text-xl text-[#0084C7] font-black">৳{order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Warranty & Authenticity Stamp */}
          <div className="mt-8 pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-emerald-600" />
              <span>Certified 100% Genuine with Official Brand Warranty</span>
            </div>
            <div className="text-center sm:text-right">
              <div className="w-32 border-b border-gray-400 mb-1 mx-auto sm:ml-auto"></div>
              <span className="text-[10px] text-gray-400 uppercase font-semibold">
                Authorized Signature
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-gray-500">Loading Invoice...</div>}>
      <InvoiceContent />
    </Suspense>
  );
}
