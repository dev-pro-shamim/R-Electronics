import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  getAdminSessionFromRequest,
  hashPassword,
  verifyAdminPassword,
} from "@/lib/adminAuth";
import { appendAuditLog, readAdminDb, writeAdminDb } from "@/lib/adminDb";
import { AdminRoleName, AdminUserAccount } from "@/types/admin";

export async function GET(req: NextRequest) {
  const session = getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
  return NextResponse.json({
    authenticated: true,
    email: session.email,
    role: session.role,
    name: session.name,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    const db = readAdminDb();
    const matchedUser = (db.adminUsers || []).find(
      (u) => u.email.toLowerCase() === email
    );

    if (!matchedUser) {
      return NextResponse.json(
        { error: "Invalid administrator email or password." },
        { status: 401 }
      );
    }

    if (!matchedUser.active) {
      return NextResponse.json(
        { error: "This administrator account is disabled. Contact Super Admin." },
        { status: 403 }
      );
    }

    const passwordMatches = verifyAdminPassword(password, matchedUser);

    if (!passwordMatches) {
      return NextResponse.json(
        { error: "Invalid administrator email or password." },
        { status: 401 }
      );
    }

    const nowIso = new Date().toISOString();
    const updatedUsers = (db.adminUsers || []).map((u) =>
      u.id === matchedUser.id ? { ...u, lastLoginAt: nowIso } : u
    );

    const token = createAdminSessionToken(
      matchedUser.email,
      matchedUser.role,
      matchedUser.name
    );

    const updatedDb = appendAuditLog(
      { ...db, adminUsers: updatedUsers },
      matchedUser.email,
      "Security",
      `Signed in to Enterprise Admin (${matchedUser.role})`,
      matchedUser.role
    );
    writeAdminDb(updatedDb);

    const res = NextResponse.json({
      authenticated: true,
      email: matchedUser.email,
      role: matchedUser.role,
      name: matchedUser.name,
    });

    const isHttps =
      req.nextUrl.protocol === "https:" ||
      req.headers.get("x-forwarded-proto") === "https";

    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isHttps,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err) {
    console.error("Admin Auth POST error:", err);
    return NextResponse.json(
      { error: "Invalid request payload" },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const db = readAdminDb();

    // Super Admin user creation/role/status management
    if (body.action === "upsert_user") {
      if (session.role !== "Super Admin") {
        return NextResponse.json(
          { error: "Only Super Admin can manage admin users." },
          { status: 403 }
        );
      }
      const targetEmail = String(body.email || "").trim().toLowerCase();
      const targetName = String(body.name || "").trim();
      const targetRole = (body.role || "Order Manager") as AdminRoleName;
      const targetActive = body.active !== false;
      const rawPassword = String(body.password || "");

      if (!targetEmail || !targetName) {
        return NextResponse.json(
          { error: "Name and email are required." },
          { status: 400 }
        );
      }

      const existing = (db.adminUsers || []).find(
        (u) => u.id === body.id || u.email.toLowerCase() === targetEmail
      );

      let nextUsers: AdminUserAccount[];
      if (existing) {
        nextUsers = db.adminUsers.map((u) =>
          u.id === existing.id
            ? {
                ...u,
                name: targetName,
                email: targetEmail,
                role: targetRole,
                active: targetActive,
                passwordHash:
                  rawPassword.length >= 6
                    ? hashPassword(rawPassword)
                    : u.passwordHash,
              }
            : u
        );
      } else {
        if (rawPassword.length < 6) {
          return NextResponse.json(
            { error: "Password must be at least 6 characters for new users." },
            { status: 400 }
          );
        }
        const created: AdminUserAccount = {
          id: `usr-${Date.now()}`,
          name: targetName,
          email: targetEmail,
          role: targetRole,
          active: targetActive,
          passwordHash: hashPassword(rawPassword),
          createdAt: new Date().toISOString(),
        };
        nextUsers = [...(db.adminUsers || []), created];
      }

      const logged = appendAuditLog(
        { ...db, adminUsers: nextUsers },
        session.email,
        "Admin Users",
        `${existing ? "Updated" : "Created"} admin user ${targetEmail} (${targetRole})`,
        session.role
      );
      writeAdminDb(logged);

      return NextResponse.json({
        success: true,
        adminUsers: logged.adminUsers.map(({ passwordHash: _pw, ...safe }) => safe),
      });
    }

    if (body.action === "delete_user") {
      if (session.role !== "Super Admin") {
        return NextResponse.json(
          { error: "Only Super Admin can remove admin users." },
          { status: 403 }
        );
      }
      const id = String(body.id || "");
      const target = (db.adminUsers || []).find((u) => u.id === id);
      if (!target) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }
      if (target.email.toLowerCase() === session.email.toLowerCase()) {
        return NextResponse.json(
          { error: "You cannot delete your own logged-in account." },
          { status: 400 }
        );
      }
      const nextUsers = db.adminUsers.filter((u) => u.id !== id);
      const logged = appendAuditLog(
        { ...db, adminUsers: nextUsers },
        session.email,
        "Admin Users",
        `Removed admin user ${target.email}`,
        session.role
      );
      writeAdminDb(logged);
      return NextResponse.json({
        success: true,
        adminUsers: logged.adminUsers.map(({ passwordHash: _pw, ...safe }) => safe),
      });
    }

    // Self password change
    const { currentPassword, newPassword } = body;
    const me = (db.adminUsers || []).find(
      (u) => u.email.toLowerCase() === session.email.toLowerCase()
    );

    if (!me || hashPassword(String(currentPassword || "")) !== me.passwordHash) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 }
      );
    }

    if (!newPassword || String(newPassword).length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const updatedUsers = db.adminUsers.map((u) =>
      u.id === me.id ? { ...u, passwordHash: hashPassword(String(newPassword)) } : u
    );

    const updated = appendAuditLog(
      { ...db, adminUsers: updatedUsers },
      session.email,
      "Security",
      "Updated administrator password",
      session.role
    );
    writeAdminDb(updated);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ authenticated: false });
  res.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
