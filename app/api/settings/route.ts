import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.userSettings.upsert({
    where: { userId: session.userId },
    create: { userId: session.userId },
    update: {},
  });

  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const allowed = [
    "loanBorrowedPrincipalCategoryId",
    "loanBorrowedInterestCategoryId",
    "loanBorrowedPrepayFeeCategoryId",
    "loanLentPrincipalCategoryId",
    "loanLentInterestCategoryId",
    "loanLentPrepayFeeCategoryId",
  ] as const;

  const data: Record<string, string | null> = {};
  for (const key of allowed) {
    if (key in body) {
      data[key] = body[key] || null;
    }
  }

  const settings = await prisma.userSettings.upsert({
    where: { userId: session.userId },
    create: { userId: session.userId, ...data },
    update: data,
  });

  return NextResponse.json(settings);
}
