import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import {
  getPeriodBounds,
  computeProgress,
  convertCurrency,
  getCategoryFilter,
  resolveCategorySummaries,
} from "../budget-utils";

async function getBudgetWithProgress(budgetId: string, userId: string) {
  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, userId },
    include: { account: { select: { id: true, name: true, currency: true } } },
  });
  if (!budget) return null;

  const now = new Date();
  const { start, end } = getPeriodBounds(budget, now);
  const categoryFilter = await getCategoryFilter(budget, userId);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: start, lte: end },
      ...(budget.accountId ? { accountId: budget.accountId } : {}),
      ...categoryFilter,
    },
    include: { account: { select: { currency: true } } },
  });

  let spent = 0;
  for (const tx of transactions) {
    spent += await convertCurrency(tx.amount, tx.account.currency, budget.currency, userId);
  }

  const [categories, excludedCategories] = await Promise.all([
    resolveCategorySummaries(budget.categoryIds),
    resolveCategorySummaries(budget.excludedCategoryIds),
  ]);

  const progress = computeProgress(budget, spent, now);
  return { ...budget, categories, excludedCategories, ...progress };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const budget = await getBudgetWithProgress(id, session.userId);
  if (!budget) return NextResponse.json({ error: "Budget not found" }, { status: 404 });

  return NextResponse.json(budget);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.budget.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return NextResponse.json({ error: "Budget not found" }, { status: 404 });

  const { name, amount, currency, period, startDate, endDate, accountId, categoryIds, excludedCategoryIds } =
    await req.json();

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

  await prisma.budget.update({
    where: { id },
    data: {
      name: name.trim(),
      amount: parseFloat(amount),
      currency: currency || existing.currency,
      period,
      startDate: new Date(startDate ?? existing.startDate),
      endDate: period === "custom" ? new Date(endDate) : null,
      accountId: accountId || null,
      categoryIds: Array.isArray(categoryIds) ? categoryIds : [],
      excludedCategoryIds: Array.isArray(excludedCategoryIds) ? excludedCategoryIds : [],
    },
  });

  const budget = await getBudgetWithProgress(id, session.userId);
  return NextResponse.json(budget);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.budget.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return NextResponse.json({ error: "Budget not found" }, { status: 404 });

  await prisma.budget.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
