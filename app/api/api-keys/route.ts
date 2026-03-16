import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";

function hashKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.userId },
    select: { id: true, name: true, prefix: true, createdAt: true, lastUsedAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(keys);
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const raw = `wm_${randomBytes(24).toString("hex")}`;
  const prefix = raw.slice(0, 10); // "wm_" + 7 chars

  const apiKey = await prisma.apiKey.create({
    data: {
      name: name.trim(),
      keyHash: hashKey(raw),
      prefix,
      userId: session.userId,
    },
  });

  return NextResponse.json({ id: apiKey.id, name: apiKey.name, prefix, key: raw }, { status: 201 });
}
