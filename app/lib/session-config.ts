// Edge-safe session/cookie config shared by auth helpers and middleware.
// Keep this file free of `next/headers`, Prisma, or other Node-only imports so
// it can be used inside Next.js middleware (edge runtime).

export const COOKIE_NAME = "auth-token";

// Sliding session: a token is valid for SESSION_MAX_AGE, and middleware
// re-issues it on activity once it is older than SESSION_REFRESH_AFTER. This
// keeps actively-used sessions alive indefinitely while still expiring after a
// period of inactivity.
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days (seconds)
export const SESSION_REFRESH_AFTER = 60 * 60 * 24; // 1 day (seconds)

export function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax" as const,
    maxAge: SESSION_MAX_AGE,
    path: "/",
  };
}
