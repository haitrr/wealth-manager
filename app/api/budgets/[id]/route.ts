import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { getPeriodBounds, computeProgress } from "../budget-utils";

async function getBudgetWithProgress(budgetId: string, userId: string) {
  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, userId },
    include: {
      account: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, type: true } },
    },
  });
  if (!budget) return null;

  const now = new Date();
  const { start, end } = getPeriodBounds(budget, now);
  const spent = await prisma.transaction.aggregate({
    where: {
      userId,
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
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const budget = await getBudgetWithProgress(id, session.userId);
  if (!budget) return NextResponse.json({ error: "Budget not found" }, { status: 404 });

  return NextResponse.json(budget);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.budget.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return NextResponse.json({ error: "Budget not found" }, { status: 404 });

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

  await prisma.budget.update({
    where: { id },
    data: {
      name: name.trim(),
      amount: parseFloat(amount),
      period,
      startDate: new Date(startDate ?? existing.startDate),
      endDate: period === "custom" ? new Date(endDate) : null,
      accountId: accountId || null,
      categoryId: categoryId || null,
    },
  });

  const budget = await getBudgetWithProgress(id, session.userId);
  return NextResponse.json(budget);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.budget.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return NextResponse.json({ error: "Budget not found" }, { status: 404 });

  await prisma.budget.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
