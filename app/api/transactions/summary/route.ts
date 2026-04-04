import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const startParam = searchParams.get("startDate");
  const endParam = searchParams.get("endDate");

  const now = new Date();
  const start = startParam ? new Date(startParam) : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = endParam ? new Date(endParam) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.userId,
      date: { gte: start, lte: end },
    },
    include: { category: { select: { id: true, name: true, type: true, parentId: true, parent: { select: { id: true, name: true } } } } },
    orderBy: { date: "asc" },
  });

  let totalIncome = 0;
  let totalExpenses = 0;

  // Build daily balance data
  const dailyData: { date: string; balance: number; income: number; expenses: number }[] = [];
  let cumulativeBalance = 0;

  // Group transactions by date
  const txByDate = new Map<string, { income: number; expenses: number }>();

  // Group by category
  const incomeByCategory = new Map<string, { name: string; amount: number }>();
  const expensesByCategory = new Map<string, { name: string; amount: number }>();

  for (const tx of transactions) {
    const dateKey = tx.date.toISOString().split("T")[0];
    const isIncome = tx.category.type === "income" || tx.category.type === "receivable";

    if (!txByDate.has(dateKey)) {
      txByDate.set(dateKey, { income: 0, expenses: 0 });
    }

    const dayData = txByDate.get(dateKey)!;
    // Roll up to parent category if one exists
    const groupId = tx.category.parent?.id ?? tx.category.id;
    const groupName = tx.category.parent?.name ?? tx.category.name;

    if (isIncome) {
      dayData.income += tx.amount;
      totalIncome += tx.amount;

      if (!incomeByCategory.has(groupId)) {
        incomeByCategory.set(groupId, { name: groupName, amount: 0 });
      }
      incomeByCategory.get(groupId)!.amount += tx.amount;
    } else {
      dayData.expenses += tx.amount;
      totalExpenses += tx.amount;

      if (!expensesByCategory.has(groupId)) {
        expensesByCategory.set(groupId, { name: groupName, amount: 0 });
      }
      expensesByCategory.get(groupId)!.amount += tx.amount;
    }
  }

  // Create daily data points
  const currentDate = new Date(start);
  const maxDate = now > end ? end : now;

  while (currentDate <= maxDate) {
    const dateKey = currentDate.toISOString().split("T")[0];
    const dayData = txByDate.get(dateKey);

    if (dayData) {
      cumulativeBalance += dayData.income - dayData.expenses;
      dailyData.push({
        date: dateKey,
        balance: cumulativeBalance,
        income: dayData.income,
        expenses: dayData.expenses,
      });
    } else {
      // Include all days (including before first transaction) to show balance from 0
      dailyData.push({
        date: dateKey,
        balance: cumulativeBalance,
        income: 0,
        expenses: 0,
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return NextResponse.json({
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    month: start.toLocaleDateString("en-US", { month: "short", year: "numeric" }) +
      (start.getMonth() !== end.getMonth() || start.getFullYear() !== end.getFullYear()
        ? " – " + end.toLocaleDateString("en-US", { month: "short", year: "numeric" })
        : ""),
    dailyData,
    incomeByCategory: Array.from(incomeByCategory.values()),
    expensesByCategory: Array.from(expensesByCategory.values()),
  });
}
