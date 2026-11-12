import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getGoogleOAuthConfig } from "@/lib/serverSecrets";
import { GOOGLE_STATE_COOKIE, getRequestOrigin } from "@/lib/customerAuth";

export async function GET(req: NextRequest) {
  const cfg = getGoogleOAuthConfig();
  const isCheck = req.nextUrl.searchParams.get("check") === "1";

  if (!cfg.clientId || !cfg.clientSecret) {
    if (isCheck) {
      return NextResponse.json({ configured: false, mode: "first-party" });
    }
    const target = new URL("/account", req.nextUrl.origin);
    target.searchParams.set("oauth_error", "google_not_configured");
    return NextResponse.redirect(target);
  }

  if (isCheck) {
    return NextResponse.json({ configured: true, mode: "first-party" });
  }

  const origin = getRequestOrigin(req);
  const redirectUri = `${origin}/api/auth/google/callback`;
  const state = crypto.randomBytes(24).toString("hex");

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", cfg.clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("state", state);
  googleAuthUrl.searchParams.set("prompt", "select_account");

  const res = NextResponse.redirect(googleAuthUrl.toString());
  res.cookies.set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return res;
}
