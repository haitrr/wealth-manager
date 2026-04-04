import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { generateLoanSchedule } from "./loan-utils";
import {
  buildScheduleCreateManyInput,
  ensureOwnedAccount,
  LOAN_INCLUDE,
  parseLoanPayload,
  serializeLoan,
  syncLoanOriginationTransaction,
} from "./loan-route-utils";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const loans = await prisma.loan.findMany({
    where: { userId: session.userId },
    include: LOAN_INCLUDE,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(loans.map(serializeLoan));
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const payload = parseLoanPayload(await req.json());
    const account = await ensureOwnedAccount(payload.data.accountId, session.userId);
    if (account.currency !== payload.data.currency) {
      throw new Error("Loan and account must use the same currency");
    }

    const schedule = generateLoanSchedule(payload.computationInput, payload.ratePeriods);

    const createdLoan = await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.create({
        data: {
          ...payload.data,
          userId: session.userId,
        },
      });

      const originationTransactionId = await syncLoanOriginationTransaction(tx, {
        loan,
        userId: session.userId,
      });

      if (originationTransactionId) {
        await tx.loan.update({
          where: { id: loan.id },
          data: { originationTransactionId },
        });
      }

      const createdRatePeriods = await tx.loanRatePeriod.createManyAndReturn({
        data: payload.ratePeriods.map((period) => ({
          loanId: loan.id,
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
        data: buildScheduleCreateManyInput(loan.id, schedule, createdRatePeriods),
      });

      return tx.loan.findUniqueOrThrow({
        where: { id: loan.id },
        include: LOAN_INCLUDE,
      });
    });

    return NextResponse.json(serializeLoan(createdLoan), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create loan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
