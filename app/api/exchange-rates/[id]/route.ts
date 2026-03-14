import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const exchangeRate = await prisma.exchangeRate.findFirst({
    where: { id, userId: session.userId },
  });
  if (!exchangeRate) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { rate } = await req.json();

  if (!rate || rate <= 0) {
    return NextResponse.json({ error: "Rate must be positive" }, { status: 400 });
  }

  const updated = await prisma.exchangeRate.update({
    where: { id },
    data: { rate: parseFloat(rate) },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const exchangeRate = await prisma.exchangeRate.findFirst({
    where: { id, userId: session.userId },
  });
  if (!exchangeRate) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.exchangeRate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
