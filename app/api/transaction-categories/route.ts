import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await prisma.transactionCategory.findMany({
    where: { userId: session.userId },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, type, parentId, icon } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  let resolvedType = type;

  if (parentId) {
    const parent = await prisma.transactionCategory.findFirst({
      where: { id: parentId, userId: session.userId },
    });
    if (!parent) {
      return NextResponse.json({ error: "Parent category not found" }, { status: 400 });
    }
    if (parent.parentId) {
      return NextResponse.json({ error: "Cannot nest more than one level deep" }, { status: 400 });
    }
    resolvedType = parent.type;
  } else {
    if (!["income", "expense", "payable", "receivable"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
  }

  const category = await prisma.transactionCategory.create({
    data: { name: name.trim(), type: resolvedType, userId: session.userId, parentId: parentId ?? null, icon: icon ?? null },
  });

  return NextResponse.json(category, { status: 201 });
}
