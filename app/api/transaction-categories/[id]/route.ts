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

  const { name, parentId } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  let resolvedType = category.type;

  if (parentId !== undefined && parentId !== null) {
    if (parentId === id) {
      return NextResponse.json({ error: "Category cannot be its own parent" }, { status: 400 });
    }
    const parent = await prisma.transactionCategory.findFirst({
      where: { id: parentId, userId: session.userId },
    });
    if (!parent) {
      return NextResponse.json({ error: "Parent category not found" }, { status: 400 });
    }
    if (parent.parentId) {
      return NextResponse.json({ error: "Cannot nest more than one level deep" }, { status: 400 });
    }
    // Check this category doesn't have children (can't become a child if it has children)
    const childCount = await prisma.transactionCategory.count({ where: { parentId: id } });
    if (childCount > 0) {
      return NextResponse.json({ error: "Cannot make a parent category into a subcategory" }, { status: 400 });
    }
    resolvedType = parent.type;
  }

  const updated = await prisma.transactionCategory.update({
    where: { id },
    data: { name: name.trim(), type: resolvedType, parentId: parentId ?? null },
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

  // Check if any children are used by transactions
  const childrenWithTransactions = await prisma.transactionCategory.findFirst({
    where: { parentId: id, transactions: { some: {} } },
  });
  if (childrenWithTransactions) {
    return NextResponse.json(
      { error: "Cannot delete a category whose subcategories are used by transactions" },
      { status: 409 }
    );
  }

  // Delete children first, then the category
  await prisma.transactionCategory.deleteMany({ where: { parentId: id } });
  await prisma.transactionCategory.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
