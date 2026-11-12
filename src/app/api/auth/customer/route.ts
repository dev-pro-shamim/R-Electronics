import { NextRequest, NextResponse } from "next/server";
import { readAdminDb, readAdminDbCached, writeAdminDb } from "@/lib/adminDb";
import { dispatchNotification, wrapRangoEmailTemplate } from "@/lib/notifications";
import { CustomerUserRecord } from "@/types/admin";
import {
  CUSTOMER_COOKIE,
  hashCustomerPassword,
  verifyCustomerPassword,
  verifyCustomerToken,
  sanitizeCustomer,
  attachCustomerSessionCookie as attachSessionCookie,
} from "@/lib/customerAuth";

// Ephemeral OTP map for phone login verification
const pendingOtps = new Map<string, { code: string; expiresAt: number }>();

export async function GET(req: NextRequest) {
  const token = req.cookies.get(CUSTOMER_COOKIE)?.value;
  const verified = verifyCustomerToken(token);
  if (!verified) {
    return NextResponse.json({ user: null });
  }
  const db = readAdminDbCached();
  const user = (db.customerUsers || []).find((u) => u.id === verified.uid);
  if (!user) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({ user: sanitizeCustomer(user) });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action || "");
    const db = readAdminDb();

    if (action === "logout") {
      const res = NextResponse.json({ success: true });
      res.cookies.delete(CUSTOMER_COOKIE);
      return res;
    }

    if (action === "register") {
      const fullName = String(body.fullName || "").trim();
      const email = String(body.email || "").trim().toLowerCase();
      const phone = String(body.phone || "").trim();
      const password = String(body.password || "");

      if (!fullName || !email || !email.includes("@")) {
        return NextResponse.json(
          { error: "Full name and a valid email address are required." },
          { status: 400 }
        );
      }
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters long." },
          { status: 400 }
        );
      }

      const duplicate = (db.customerUsers || []).find(
        (u) => u.email?.toLowerCase() === email || (phone && u.phone === phone)
      );
      if (duplicate) {
        return NextResponse.json(
          { error: "An account with this email or phone already exists. Please sign in." },
          { status: 409 }
        );
      }

      // Sync with Supabase Auth if configured (best-effort; never silently breaks registration)
      let supabaseUserId: string | undefined;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (supabaseUrl && supabaseKey) {
        try {
          const sbRes = await fetch(`${supabaseUrl}/auth/v1/signup`, {
            method: "POST",
            headers: {
              apikey: supabaseKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              password,
              data: { full_name: fullName, phone },
            }),
            signal: AbortSignal.timeout(3000),
          });
          const sbData = await sbRes.json();
          if (sbData?.user?.id || sbData?.id) {
            supabaseUserId = sbData?.user?.id || sbData?.id;
          }
        } catch {
          // Proceed with local auth vault cleanly
        }
      }

      const now = new Date().toISOString();
      const newCustomer: CustomerUserRecord = {
        id: `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        supabaseUserId,
        fullName,
        email,
        phone: phone || undefined,
        provider: "email",
        passwordHash: hashCustomerPassword(password),
        addresses: [],
        createdAt: now,
        lastLoginAt: now,
      };

      const nextDb = {
        ...db,
        customerUsers: [newCustomer, ...(db.customerUsers || [])],
      };

      await dispatchNotification({
        eventKey: `cust-reg-${newCustomer.id}`,
        eventType: "customer_registered",
        subject: `[New Customer] ${fullName} (${email}) registered`,
        html: wrapRangoEmailTemplate(
          "New Customer Account Registered",
          "CUSTOMER SIGNUP",
          `<p><strong>Name:</strong> ${fullName}<br/>
          <strong>Email:</strong> ${email}<br/>
          <strong>Phone:</strong> ${phone || "Not provided"}<br/>
          <strong>Method:</strong> Email &amp; Password</p>`
        ),
        notifyAdmin: true,
        customerEmail: email,
        customerSubject: "Welcome to Rango Electronics!",
        customerHtml: wrapRangoEmailTemplate(
          `Welcome, ${fullName}!`,
          "ACCOUNT CREATED",
          `<p>Thank you for creating your account at <strong>Rango Electronics</strong>.</p><p>You can now track your orders, manage delivery addresses, save wishlist products, and enjoy 0% EMI shopping across Bangladesh.</p>`
        ),
        db: nextDb,
      });

      writeAdminDb(nextDb);

      const res = NextResponse.json({ user: sanitizeCustomer(newCustomer) });
      attachSessionCookie(res, newCustomer.id);
      return res;
    }

    if (action === "login") {
      const identifier = String(body.emailOrPhone || body.email || "").trim();
      const lower = identifier.toLowerCase();
      const password = String(body.password || "");

      if (!identifier || !password) {
        return NextResponse.json(
          { error: "Email/Phone and password are required." },
          { status: 400 }
        );
      }

      let user = (db.customerUsers || []).find(
        (u) => u.email?.toLowerCase() === lower || (u.phone && u.phone === identifier)
      );

      if (user) {
        if (!verifyCustomerPassword(password, user.passwordHash)) {
          return NextResponse.json(
            { error: "Invalid email/phone or password." },
            { status: 401 }
          );
        }
        const now = new Date().toISOString();
        const updatedList = (db.customerUsers || []).map((u) =>
          u.id === user!.id ? { ...u, lastLoginAt: now } : u
        );
        user = { ...user, lastLoginAt: now };
        writeAdminDb({ ...db, customerUsers: updatedList });
        const res = NextResponse.json({ user: sanitizeCustomer(user) });
        attachSessionCookie(res, user.id);
        return res;
      }

      // Check Supabase Auth if account exists only in Supabase
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (supabaseUrl && supabaseKey && lower.includes("@")) {
        try {
          const sbRes = await fetch(
            `${supabaseUrl}/auth/v1/token?grant_type=password`,
            {
              method: "POST",
              headers: {
                apikey: supabaseKey,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ email: lower, password }),
            }
          );
          const sbData = await sbRes.json();
          if (sbRes.ok && sbData?.user?.id) {
            const now = new Date().toISOString();
            const synced: CustomerUserRecord = {
              id: `cust-${Date.now()}`,
              supabaseUserId: sbData.user.id,
              fullName:
                sbData.user.user_metadata?.full_name ||
                sbData.user.email?.split("@")[0] ||
                "Customer",
              email: lower,
              phone: sbData.user.user_metadata?.phone || undefined,
              provider: "email",
              passwordHash: hashCustomerPassword(password),
              addresses: [],
              createdAt: now,
              lastLoginAt: now,
            };
            writeAdminDb({
              ...db,
              customerUsers: [synced, ...(db.customerUsers || [])],
            });
            const res = NextResponse.json({ user: sanitizeCustomer(synced) });
            attachSessionCookie(res, synced.id);
            return res;
          }
        } catch {
          // fall through to 401
        }
      }

      return NextResponse.json(
        { error: "Invalid email/phone or password." },
        { status: 401 }
      );
    }

    if (action === "send_otp") {
      const phone = String(body.phone || "").trim();
      if (!/^(\+?88)?01[3-9]\d{8}$/.test(phone.replace(/\s|-/g, ""))) {
        return NextResponse.json(
          { error: "Please enter a valid Bangladeshi mobile number (e.g., 017XXXXXXXX)." },
          { status: 400 }
        );
      }
      const normalized = phone.replace(/\s|-/g, "");
      const code = String(Math.floor(100000 + Math.random() * 900000));
      pendingOtps.set(normalized, {
        code,
        expiresAt: Date.now() + 1000 * 60 * 5,
      });

      return NextResponse.json({
        success: true,
        message: "Verification OTP sent to your mobile number.",
        // Shown in UI helper if SMS provider is in sandbox mode
        sandboxCode: process.env.SMS_API_KEY ? undefined : code,
      });
    }

    if (action === "verify_otp") {
      const phone = String(body.phone || "").replace(/\s|-/g, "").trim();
      const otp = String(body.otp || "").trim();
      const fullName = String(body.fullName || "").trim();
      const stored = pendingOtps.get(phone);

      if (!stored || stored.expiresAt < Date.now() || stored.code !== otp) {
        return NextResponse.json(
          { error: "Invalid or expired OTP code. Please request a new code." },
          { status: 401 }
        );
      }
      pendingOtps.delete(phone);

      const now = new Date().toISOString();
      let user = (db.customerUsers || []).find((u) => u.phone === phone);
      if (!user) {
        user = {
          id: `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          fullName: fullName || `Customer (${phone.slice(-4)})`,
          phone,
          provider: "phone",
          addresses: [],
          createdAt: now,
          lastLoginAt: now,
        };
        const nextDb = {
          ...db,
          customerUsers: [user, ...(db.customerUsers || [])],
        };
        await dispatchNotification({
          eventKey: `cust-reg-otp-${user.id}`,
          eventType: "customer_registered",
          subject: `[New Customer OTP] ${user.fullName} (${phone})`,
          html: wrapRangoEmailTemplate(
            "New Customer Verified via Mobile OTP",
            "CUSTOMER SIGNUP",
            `<p><strong>Name:</strong> ${user.fullName}<br/><strong>Phone:</strong> ${phone}</p>`
          ),
          db: nextDb,
        });
        writeAdminDb(nextDb);
      } else {
        const updatedList = (db.customerUsers || []).map((u) =>
          u.id === user!.id ? { ...u, lastLoginAt: now } : u
        );
        user = { ...user, lastLoginAt: now };
        writeAdminDb({ ...db, customerUsers: updatedList });
      }

      const res = NextResponse.json({ user: sanitizeCustomer(user) });
      attachSessionCookie(res, user.id);
      return res;
    }

    if (action === "sync_oauth") {
      const accessToken = String(body.accessToken || "").trim();
      if (!accessToken) {
        return NextResponse.json({ error: "Missing OAuth access token." }, { status: 400 });
      }
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json(
          { error: "Supabase Auth is not configured on the server." },
          { status: 500 }
        );
      }

      const sbRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!sbRes.ok) {
        return NextResponse.json({ error: "Invalid Google OAuth session token." }, { status: 401 });
      }
      const sbUser = await sbRes.json();
      const email = String(sbUser.email || "").toLowerCase();
      const fullName = String(
        sbUser.user_metadata?.full_name ||
          sbUser.user_metadata?.name ||
          email.split("@")[0] ||
          "Rango Customer"
      );
      const avatar = sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture;
      const now = new Date().toISOString();

      let user = (db.customerUsers || []).find(
        (u) => u.supabaseUserId === sbUser.id || (email && u.email?.toLowerCase() === email)
      );
      if (!user) {
        user = {
          id: `cust-${Date.now()}`,
          supabaseUserId: sbUser.id,
          fullName,
          email: email || undefined,
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
          eventKey: `cust-oauth-${user.id}`,
          eventType: "customer_registered",
          subject: `[New Google Customer] ${fullName} (${email})`,
          html: wrapRangoEmailTemplate(
            "New Customer Signed In via Google",
            "GOOGLE OAUTH",
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
                supabaseUserId: sbUser.id,
                avatar: avatar || u.avatar,
                lastLoginAt: now,
              }
            : u
        );
        user = { ...user, supabaseUserId: sbUser.id, avatar: avatar || user.avatar, lastLoginAt: now };
        writeAdminDb({ ...db, customerUsers: updatedList });
      }

      const res = NextResponse.json({ user: sanitizeCustomer(user) });
      attachSessionCookie(res, user.id);
      return res;
    }

    // Authenticated customer actions
    const token = req.cookies.get(CUSTOMER_COOKIE)?.value;
    const verified = verifyCustomerToken(token);
    if (!verified) {
      return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
    }
    const existing = (db.customerUsers || []).find((u) => u.id === verified.uid);
    if (!existing) {
      return NextResponse.json({ error: "Customer account not found." }, { status: 404 });
    }

    if (action === "add_address") {
      const addr = body.address;
      const newAddr = {
        id: `addr-${Date.now()}`,
        title: String(addr?.title || "Home"),
        fullName: String(addr?.fullName || existing.fullName || existing.name || "Customer"),
        phone: String(addr?.phoneNumber || addr?.phone || existing.phone || ""),
        phoneNumber: String(addr?.phoneNumber || addr?.phone || existing.phone || ""),
        city: String(addr?.city || "Dhaka"),
        area: String(addr?.area || ""),
        address: String(addr?.addressLine || addr?.address || ""),
        addressLine: String(addr?.addressLine || addr?.address || ""),
        isDefault: Boolean(addr?.isDefault) || existing.addresses.length === 0,
      };
      const updatedUser: CustomerUserRecord = {
        ...existing,
        addresses: [
          newAddr,
          ...existing.addresses.map((a) =>
            newAddr.isDefault ? { ...a, isDefault: false } : a
          ),
        ],
      };
      writeAdminDb({
        ...db,
        customerUsers: (db.customerUsers || []).map((u) =>
          u.id === existing.id ? updatedUser : u
        ),
      });
      return NextResponse.json({ user: sanitizeCustomer(updatedUser) });
    }

    if (action === "delete_address") {
      const addrId = String(body.addressId || "");
      const updatedUser: CustomerUserRecord = {
        ...existing,
        addresses: existing.addresses.filter((a) => a.id !== addrId),
      };
      writeAdminDb({
        ...db,
        customerUsers: (db.customerUsers || []).map((u) =>
          u.id === existing.id ? updatedUser : u
        ),
      });
      return NextResponse.json({ user: sanitizeCustomer(updatedUser) });
    }

    return NextResponse.json({ error: "Invalid auth action." }, { status: 400 });
  } catch (err) {
    console.error("Customer Auth API error:", err);
    return NextResponse.json({ error: "Authentication request failed." }, { status: 500 });
  }
}
