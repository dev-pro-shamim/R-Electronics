"use client";

import { useEffect, useState } from "react";
import { Product } from "@/data/products";
import {
  AdminBannerItem,
  AdminBrandItem,
  AdminCategoryItem,
  AdminCoupon,
  AdminEmiBankConfig,
  AdminEmiRate,
  AdminPaymentChannel,
  AdminPolicyPage,
  AdminPopupItem,
  AdminStoreSettings,
  AdminTrackingSettings,
  ChatbotFaqItem,
  ProductAdminExtended,
  ProductModerationOverride,
} from "@/types/admin";

export interface PublicRuntimeData {
  coupons: AdminCoupon[];
  banners: AdminBannerItem[];
  popups: AdminPopupItem[];
  tracking: AdminTrackingSettings;
  emiBanks: AdminEmiBankConfig[];
  emiRates: AdminEmiRate[];
  policies: Record<string, AdminPolicyPage>;
  chatbotFaqs: ChatbotFaqItem[];
  paymentChannels: AdminPaymentChannel[];
  products: (Product & ProductAdminExtended)[];
  categories: AdminCategoryItem[];
  brands: AdminBrandItem[];
  productModeration: Record<string, ProductModerationOverride>;
  settings: Partial<AdminStoreSettings>;
}

const RUNTIME_SESSION_KEY = "rango_runtime_cache_v1";
const RUNTIME_SESSION_TTL_MS = 90_000;

let cachedRuntime: PublicRuntimeData | null = null;
let cachedProductMap: Map<string, Product & ProductAdminExtended> = new Map();
let inflightPromise: Promise<PublicRuntimeData | null> | null = null;
const runtimeSubscribers = new Set<(data: PublicRuntimeData | null) => void>();
let globalRefreshBound = false;

function indexRuntimeProducts(data: PublicRuntimeData | null) {
  cachedRuntime = data;
  const nextMap = new Map<string, Product & ProductAdminExtended>();
  if (data?.products) {
    for (const p of data.products) {
      nextMap.set(p.id, p);
    }
  }
  cachedProductMap = nextMap;
}

function hydrateRuntimeFromSession(): PublicRuntimeData | null {
  if (cachedRuntime) return cachedRuntime;
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(RUNTIME_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts?: number; data?: PublicRuntimeData };
    if (parsed?.data && parsed.ts && Date.now() - parsed.ts < RUNTIME_SESSION_TTL_MS) {
      indexRuntimeProducts(parsed.data);
      return cachedRuntime;
    }
  } catch {
    // ignore storage parse error
  }
  return null;
}

export function getRuntimeProductById(
  runtime: PublicRuntimeData | null,
  productId: string
): (Product & ProductAdminExtended) | undefined {
  if (!runtime) return undefined;
  return cachedProductMap.get(productId);
}

export async function fetchPublicRuntime(force = false): Promise<PublicRuntimeData | null> {
  if (!force) {
    const localHit = hydrateRuntimeFromSession();
    if (localHit) return localHit;
  }
  if (!force && inflightPromise) return inflightPromise;

  const url = force ? `/api/admin/store?public=runtime&t=${Date.now()}` : "/api/admin/store?public=runtime";
  inflightPromise = fetch(url, { cache: force ? "no-store" : "default" })
    .then((res) => (res.ok ? res.json() : null))
    .then((data: PublicRuntimeData | null) => {
      if (data) {
        indexRuntimeProducts(data);
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem(
              RUNTIME_SESSION_KEY,
              JSON.stringify({ ts: Date.now(), data })
            );
          } catch {
            // quota exceeded safely ignored
          }
        }
        runtimeSubscribers.forEach((cb) => cb(data));
      }
      inflightPromise = null;
      return data;
    })
    .catch(() => {
      inflightPromise = null;
      return null;
    });

  return inflightPromise;
}

export function useStoreRuntime(): PublicRuntimeData | null {
  // Must start as null to match SSR HTML during React hydration cleanly
  const [data, setData] = useState<PublicRuntimeData | null>(null);

  useEffect(() => {
    let mounted = true;
    const localHit = hydrateRuntimeFromSession();
    if (localHit) {
      setData(localHit);
    }

    const listener = (next: PublicRuntimeData | null) => {
      if (mounted && next) setData(next);
    };
    runtimeSubscribers.add(listener);

    if (!globalRefreshBound && typeof window !== "undefined") {
      globalRefreshBound = true;
      window.addEventListener("rango-runtime-refresh", () => {
        try {
          sessionStorage.removeItem(RUNTIME_SESSION_KEY);
        } catch {}
        fetchPublicRuntime(true);
      });
    }

    if (!localHit) {
      fetchPublicRuntime().then((res) => {
        if (mounted && res) setData(res);
      });
    }

    return () => {
      mounted = false;
      runtimeSubscribers.delete(listener);
    };
  }, []);

  return data;
}

export function fireTrackingEvent(
  eventName: string,
  params: {
    value?: number;
    currency?: string;
    contentIds?: string[];
    orderId?: string;
    userData?: { email?: string; phone?: string };
  } = {}
) {
  if (typeof window === "undefined") return;
  const eventId = `evt-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const win = window as any;

  // 1. GTM dataLayer push
  if (Array.isArray(win.dataLayer)) {
    win.dataLayer.push({
      event: eventName,
      event_id: eventId,
      ecommerce: {
        currency: params.currency || "BDT",
        value: params.value,
        transaction_id: params.orderId,
        items: (params.contentIds || []).map((id) => ({ item_id: id })),
      },
    });
  }

  // 2. Meta Pixel browser event with shared eventID for CAPI deduplication
  if (typeof win.fbq === "function") {
    win.fbq(
      "track",
      eventName,
      {
        currency: params.currency || "BDT",
        value: params.value,
        content_ids: params.contentIds,
        content_type: "product",
      },
      { eventID: eventId }
    );
  }

  // 3. Server-side CAPI forward (non-blocking)
  fetch("/api/tracking/capi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventName,
      eventId,
      eventSourceUrl: window.location.href,
      value: params.value,
      currency: params.currency || "BDT",
      contentIds: params.contentIds,
      orderId: params.orderId,
      userData: params.userData,
    }),
  }).catch(() => {});
}
