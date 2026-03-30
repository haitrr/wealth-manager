import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import {
  getOwnedLoan,
  LOAN_INCLUDE,
  parseLoanRepricingPayload,
  regenerateScheduleFrom,
  serializeLoan,
} from "../../loan-route-utils";

function dayBefore(date: Date) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() - 1);
  return result;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const loan = await getOwnedLoan(id, session.userId);
    if (!loan) return NextResponse.json({ error: "Loan not found" }, { status: 404 });

    const payload = parseLoanRepricingPayload(await req.json());
    const firstOpenEntry = loan.scheduleEntries.find((entry) => entry.status !== "paid") ?? null;
    if (!firstOpenEntry) {
      return NextResponse.json({ error: "This loan has no open schedule entries" }, { status: 400 });
    }
    if (firstOpenEntry.dueDate.getTime() < payload.effectiveDate.getTime()) {
      return NextResponse.json(
        { error: "Settle earlier unpaid installments before repricing future rates" },
        { status: 400 }
      );
    }

    const activeFloating = loan.ratePeriods.find((period) => {
      const startsBefore = period.startDate.getTime() <= payload.effectiveDate.getTime();
      const endsAfter = !period.endDate || period.endDate.getTime() >= payload.effectiveDate.getTime();
      return startsBefore && endsAfter && period.periodType === "floating";
    });

    if (!activeFloating) {
      return NextResponse.json({ error: "No floating rate period covers the effective date" }, { status: 400 });
    }

    const updatedLoan = await prisma.$transaction(async (tx) => {
      if (activeFloating.startDate.getTime() === payload.effectiveDate.getTime()) {
        await tx.loanRatePeriod.update({
          where: { id: activeFloating.id },
          data: {
            annualRate: payload.annualRate,
            repricingIntervalMonths: payload.repricingIntervalMonths ?? activeFloating.repricingIntervalMonths,
          },
        });
      } else {
        await tx.loanRatePeriod.update({
          where: { id: activeFloating.id },
          data: { endDate: dayBefore(payload.effectiveDate) },
        });

        await tx.loanRatePeriod.create({
          data: {
            loanId: loan.id,
            periodType: "floating",
            annualRate: payload.annualRate,
            startDate: payload.effectiveDate,
            endDate: activeFloating.endDate,
            repricingIntervalMonths: payload.repricingIntervalMonths ?? activeFloating.repricingIntervalMonths,
            sequence: Math.max(...loan.ratePeriods.map((period) => period.sequence)) + 1,
          },
        });
      }

      const refreshedLoan = await tx.loan.findUniqueOrThrow({
        where: { id: loan.id },
        include: LOAN_INCLUDE,
      });
      const affectedEntry = refreshedLoan.scheduleEntries.find(
        (entry) => entry.status !== "paid" && entry.dueDate.getTime() >= payload.effectiveDate.getTime()
      );

      if (!affectedEntry) {
        return refreshedLoan;
      }

      await regenerateScheduleFrom(tx, refreshedLoan, affectedEntry.installmentIndex, affectedEntry.openingPrincipal);

      return tx.loan.findUniqueOrThrow({
        where: { id: loan.id },
        include: LOAN_INCLUDE,
      });
    });

    return NextResponse.json(serializeLoan(updatedLoan));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update floating rate";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
