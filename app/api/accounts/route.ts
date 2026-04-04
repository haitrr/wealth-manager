import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accounts = await prisma.account.findMany({
    where: { userId: session.userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    include: {
      transactions: {
        include: { category: { select: { type: true } } },
      },
    },
  });

  const result = accounts.map(({ transactions, ...account }) => {
    const balance = transactions.reduce((sum, tx) => {
      const isIncome = tx.category.type === "income";
      return sum + (isIncome ? tx.amount : -tx.amount);
    }, 0);
    return { ...account, balance };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, currency } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const existingCount = await prisma.account.count({ where: { userId: session.userId } });
  const isFirst = existingCount === 0;

  const account = await prisma.account.create({
    data: {
      name: name.trim(),
      balance: 0,
      currency: currency ?? "USD",
      isDefault: isFirst,
      userId: session.userId,
    },
  });

  return NextResponse.json({ ...account, balance: 0 }, { status: 201 });
}
