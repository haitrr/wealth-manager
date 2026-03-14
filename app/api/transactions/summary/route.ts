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
    include: { category: { select: { type: true } } },
  });

  let totalIncome = 0;
  let totalExpenses = 0;

  for (const tx of transactions) {
    if (tx.category.type === "income" || tx.category.type === "receivable") {
      totalIncome += tx.amount;
    } else {
      totalExpenses += tx.amount;
    }
  }

  return NextResponse.json({
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    month: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  });
}
