import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import {
  ensureLoanInitialCategory,
  ensureOwnedAccount,
  getOwnedLoan,
  LOAN_INCLUDE,
  parseLoanPayload,
  serializeLoan,
} from "../loan-route-utils";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const loan = await getOwnedLoan(id, session.userId);
  if (!loan) return NextResponse.json({ error: "Loan not found" }, { status: 404 });

  return NextResponse.json(serializeLoan(loan));
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const existing = await getOwnedLoan(id, session.userId);
    if (!existing) return NextResponse.json({ error: "Loan not found" }, { status: 404 });

    const parsed = parseLoanPayload(await req.json());
    const { principalAmount, ...loanData } = parsed;

    const account = await ensureOwnedAccount(loanData.accountId, session.userId);
    if (account.currency !== loanData.currency) {
      throw new Error("Loan and account must use the same currency");
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (existing.initialTransactionId) {
        await tx.transaction.update({
          where: { id: existing.initialTransactionId },
          data: { amount: principalAmount, date: loanData.startDate },
        });
      } else {
        const category = await ensureLoanInitialCategory(tx, session.userId, loanData.direction);
        const initialTx = await tx.transaction.create({
          data: {
            amount: principalAmount,
            date: loanData.startDate,
            description: `${loanData.name} - initial`,
            accountId: loanData.accountId,
            categoryId: category.id,
            userId: session.userId,
          },
        });
        await tx.loan.update({ where: { id }, data: { initialTransactionId: initialTx.id } });
      }
      return tx.loan.update({ where: { id }, data: loanData, include: LOAN_INCLUDE });
    });

    return NextResponse.json(serializeLoan(updated));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update loan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const loan = await getOwnedLoan(id, session.userId);
  if (!loan) return NextResponse.json({ error: "Loan not found" }, { status: 404 });

  await prisma.loan.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
