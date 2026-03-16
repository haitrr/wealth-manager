import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";

async function getOwnedTransaction(transactionId: string, userId: string) {
  return prisma.transaction.findFirst({ where: { id: transactionId, userId } });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const transaction = await getOwnedTransaction(id, session.userId);
  if (!transaction) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { amount, date, description, accountId, categoryId } = await req.json();

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

  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      amount: parseFloat(amount),
      date: new Date(date),
      description: description?.trim() || null,
      accountId,
      categoryId,
    },
    include: {
      account: { select: { id: true, name: true, currency: true } },
      category: { select: { id: true, name: true, type: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const transaction = await getOwnedTransaction(id, session.userId);
  if (!transaction) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.transaction.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
