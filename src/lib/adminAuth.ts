import crypto from "crypto";
import { NextRequest } from "next/server";
import { AdminRoleName, RoleDefinition } from "@/types/admin";

export const ADMIN_COOKIE_NAME = "rango_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export const DEFAULT_ROLES: RoleDefinition[] = [
  {
    id: "role-super-admin",
    name: "Super Admin",
    description: "Full unrestricted access across all modules, users, finance & settings.",
    permissions: ["*"],
  },
  {
    id: "role-order-manager",
    name: "Order Manager",
    description: "Manage orders, payment verification, invoices, courier dispatch & stock alerts.",
    permissions: ["overview", "sales", "inventory", "customers"],
  },
  {
    id: "role-product-editor",
    name: "Product Editor",
    description: "Create & edit products, categories, brands, reviews, Q&A & inventory adjustments.",
    permissions: ["overview", "catalog", "inventory"],
  },
  {
    id: "role-accounts-manager",
    name: "Accounts Manager",
    description: "Full access to financial accounts, income, expenses, ledger, transfers & P&L reports.",
    permissions: ["overview", "finance", "sales"],
  },
  {
    id: "role-marketing-manager",
    name: "Marketing Manager",
    description: "Manage coupons, offers, banners, popups, Meta Pixel, GTM & CMS pages.",
    permissions: ["overview", "marketing", "website"],
  },
  {
    id: "role-customer-support",
    name: "Customer Support",
    description: "Handle customer inquiries, Rango Assistant chatbot conversations, FAQs, Q&A & order tracking.",
    permissions: ["overview", "support", "customers", "sales"],
  },
];

export const TAB_TO_PERMISSION_GROUP: Record<string, string> = {
  overview: "overview",
  orders: "sales",
  payments: "sales",
  invoices: "sales",
  courier: "sales",
  tracking: "sales",
  products: "catalog",
  "add-product": "catalog",
  categories: "catalog",
  brands: "catalog",
  reviews: "catalog",
  qna: "catalog",
  "inv-overview": "inventory",
  "inv-adjust": "inventory",
  "inv-history": "inventory",
  "inv-alerts": "inventory",
  coupons: "marketing",
  offers: "marketing",
  banners: "marketing",
  popups: "marketing",
  "meta-pixel": "marketing",
  gtm: "marketing",
  customers: "customers",
  inquiries: "support",
  chatbot: "support",
  faqs: "support",
  "acc-overview": "finance",
  "acc-income": "finance",
  "acc-expenses": "finance",
  "acc-debit-credit": "finance",
  "acc-ledger": "finance",
  "acc-transfers": "finance",
  "acc-reports": "finance",
  cms: "website",
  homepage: "website",
  "landing-pages": "website",
  emi: "website",
  delivery: "website",
  "pay-settings": "website",
  settings: "system",
  users: "system",
  roles: "system",
  logs: "system",
  "db-sync": "system",
};

export function hasRolePermission(
  role: AdminRoleName | string,
  tabId: string,
  roles: RoleDefinition[] = DEFAULT_ROLES
): boolean {
  if (role === "Super Admin") return true;
  const def = roles.find((r) => r.name === role);
  if (!def) return false;
  if (def.permissions.includes("*")) return true;
  const group = TAB_TO_PERMISSION_GROUP[tabId] || tabId;
  return def.permissions.includes(group);
}

function getAuthSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    "rango-electronics-admin-session-2026-key"
  );
}

export function hashPassword(password: string): string {
  return crypto
    .createHmac("sha256", getAuthSecret())
    .update(password)
    .digest("hex");
}

export function verifyAdminPassword(
  provided: string,
  user: { email: string; passwordHash: string }
): boolean {
  if (!provided || !user) return false;
  // 1. Direct HMAC match with configured secret
  if (hashPassword(provided) === user.passwordHash) return true;
  // 2. Direct HMAC match with default secret fallback
  const defaultHash = crypto
    .createHmac("sha256", "rango-electronics-admin-session-2026-key")
    .update(provided)
    .digest("hex");
  if (defaultHash === user.passwordHash) return true;
  // 3. Known seed hash check for Rango@2026
  if (
    provided === "Rango@2026" &&
    (user.passwordHash === "3e4992e42835241589ccb001dc99f2ff35ad1fb664318405005ab43f37974560" ||
      user.passwordHash === defaultHash)
  ) {
    return true;
  }
  // 4. Primary admin fallback
  const isPrimary =
    user.email.toLowerCase() ===
    (process.env.ADMIN_EMAIL || "admin@rangoelectronics.com").toLowerCase();
  const envPass = process.env.ADMIN_PASSWORD || "Rango@2026";
  if (isPrimary && provided === envPass) return true;

  return false;
}

export function createAdminSessionToken(
  email: string,
  role: AdminRoleName = "Super Admin",
  name = "Rango Admin"
): string {
  const payload = Buffer.from(
    JSON.stringify({
      email,
      role,
      name,
      exp: Date.now() + SESSION_TTL_MS,
    })
  ).toString("base64url");

  const sig = crypto
    .createHmac("sha256", getAuthSecret())
    .update(payload)
    .digest("base64url");

  return `${payload}.${sig}`;
}

export function verifyAdminSessionToken(
  token: string | undefined | null
): { email: string; role: AdminRoleName; name: string } | null {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const expectedSig = crypto
    .createHmac("sha256", getAuthSecret())
    .update(payload)
    .digest("base64url");

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!parsed?.email || !parsed?.exp || Date.now() > parsed.exp) {
      return null;
    }
    return {
      email: String(parsed.email),
      role: (parsed.role as AdminRoleName) || "Super Admin",
      name: String(parsed.name || parsed.email),
    };
  } catch {
    return null;
  }
}

export function getAdminSessionFromRequest(
  req: NextRequest
): { email: string; role: AdminRoleName; name: string } | null {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminSessionToken(token);
}
