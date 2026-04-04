import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const search = searchParams.get("search")?.trim();
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "30"), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  if (search) {
    const pattern = `%${search}%`;
    const rows = await prisma.$queryRaw<unknown[]>`
      SELECT
        t.id, t.amount, t.date, t.description, t.details,
        t."accountId", t."categoryId", t."userId", t."createdAt", t."updatedAt",
        json_build_object('id', a.id, 'name', a.name, 'currency', a.currency::text) AS account,
        json_build_object('id', c.id, 'name', c.name, 'type', c.type::text, 'icon', c.icon) AS category
      FROM "Transaction" t
      JOIN "Account" a ON t."accountId" = a.id
      JOIN "TransactionCategory" c ON t."categoryId" = c.id
      WHERE t."userId" = ${session.userId}
        AND (
          t.description ILIKE ${pattern}
          OR t.details ILIKE ${pattern}
          OR c.name ILIKE ${pattern}
          OR CAST(t.amount AS TEXT) ILIKE ${pattern}
          OR TO_CHAR(t.date AT TIME ZONE 'UTC', 'FMDD FMMonth Mon YYYY') ILIKE ${pattern}
        )
      ORDER BY t.date DESC, t."createdAt" DESC
      LIMIT ${limit + 1} OFFSET ${offset}
    `;
    const hasMore = rows.length > limit;
    return NextResponse.json({ data: hasMore ? rows.slice(0, limit) : rows, hasMore });
  }

  const rows = await prisma.transaction.findMany({
    where: {
      userId: session.userId,
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
    },
    include: {
      account: { select: { id: true, name: true, currency: true } },
      category: { select: { id: true, name: true, type: true, icon: true } },
      loanPaymentPrincipal: { select: { id: true, loanId: true, loan: { select: { id: true, name: true } } } },
      loanPaymentInterest: { select: { id: true, loanId: true, loan: { select: { id: true, name: true } } } },
      loanPaymentPrepayFee: { select: { id: true, loanId: true, loan: { select: { id: true, name: true } } } },
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: limit + 1,
    skip: offset,
  });

  const hasMore = rows.length > limit;
  return NextResponse.json({ data: hasMore ? rows.slice(0, limit) : rows, hasMore });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount, date, description, details, accountId, categoryId } = await req.json();

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
      details: details?.trim() || null,
      accountId,
      categoryId,
      userId: session.userId,
    },
    include: {
      account: { select: { id: true, name: true, currency: true } },
      category: { select: { id: true, name: true, type: true, icon: true } },
      loanPaymentPrincipal: { select: { id: true, loanId: true, loan: { select: { id: true, name: true } } } },
      loanPaymentInterest: { select: { id: true, loanId: true, loan: { select: { id: true, name: true } } } },
      loanPaymentPrepayFee: { select: { id: true, loanId: true, loan: { select: { id: true, name: true } } } },
    },
  });

  return NextResponse.json(transaction, { status: 201 });
}
