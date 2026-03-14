import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";

async function getOwnedCategory(categoryId: string, userId: string) {
  return prisma.transactionCategory.findFirst({ where: { id: categoryId, userId } });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const category = await getOwnedCategory(id, session.userId);
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, type } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!["income", "expense", "payable", "receivable"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const updated = await prisma.transactionCategory.update({
    where: { id },
    data: { name: name.trim(), type },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const category = await getOwnedCategory(id, session.userId);
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const usedCount = await prisma.transaction.count({ where: { categoryId: id } });
  if (usedCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete a category that is used by transactions" },
      { status: 409 }
    );
  }

  await prisma.transactionCategory.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
