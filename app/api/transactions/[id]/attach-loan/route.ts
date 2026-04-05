import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";

const PAYMENT_TYPE_FIELD = {
  principal: "principalTransactionId",
  interest: "interestTransactionId",
  prepayFee: "prepayFeeTransactionId",
} as const;

type PaymentType = keyof typeof PAYMENT_TYPE_FIELD;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { loanId, paymentType } = await req.json();

  if (!loanId) return NextResponse.json({ error: "loanId is required" }, { status: 400 });
  if (!Object.keys(PAYMENT_TYPE_FIELD).includes(paymentType)) {
    return NextResponse.json({ error: "paymentType must be principal, interest, or prepayFee" }, { status: 400 });
  }

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId: session.userId },
    include: {
      loanPaymentPrincipal: { select: { id: true } },
      loanPaymentInterest: { select: { id: true } },
      loanPaymentPrepayFee: { select: { id: true } },
    },
  });
  if (!transaction) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

  if (transaction.loanPaymentPrincipal || transaction.loanPaymentInterest || transaction.loanPaymentPrepayFee) {
    return NextResponse.json({ error: "Transaction is already linked to a loan payment" }, { status: 400 });
  }

  const loan = await prisma.loan.findFirst({ where: { id: loanId, userId: session.userId } });
  if (!loan) return NextResponse.json({ error: "Loan not found" }, { status: 404 });

  await prisma.loanPayment.create({
    data: {
      loanId,
      accountId: transaction.accountId,
      paymentDate: transaction.date,
      [PAYMENT_TYPE_FIELD[paymentType as PaymentType]]: id,
      userId: session.userId,
    },
  });

  const updatedTransaction = await prisma.transaction.findUniqueOrThrow({
    where: { id },
    include: {
      account: { select: { id: true, name: true, currency: true } },
      category: { select: { id: true, name: true, type: true, icon: true } },
      loanPaymentPrincipal: { select: { id: true, loanId: true, loan: { select: { id: true, name: true } } } },
      loanPaymentInterest: { select: { id: true, loanId: true, loan: { select: { id: true, name: true } } } },
      loanPaymentPrepayFee: { select: { id: true, loanId: true, loan: { select: { id: true, name: true } } } },
    },
  });

  return NextResponse.json(updatedTransaction);
}
