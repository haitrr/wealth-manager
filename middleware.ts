import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import {
  COOKIE_NAME,
  SESSION_MAX_AGE,
  SESSION_REFRESH_AFTER,
  getCookieOptions,
} from "@/app/lib/session-config";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-in-production"
);

const PUBLIC_PATHS = ["/login", "/register", "/api/auth", "/api/mcp"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  if (isPublic) return NextResponse.next();

  // API key via Authorization header — let the route handler verify it
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer wm_")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("auth-token")?.value;
  const isApiRoute = pathname.startsWith("/api");

  if (!token) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const res = NextResponse.next();

    // Sliding session: re-issue the token on activity once it's older than
    // SESSION_REFRESH_AFTER, so actively-used sessions never expire out from
    // under the user. `exp` is set to now + SESSION_MAX_AGE at issue time, so
    // the token's age is SESSION_MAX_AGE - (exp - now).
    const now = Math.floor(Date.now() / 1000);
    const exp = typeof payload.exp === "number" ? payload.exp : 0;
    const tokenAge = SESSION_MAX_AGE - (exp - now);
    if (tokenAge > SESSION_REFRESH_AFTER) {
      const newToken = await new SignJWT({
        userId: payload.userId,
        email: payload.email,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime(now + SESSION_MAX_AGE)
        .sign(SECRET);
      res.cookies.set(COOKIE_NAME, newToken, getCookieOptions());
    }

    return res;
  } catch {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/).*)"],
};
