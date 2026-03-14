import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.userId,
      date: { gte: start, lte: end },
    },
    include: { category: { select: { id: true, name: true, type: true } } },
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
    if (isIncome) {
      dayData.income += tx.amount;
      totalIncome += tx.amount;

      // Income by category
      if (!incomeByCategory.has(tx.category.id)) {
        incomeByCategory.set(tx.category.id, { name: tx.category.name, amount: 0 });
      }
      incomeByCategory.get(tx.category.id)!.amount += tx.amount;
    } else {
      dayData.expenses += tx.amount;
      totalExpenses += tx.amount;

      // Expenses by category
      if (!expensesByCategory.has(tx.category.id)) {
        expensesByCategory.set(tx.category.id, { name: tx.category.name, amount: 0 });
      }
      expensesByCategory.get(tx.category.id)!.amount += tx.amount;
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
    } else if (dailyData.length > 0) {
      // Include days with no transactions to show flat line
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
    month: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    dailyData,
    incomeByCategory: Array.from(incomeByCategory.values()),
    expensesByCategory: Array.from(expensesByCategory.values()),
  });
}
