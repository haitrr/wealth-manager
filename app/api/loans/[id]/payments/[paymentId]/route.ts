import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import {
  ensureLoanTransactionCategory,
  ensureOwnedAccount,
  getLoanPrincipalAmount,
  getOwnedLoan,
  getOwnedLoanPayment,
  parseLoanPaymentPayload,
  serializeLoan,
  LOAN_INCLUDE,
} from "../../../loan-route-utils";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, paymentId } = await params;
    const loan = await getOwnedLoan(id, session.userId);
    if (!loan) return NextResponse.json({ error: "Loan not found" }, { status: 404 });

    const existingPayment = await getOwnedLoanPayment(id, paymentId, session.userId);
    if (!existingPayment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

    const payload = parseLoanPaymentPayload(await req.json());
    const account = await ensureOwnedAccount(payload.accountId, session.userId);
    if (account.currency !== loan.currency) {
      return NextResponse.json({ error: "Loan and payment account must use the same currency" }, { status: 400 });
    }

    const otherPaymentsPrincipal = loan.payments
      .filter((p) => p.id !== paymentId)
      .reduce((sum, p) => sum + (p.principalTransaction?.amount ?? 0), 0);
    const remainingPrincipal = getLoanPrincipalAmount(loan) - otherPaymentsPrincipal;
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
      // Delete old transactions
      if (existingPayment.principalTransactionId) {
        await tx.transaction.delete({ where: { id: existingPayment.principalTransactionId } });
      }
      if (existingPayment.interestTransactionId) {
        await tx.transaction.delete({ where: { id: existingPayment.interestTransactionId } });
      }
      if (existingPayment.prepayFeeTransactionId) {
        await tx.transaction.delete({ where: { id: existingPayment.prepayFeeTransactionId } });
      }

      // First clear the transaction IDs on the payment to avoid FK conflicts
      await tx.loanPayment.update({
        where: { id: paymentId },
        data: { principalTransactionId: null, interestTransactionId: null, prepayFeeTransactionId: null },
      });

      let principalTransactionId: string | null = null;
      let interestTransactionId: string | null = null;
      let prepayFeeTransactionId: string | null = null;

      if (payload.principalAmount > 0) {
        const category = await ensureLoanTransactionCategory(tx, session.userId, loan.direction, "principal", null, globalPrincipalCategoryId);
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
        const category = await ensureLoanTransactionCategory(tx, session.userId, loan.direction, "interest", null, globalInterestCategoryId);
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
        const category = await ensureLoanTransactionCategory(tx, session.userId, loan.direction, "prepay_fee", null, globalPrepayFeeCategoryId);
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

      const newPaidPrincipal = otherPaymentsPrincipal + payload.principalAmount;
      const newStatus = newPaidPrincipal >= getLoanPrincipalAmount(loan) - 0.01 ? "closed" : "active";

      await tx.loanPayment.update({
        where: { id: paymentId },
        data: {
          accountId: payload.accountId,
          paymentDate: payload.paymentDate,
          principalTransactionId,
          interestTransactionId,
          prepayFeeTransactionId,
          note: payload.note,
        },
      });

      await tx.loan.update({ where: { id: loan.id }, data: { status: newStatus } });

      return tx.loan.findUniqueOrThrow({ where: { id: loan.id }, include: LOAN_INCLUDE });
    });

    return NextResponse.json(serializeLoan(updatedLoan));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update payment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, paymentId } = await params;
    const loan = await getOwnedLoan(id, session.userId);
    if (!loan) return NextResponse.json({ error: "Loan not found" }, { status: 404 });

    const existingPayment = await getOwnedLoanPayment(id, paymentId, session.userId);
    if (!existingPayment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

    const updatedLoan = await prisma.$transaction(async (tx) => {
      await tx.loanPayment.delete({ where: { id: paymentId } });

      const remainingPayments = loan.payments.filter((p) => p.id !== paymentId);
      const newPaidPrincipal = remainingPayments.reduce((sum, p) => sum + (p.principalTransaction?.amount ?? 0), 0);
      const newStatus = newPaidPrincipal >= getLoanPrincipalAmount(loan) - 0.01 ? "closed" : "active";

      await tx.loan.update({ where: { id: loan.id }, data: { status: newStatus } });

      return tx.loan.findUniqueOrThrow({ where: { id: loan.id }, include: LOAN_INCLUDE });
    });

    return NextResponse.json(serializeLoan(updatedLoan));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete payment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
