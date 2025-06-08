import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { BudgetPeriod } from "@prisma/client";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, value, period, repeat, categoryIds } = body;

    // Validate input
    if (!name || !value || !period || !Array.isArray(categoryIds)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update budget with categories
    const updatedBudget = await prisma.budget.update({
      where: { id },
      data: {
        name,
        value,
        period: period as BudgetPeriod,
        repeat: Boolean(repeat),
        categories: {
          set: categoryIds.map((categoryId: string) => ({ id: categoryId })),
        },
      },
      include: {
        categories: true,
      },
    });

    return NextResponse.json(updatedBudget);
  } catch (error) {
    console.error("Error updating budget:", error);
    return NextResponse.json(
      { error: "Failed to update budget" },
      { status: 500 }
    );
  }
}