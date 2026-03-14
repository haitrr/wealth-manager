import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.userId },
    include: {
      account: { select: { id: true, name: true, currency: true } },
      category: { select: { id: true, name: true, type: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount, date, description, accountId, categoryId } = await req.json();

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
  }
  if (!date) {
    return NextResponse.json({ error: "Date is required" }, { status: 400 });
  }
  if (!accountId) {
    return NextResponse.json({ error: "Account is required" }, { status: 400 });
  }
  if (!categoryId) {
    return NextResponse.json({ error: "Category is required" }, { status: 400 });
  }

  const account = await prisma.account.findFirst({ where: { id: accountId, userId: session.userId } });
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const category = await prisma.transactionCategory.findFirst({
    where: { id: categoryId, userId: session.userId },
  });
  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  const transaction = await prisma.transaction.create({
    data: {
      amount: parseFloat(amount),
      date: new Date(date),
      description: description?.trim() || null,
      accountId,
      categoryId,
      userId: session.userId,
    },
    include: {
      account: { select: { id: true, name: true, currency: true } },
      category: { select: { id: true, name: true, type: true } },
    },
  });

  return NextResponse.json(transaction, { status: 201 });
}
