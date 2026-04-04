import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import {
  ensureLoanInitialCategory,
  ensureOwnedAccount,
  LOAN_INCLUDE,
  parseLoanPayload,
  serializeLoan,
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
    const parsed = parseLoanPayload(await req.json());
    const { principalAmount, initialCategoryId, ...loanData } = parsed;

    const account = await ensureOwnedAccount(loanData.accountId, session.userId);
    if (account.currency !== loanData.currency) {
      throw new Error("Loan and account must use the same currency");
    }

    const userSettings = await prisma.userSettings.findUnique({ where: { userId: session.userId } });
    const globalInitialCategoryId = loanData.direction === "borrowed"
      ? userSettings?.loanBorrowedInitialCategoryId
      : userSettings?.loanLentInitialCategoryId;

    const loan = await prisma.$transaction(async (tx) => {
      const category = await ensureLoanInitialCategory(tx, session.userId, loanData.direction, initialCategoryId, globalInitialCategoryId);
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
      return tx.loan.create({
        data: { ...loanData, initialTransactionId: initialTx.id, userId: session.userId },
        include: LOAN_INCLUDE,
      });
    });

    return NextResponse.json(serializeLoan(loan), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create loan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
