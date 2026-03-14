import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { getPeriodBounds, computeProgress } from "./budget-utils";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const budgets = await prisma.budget.findMany({
    where: { userId: session.userId },
    include: {
      account: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, type: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();

  const result = await Promise.all(
    budgets.map(async (budget) => {
      const { start, end } = getPeriodBounds(budget, now);
      const spent = await prisma.transaction.aggregate({
        where: {
          userId: session.userId,
          date: { gte: start, lte: end },
          ...(budget.accountId ? { accountId: budget.accountId } : {}),
          ...(budget.categoryId
            ? { categoryId: budget.categoryId }
            : { category: { type: { in: ["expense", "payable"] } } }),
        },
        _sum: { amount: true },
      });
      const progress = computeProgress(budget, spent._sum.amount ?? 0, now);
      return { ...budget, ...progress };
    })
  );

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, amount, period, startDate, endDate, accountId, categoryId } = await req.json();

  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!amount || amount <= 0) return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
  if (!["monthly", "yearly", "custom"].includes(period)) {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  }
  if (period === "custom" && (!startDate || !endDate)) {
    return NextResponse.json({ error: "Start and end dates required for custom period" }, { status: 400 });
  }

  if (accountId) {
    const account = await prisma.account.findFirst({ where: { id: accountId, userId: session.userId } });
    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }
  if (categoryId) {
    const category = await prisma.transactionCategory.findFirst({ where: { id: categoryId, userId: session.userId } });
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const budget = await prisma.budget.create({
    data: {
      name: name.trim(),
      amount: parseFloat(amount),
      period,
      startDate: new Date(startDate ?? new Date()),
      endDate: period === "custom" ? new Date(endDate) : null,
      accountId: accountId || null,
      categoryId: categoryId || null,
      userId: session.userId,
    },
    include: {
      account: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, type: true } },
    },
  });

  const now = new Date();
  const { start, end } = getPeriodBounds(budget, now);
  const spent = await prisma.transaction.aggregate({
    where: {
      userId: session.userId,
      date: { gte: start, lte: end },
      ...(budget.accountId ? { accountId: budget.accountId } : {}),
      ...(budget.categoryId
        ? { categoryId: budget.categoryId }
        : { category: { type: { in: ["expense", "payable"] } } }),
    },
    _sum: { amount: true },
  });
  const progress = computeProgress(budget, spent._sum.amount ?? 0, now);

  return NextResponse.json({ ...budget, ...progress }, { status: 201 });
}
