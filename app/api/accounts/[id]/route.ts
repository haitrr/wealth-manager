import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";

async function getOwnedAccount(accountId: string, userId: string) {
  return prisma.account.findFirst({ where: { id: accountId, userId } });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const account = await getOwnedAccount(id, session.userId);
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, currency } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const updated = await prisma.account.update({
    where: { id },
    data: {
      name: name.trim(),
      currency: currency ?? account.currency,
    },
    include: {
      transactions: {
        include: { category: { select: { type: true } } },
      },
    },
  });

  const { transactions, ...rest } = updated;
  const balance = transactions.reduce((sum: number, tx: { amount: number; category: { type: string } }) => {
    const isIncome = tx.category.type === "income" || tx.category.type === "receivable";
    return sum + (isIncome ? tx.amount : -tx.amount);
  }, 0);

  return NextResponse.json({ ...rest, balance });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const account = await getOwnedAccount(id, session.userId);
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.account.delete({ where: { id } });

  // If deleted account was default, set the next account as default
  if (account.isDefault) {
    const next = await prisma.account.findFirst({
      where: { userId: session.userId },
      orderBy: { createdAt: "asc" },
    });
    if (next) await prisma.account.update({ where: { id: next.id }, data: { isDefault: true } });
  }

  return NextResponse.json({ success: true });
}
