import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import {
  buildLoanPaymentTransactionData,
  ensureLoanTransactionCategory,
  ensureOwnedAccount,
  getOwnedLoan,
  getOwnedLoanPayment,
  parseLoanPaymentPayload,
  rebuildLoanDerivedState,
  serializeLoan,
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
    if (!existingPayment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const payload = parseLoanPaymentPayload(await req.json());
    const account = await ensureOwnedAccount(payload.accountId, session.userId);
    if (account.currency !== loan.currency) {
      return NextResponse.json({ error: "Loan and payment account must use the same currency" }, { status: 400 });
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
      const transactionData = buildLoanPaymentTransactionData(loan, payload, category.id, session.userId);

      if (existingPayment.transactionId) {
        await tx.transaction.update({
          where: { id: existingPayment.transactionId },
          data: transactionData,
        });
      } else {
        const transaction = await tx.transaction.create({ data: transactionData });
        await tx.loanPayment.update({
          where: { id: existingPayment.id },
          data: { transactionId: transaction.id },
        });
      }

      await tx.loanPayment.update({
        where: { id: existingPayment.id },
        data: {
          accountId: payload.accountId,
          paymentDate: payload.paymentDate,
          paymentKind: payload.paymentKind,
          totalAmount: payload.totalAmount,
          principalAmount: payload.principalAmount,
          interestAmount: payload.interestAmount,
          prepaymentStrategy: payload.prepaymentStrategy,
          note: payload.note,
        },
      });

      return rebuildLoanDerivedState(tx, loan.id);
    });

    return NextResponse.json(serializeLoan(updatedLoan));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update payment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}