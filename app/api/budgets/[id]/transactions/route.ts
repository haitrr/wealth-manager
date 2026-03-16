import { NextRequest, NextResponse } from "next/server";
import { CategoryType } from "@prisma/client";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { getPeriodBounds, getCategoryIdWithDescendants } from "../../budget-utils";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const budget = await prisma.budget.findFirst({ where: { id, userId: session.userId } });
  if (!budget) return NextResponse.json({ error: "Budget not found" }, { status: 404 });

  const { start, end } = getPeriodBounds(budget, new Date());

  const categoryIds = budget.categoryId
    ? await getCategoryIdWithDescendants(budget.categoryId, session.userId)
    : null;

  const baseWhere = {
    userId: session.userId,
    date: { gte: start, lte: end },
    ...(budget.accountId ? { accountId: budget.accountId } : {}),
  };

  const transactions = await prisma.transaction.findMany({
    where: categoryIds
      ? { ...baseWhere, categoryId: { in: categoryIds } }
      : { ...baseWhere, category: { is: { type: { in: ["expense", "payable"] as CategoryType[] } } } },
    include: {
      account: { select: { id: true, name: true, currency: true } },
      category: { select: { id: true, name: true, type: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(transactions);
}
