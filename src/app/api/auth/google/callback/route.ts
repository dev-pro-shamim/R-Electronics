import { NextRequest, NextResponse } from "next/server";
import { getGoogleOAuthConfig } from "@/lib/serverSecrets";
import { readAdminDb, writeAdminDb } from "@/lib/adminDb";
import {
  attachCustomerSessionCookie,
  GOOGLE_STATE_COOKIE,
  getRequestOrigin,
} from "@/lib/customerAuth";
import { dispatchNotification, wrapRangoEmailTemplate } from "@/lib/notifications";
import { CustomerUserRecord } from "@/types/admin";

export async function GET(req: NextRequest) {
  const origin = getRequestOrigin(req);
  const accountUrl = new URL("/account", origin);

  const errParam = req.nextUrl.searchParams.get("error");
  if (errParam) {
    accountUrl.searchParams.set("oauth_error", errParam);
    return NextResponse.redirect(accountUrl);
  }

  const code = req.nextUrl.searchParams.get("code");
  const returnedState = req.nextUrl.searchParams.get("state");
  const expectedState = req.cookies.get(GOOGLE_STATE_COOKIE)?.value;

  if (!code || !returnedState || !expectedState || returnedState !== expectedState) {
    accountUrl.searchParams.set("oauth_error", "invalid_state");
    return NextResponse.redirect(accountUrl);
  }

  const cfg = getGoogleOAuthConfig();
  if (!cfg.clientId || !cfg.clientSecret) {
    accountUrl.searchParams.set("oauth_error", "google_not_configured");
    return NextResponse.redirect(accountUrl);
  }

  try {
    const redirectUri = `${origin}/api/auth/google/callback`;
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      accountUrl.searchParams.set("oauth_error", "token_exchange_failed");
      return NextResponse.redirect(accountUrl);
    }

    const tokens = await tokenRes.json();
    const accessToken = String(tokens.access_token || "");
    if (!accessToken) {
      accountUrl.searchParams.set("oauth_error", "missing_access_token");
      return NextResponse.redirect(accountUrl);
    }

    const userRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userRes.ok) {
      accountUrl.searchParams.set("oauth_error", "userinfo_failed");
      return NextResponse.redirect(accountUrl);
    }

    const profile = await userRes.json();
    const email = String(profile.email || "").trim().toLowerCase();
    const googleSub = String(profile.sub || "").trim();
    const fullName = String(profile.name || email.split("@")[0] || "Rango Customer").trim();
    const avatar = typeof profile.picture === "string" ? profile.picture : undefined;

    if (!email) {
      accountUrl.searchParams.set("oauth_error", "email_missing");
      return NextResponse.redirect(accountUrl);
    }

    const db = readAdminDb();
    const now = new Date().toISOString();
    let user = (db.customerUsers || []).find(
      (u) => u.email?.toLowerCase() === email || (googleSub && u.supabaseUserId === `google:${googleSub}`)
    );

    if (!user) {
      user = {
        id: `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        supabaseUserId: googleSub ? `google:${googleSub}` : undefined,
        fullName,
        email,
        avatar,
        provider: "google",
        addresses: [],
        createdAt: now,
        lastLoginAt: now,
      };
      const nextDb = {
        ...db,
        customerUsers: [user, ...(db.customerUsers || [])],
      };
      await dispatchNotification({
        eventKey: `cust-google-${user.id}`,
        eventType: "customer_registered",
        subject: `[New Google Customer] ${fullName} (${email})`,
        html: wrapRangoEmailTemplate(
          "New Customer Signed In via Google",
          "GOOGLE SIGN-IN",
          `<p><strong>Name:</strong> ${fullName}<br/><strong>Email:</strong> ${email}</p>`
        ),
        db: nextDb,
      });
      writeAdminDb(nextDb);
    } else {
      const updatedList = (db.customerUsers || []).map((u) =>
        u.id === user!.id
          ? {
              ...u,
              fullName: u.fullName || fullName,
              avatar: avatar || u.avatar,
              lastLoginAt: now,
            }
          : u
      );
      user = {
        ...user,
        fullName: user.fullName || fullName,
        avatar: avatar || user.avatar,
        lastLoginAt: now,
      };
      writeAdminDb({ ...db, customerUsers: updatedList });
    }

    const res = NextResponse.redirect(accountUrl);
    attachCustomerSessionCookie(res, user.id);
    res.cookies.delete(GOOGLE_STATE_COOKIE);
    return res;
  } catch (err) {
    console.error("First-party Google OAuth callback error:", err);
    accountUrl.searchParams.set("oauth_error", "callback_exception");
    return NextResponse.redirect(accountUrl);
  }
}
