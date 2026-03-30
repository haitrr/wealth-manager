import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import {
  ensureLoanTransactionCategory,
  ensureOwnedAccount,
  getOwnedLoan,
  LOAN_INCLUDE,
  parseLoanPaymentPayload,
  regenerateScheduleFrom,
  settleScheduleWithPayment,
  shortenLoanTermFrom,
  serializeLoan,
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
    if (payload.principalAmount > loan.remainingPrincipal + 0.01) {
      return NextResponse.json({ error: "Principal payment exceeds remaining principal" }, { status: 400 });
    }
    if (
      payload.paymentKind === "prepayment" &&
      payload.prepaymentStrategy === "shorten_term" &&
      (loan.productType === "bullet" || loan.installmentStrategy === "bullet")
    ) {
      return NextResponse.json(
        { error: "Shorten-term prepayment is only available for installment loans" },
        { status: 400 }
      );
    }

    const updatedLoan = await prisma.$transaction(async (tx) => {
      const category = await ensureLoanTransactionCategory(tx, session.userId, loan.direction);
      const transaction = await tx.transaction.create({
        data: {
          amount: payload.totalAmount,
          date: payload.paymentDate,
          description: payload.note || `${loan.name} ${payload.paymentKind === "prepayment" ? "prepayment" : "payment"}`,
          details:
            `Loan ${payload.paymentKind}; principal ${payload.principalAmount.toFixed(2)}, interest ${payload.interestAmount.toFixed(2)}`,
          accountId: payload.accountId,
          categoryId: category.id,
          userId: session.userId,
        },
      });

      await tx.loanPayment.create({
        data: {
          loanId: loan.id,
          accountId: payload.accountId,
          transactionId: transaction.id,
          paymentDate: payload.paymentDate,
          paymentKind: payload.paymentKind,
          totalAmount: payload.totalAmount,
          principalAmount: payload.principalAmount,
          interestAmount: payload.interestAmount,
          note: payload.note,
          userId: session.userId,
        },
      });

      const paymentResult = await settleScheduleWithPayment(
        tx,
        loan,
        payload.principalAmount,
        payload.interestAmount,
        payload.paymentDate
      );

      if (paymentResult.remainingUnallocatedInterest > 0.01) {
        throw new Error("Interest amount exceeds unpaid scheduled interest");
      }

      const nextRemainingPrincipal = Math.max(0, Number((loan.remainingPrincipal - payload.principalAmount).toFixed(2)));
      await tx.loan.update({
        where: { id: loan.id },
        data: {
          remainingPrincipal: nextRemainingPrincipal,
          status: nextRemainingPrincipal <= 0.01 ? "closed" : loan.status,
        },
      });

      const refreshedLoan = await tx.loan.findUniqueOrThrow({
        where: { id: loan.id },
        include: LOAN_INCLUDE,
      });

      const shouldRegenerate = payload.paymentKind !== "scheduled" || paymentResult.remainingUnallocatedPrincipal > 0.01;
      const firstOpenEntry = refreshedLoan.scheduleEntries.find((entry) => entry.status !== "paid") ?? null;

      if (nextRemainingPrincipal <= 0.01) {
        if (firstOpenEntry) {
          await tx.loanScheduleEntry.deleteMany({
            where: { loanId: loan.id, installmentIndex: { gte: firstOpenEntry.installmentIndex } },
          });
        }
      } else if (shouldRegenerate && firstOpenEntry) {
        if (payload.paymentKind === "prepayment" && payload.prepaymentStrategy === "shorten_term") {
          await shortenLoanTermFrom(tx, refreshedLoan, firstOpenEntry.installmentIndex, nextRemainingPrincipal);
        } else {
          await regenerateScheduleFrom(tx, refreshedLoan, firstOpenEntry.installmentIndex, nextRemainingPrincipal);
        }
      }

      return tx.loan.findUniqueOrThrow({
        where: { id: loan.id },
        include: LOAN_INCLUDE,
      });
    });

    return NextResponse.json(serializeLoan(updatedLoan));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to record payment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
