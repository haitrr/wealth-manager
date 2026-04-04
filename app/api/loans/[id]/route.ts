import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import {
  ensureOwnedAccount,
  getOwnedLoan,
  LOAN_INCLUDE,
  parseLoanPayload,
  serializeLoan,
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

    const data = parseLoanPayload(await req.json());
    const account = await ensureOwnedAccount(data.accountId, session.userId);
    if (account.currency !== data.currency) {
      throw new Error("Loan and account must use the same currency");
    }

    const updated = await prisma.loan.update({
      where: { id },
      data,
      include: LOAN_INCLUDE,
    });

    return NextResponse.json(serializeLoan(updated));
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

  await prisma.loan.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
