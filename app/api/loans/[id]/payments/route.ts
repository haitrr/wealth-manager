import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import {
  ensureLoanTransactionCategory,
  ensureOwnedAccount,
  getOwnedLoan,
  parseLoanPaymentPayload,
  serializeLoan,
  LOAN_INCLUDE,
} from "../../loan-route-utils";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const loan = await getOwnedLoan(id, session.userId);
    if (!loan) return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    if (loan.status === "closed") {
      return NextResponse.json({ error: "Closed loans cannot receive payments" }, { status: 400 });
    }

    const payload = parseLoanPaymentPayload(await req.json());
    const account = await ensureOwnedAccount(payload.accountId, session.userId);
    if (account.currency !== loan.currency) {
      return NextResponse.json({ error: "Loan and payment account must use the same currency" }, { status: 400 });
    }

    const paidPrincipal = loan.payments.reduce((sum, p) => sum + (p.principalTransaction?.amount ?? 0), 0);
    const remainingPrincipal = loan.principalAmount - paidPrincipal;
    if (payload.principalAmount > remainingPrincipal + 0.01) {
      return NextResponse.json({ error: "Principal payment exceeds remaining principal" }, { status: 400 });
    }

    const userSettings = await prisma.userSettings.findUnique({ where: { userId: session.userId } });
    const isBorrowed = loan.direction === "borrowed";
    const globalPrincipalCategoryId = isBorrowed
      ? userSettings?.loanBorrowedPrincipalCategoryId
      : userSettings?.loanLentPrincipalCategoryId;
    const globalInterestCategoryId = isBorrowed
      ? userSettings?.loanBorrowedInterestCategoryId
      : userSettings?.loanLentInterestCategoryId;
    const globalPrepayFeeCategoryId = isBorrowed
      ? userSettings?.loanBorrowedPrepayFeeCategoryId
      : userSettings?.loanLentPrepayFeeCategoryId;

    const updatedLoan = await prisma.$transaction(async (tx) => {
      let principalTransactionId: string | null = null;
      let interestTransactionId: string | null = null;
      let prepayFeeTransactionId: string | null = null;

      if (payload.principalAmount > 0) {
        const category = await ensureLoanTransactionCategory(tx, session.userId, loan.direction, "principal", loan.principalCategory?.id ?? null, globalPrincipalCategoryId);
        const txn = await tx.transaction.create({
          data: {
            amount: payload.principalAmount,
            date: payload.paymentDate,
            description: payload.note || `${loan.name} - principal`,
            accountId: payload.accountId,
            categoryId: category.id,
            userId: session.userId,
          },
        });
        principalTransactionId = txn.id;
      }

      if (payload.interestAmount > 0) {
        const category = await ensureLoanTransactionCategory(tx, session.userId, loan.direction, "interest", loan.interestCategory?.id ?? null, globalInterestCategoryId);
        const txn = await tx.transaction.create({
          data: {
            amount: payload.interestAmount,
            date: payload.paymentDate,
            description: payload.note || `${loan.name} - interest`,
            accountId: payload.accountId,
            categoryId: category.id,
            userId: session.userId,
          },
        });
        interestTransactionId = txn.id;
      }

      if (payload.prepayFeeAmount > 0) {
        const category = await ensureLoanTransactionCategory(tx, session.userId, loan.direction, "prepay_fee", loan.prepayFeeCategory?.id ?? null, globalPrepayFeeCategoryId);
        const txn = await tx.transaction.create({
          data: {
            amount: payload.prepayFeeAmount,
            date: payload.paymentDate,
            description: payload.note || `${loan.name} - prepay fee`,
            accountId: payload.accountId,
            categoryId: category.id,
            userId: session.userId,
          },
        });
        prepayFeeTransactionId = txn.id;
      }

      const newPaidPrincipal = paidPrincipal + payload.principalAmount;
      const newStatus = newPaidPrincipal >= loan.principalAmount - 0.01 ? "closed" : "active";

      await tx.loanPayment.create({
        data: {
          loanId: loan.id,
          accountId: payload.accountId,
          paymentDate: payload.paymentDate,
          principalTransactionId,
          interestTransactionId,
          prepayFeeTransactionId,
          note: payload.note,
          userId: session.userId,
        },
      });

      await tx.loan.update({ where: { id: loan.id }, data: { status: newStatus } });

      return tx.loan.findUniqueOrThrow({ where: { id: loan.id }, include: LOAN_INCLUDE });
    });

    return NextResponse.json(serializeLoan(updatedLoan));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to record payment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
