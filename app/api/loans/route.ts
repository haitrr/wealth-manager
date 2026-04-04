import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import {
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
    const data = parseLoanPayload(await req.json());
    const account = await ensureOwnedAccount(data.accountId, session.userId);
    if (account.currency !== data.currency) {
      throw new Error("Loan and account must use the same currency");
    }

    const loan = await prisma.loan.create({
      data: { ...data, userId: session.userId },
      include: LOAN_INCLUDE,
    });

    return NextResponse.json(serializeLoan(loan), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create loan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
