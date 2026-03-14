import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { getPeriodBounds } from "../../budget-utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const budget = await prisma.budget.findFirst({ where: { id, userId: session.userId } });
  if (!budget) return NextResponse.json({ error: "Budget not found" }, { status: 404 });

  const { start, end } = getPeriodBounds(budget, new Date());

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.userId,
      date: { gte: start, lte: end },
      ...(budget.accountId ? { accountId: budget.accountId } : {}),
      ...(budget.categoryId
        ? { categoryId: budget.categoryId }
        : { category: { type: { in: ["expense", "payable"] } } }),
    },
    include: {
      account: { select: { id: true, name: true, currency: true } },
      category: { select: { id: true, name: true, type: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(transactions);
}
