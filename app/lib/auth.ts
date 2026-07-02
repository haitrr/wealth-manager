import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import type { NextRequest } from "next/server";
import { prisma } from "./db";
import {
  COOKIE_NAME,
  SESSION_MAX_AGE,
  getCookieOptions,
} from "./session-config";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-in-production"
);

export { COOKIE_NAME };
export const COOKIE_OPTIONS = getCookieOptions();

export async function signToken(payload: { userId: string; email: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, SECRET);
  return payload as { userId: string; email: string };
}

export async function getSession(req?: NextRequest) {
  // API key via Authorization header
  if (req) {
    const auth = req.headers.get("authorization");
    if (auth?.startsWith("Bearer wm_")) {
      const keyHash = createHash("sha256").update(auth.slice(7)).digest("hex");
      const apiKey = await prisma.apiKey.findUnique({ where: { keyHash } });
      if (!apiKey) return null;
      await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });
      const user = await prisma.user.findUnique({
        where: { id: apiKey.userId },
        select: { id: true, email: true, settings: { select: { timezone: true } } },
      });
      if (!user) return null;
      return { userId: user.id, email: user.email, timezone: user.settings?.timezone ?? "UTC" };
    }
  }

  // Cookie-based auth
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, settings: { select: { timezone: true } } },
    });
    if (!user) return null;
    return { userId: user.id, email: user.email, timezone: user.settings?.timezone ?? "UTC" };
  } catch {
    return null;
  }
}
