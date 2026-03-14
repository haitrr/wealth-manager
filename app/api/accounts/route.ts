import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accounts = await prisma.account.findMany({
    where: { userId: session.userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(accounts);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, balance, currency } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const existingCount = await prisma.account.count({ where: { userId: session.userId } });
  const isFirst = existingCount === 0;

  const account = await prisma.account.create({
    data: {
      name: name.trim(),
      balance: balance ?? 0,
      currency: currency ?? "USD",
      isDefault: isFirst,
      userId: session.userId,
    },
  });

  return NextResponse.json(account, { status: 201 });
}
