import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import {
  getPeriodBounds,
  computeProgress,
  convertCurrency,
  getCategoryFilter,
  resolveCategorySummaries,
} from "./budget-utils";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const budgets = await prisma.budget.findMany({
    where: { userId: session.userId },
    include: { account: { select: { id: true, name: true, currency: true } } },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();

  const result = await Promise.all(
    budgets.map(async (budget) => {
      const { start, end } = getPeriodBounds(budget, now);
      const categoryFilter = await getCategoryFilter(budget, session.userId);

      const transactions = await prisma.transaction.findMany({
        where: {
          userId: session.userId,
          date: { gte: start, lte: end },
          ...(budget.accountId ? { accountId: budget.accountId } : {}),
          ...categoryFilter,
        },
        include: { account: { select: { currency: true } } },
      });

      let spent = 0;
      for (const tx of transactions) {
        spent += await convertCurrency(tx.amount, tx.account.currency, budget.currency, session.userId);
      }

      const [categories, excludedCategories] = await Promise.all([
        resolveCategorySummaries(budget.categoryIds),
        resolveCategorySummaries(budget.excludedCategoryIds),
      ]);

      const progress = computeProgress(budget, spent, now);
      return { ...budget, categories, excludedCategories, ...progress };
    })
  );

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const resolvedCategoryIds: string[] = Array.isArray(categoryIds) ? categoryIds : [];
  const resolvedExcludedIds: string[] = Array.isArray(excludedCategoryIds) ? excludedCategoryIds : [];

  const budget = await prisma.budget.create({
    data: {
      name: name.trim(),
      amount: parseFloat(amount),
      currency: currency || "USD",
      period,
      startDate: new Date(startDate ?? new Date()),
      endDate: period === "custom" ? new Date(endDate) : null,
      accountId: accountId || null,
      categoryIds: resolvedCategoryIds,
      excludedCategoryIds: resolvedExcludedIds,
      userId: session.userId,
    },
    include: { account: { select: { id: true, name: true, currency: true } } },
  });

  const now = new Date();
  const { start, end } = getPeriodBounds(budget, now);
  const categoryFilter = await getCategoryFilter(budget, session.userId);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.userId,
      date: { gte: start, lte: end },
      ...(budget.accountId ? { accountId: budget.accountId } : {}),
      ...categoryFilter,
    },
    include: { account: { select: { currency: true } } },
  });

  let spent = 0;
  for (const tx of transactions) {
    spent += await convertCurrency(tx.amount, tx.account.currency, budget.currency, session.userId);
  }

  const [categories, excludedCategories] = await Promise.all([
    resolveCategorySummaries(budget.categoryIds),
    resolveCategorySummaries(budget.excludedCategoryIds),
  ]);

  const progress = computeProgress(budget, spent, now);
  return NextResponse.json({ ...budget, categories, excludedCategories, ...progress }, { status: 201 });
}
