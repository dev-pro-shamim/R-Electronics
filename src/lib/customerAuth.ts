import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { CustomerUserRecord } from "@/types/admin";

export const CUSTOMER_COOKIE = "rango_customer_session";
export const GOOGLE_STATE_COOKIE = "rango_google_oauth_state";

export function getRequestOrigin(req: NextRequest): string {
  const proto =
    req.headers.get("x-forwarded-proto") ||
    req.nextUrl.protocol.replace(":", "") ||
    "http";
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    req.nextUrl.host;
  return `${proto}://${host}`;
}

function getCustomerSecret(): string {
  return (
    process.env.CUSTOMER_SESSION_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    "rango-customer-auth-secret-2026"
  );
}

export function hashCustomerPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, `rango-cust-${salt}`, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyCustomerPassword(password: string, storedHash?: string): boolean {
  if (!storedHash || !storedHash.startsWith("scrypt:")) return false;
  const parts = storedHash.split(":");
  if (parts.length !== 3) return false;
  const [, salt, original] = parts;
  const derived = crypto.scryptSync(password, `rango-cust-${salt}`, 64);
  const origBuf = Buffer.from(original, "hex");
  if (derived.length !== origBuf.length) return false;
  return crypto.timingSafeEqual(derived, origBuf);
}

export function createCustomerToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 })
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getCustomerSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyCustomerToken(token: string | undefined): { uid: string } | null {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = crypto
    .createHmac("sha256", getCustomerSecret())
    .update(payload)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!parsed.uid || !parsed.exp || parsed.exp < Date.now()) return null;
    return { uid: String(parsed.uid) };
  } catch {
    return null;
  }
}

export function sanitizeCustomer(user: CustomerUserRecord) {
  const { passwordHash: _pw, ...safe } = user;
  return {
    ...safe,
    name: safe.fullName,
  };
}

export function attachCustomerSessionCookie(res: NextResponse, userId: string) {
  res.cookies.set(CUSTOMER_COOKIE, createCustomerToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
