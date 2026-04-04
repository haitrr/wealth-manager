import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { generateLoanSchedule } from "../loan-utils";
import {
  buildScheduleCreateManyInput,
  ensureOwnedAccount,
  getOwnedLoan,
  LOAN_INCLUDE,
  parseLoanPayload,
  serializeLoan,
  syncLoanOriginationTransaction,
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
    if (existing.payments.length > 0) {
      return NextResponse.json(
        { error: "Loans with recorded payments cannot be edited yet" },
        { status: 400 }
      );
    }

    const payload = parseLoanPayload(await req.json());
    const account = await ensureOwnedAccount(payload.data.accountId, session.userId);
    if (account.currency !== payload.data.currency) {
      throw new Error("Loan and account must use the same currency");
    }

    const schedule = generateLoanSchedule(payload.computationInput, payload.ratePeriods);

    const updatedLoan = await prisma.$transaction(async (tx) => {
      const originationTransactionId = await syncLoanOriginationTransaction(tx, {
        existingTransactionId: existing.originationTransactionId,
        loan: payload.data,
        userId: session.userId,
      });

      await tx.loan.update({
        where: { id },
        data: {
          ...payload.data,
          originationTransactionId,
        },
      });

      await tx.loanScheduleEntry.deleteMany({ where: { loanId: id } });
      await tx.loanRatePeriod.deleteMany({ where: { loanId: id } });

      const createdRatePeriods = await tx.loanRatePeriod.createManyAndReturn({
        data: payload.ratePeriods.map((period) => ({
          loanId: id,
          periodType: period.periodType,
          annualRate: period.annualRate,
          startDate: period.startDate,
          endDate: period.endDate ?? null,
          repricingIntervalMonths: period.repricingIntervalMonths ?? null,
          sequence: period.sequence ?? 0,
        })),
        select: { id: true, sequence: true },
      });

      await tx.loanScheduleEntry.createMany({
        data: buildScheduleCreateManyInput(id, schedule, createdRatePeriods),
      });

      return tx.loan.findUniqueOrThrow({
        where: { id },
        include: LOAN_INCLUDE,
      });
    });

    return NextResponse.json(serializeLoan(updatedLoan));
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
  if (loan.payments.length > 0) {
    return NextResponse.json(
      { error: "Loans with recorded payments cannot be deleted" },
      { status: 400 }
    );
  }

  await prisma.$transaction(async (tx) => {
    if (loan.originationTransactionId) {
      await tx.transaction.delete({ where: { id: loan.originationTransactionId } });
    }
    await tx.loan.delete({ where: { id } });
  });

  return NextResponse.json({ success: true });
}
