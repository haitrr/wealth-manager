import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { setAsDefault } = body;

    if (setAsDefault) {
      // First, set all accounts default to false
      await prisma.account.updateMany({
        data: {
          default: false
        }
      });

      // Then set this account as default
      const updatedAccount = await prisma.account.update({
        where: { id },
        data: {
          default: true
        },
        include: {
          debt: true
        }
      });

      return NextResponse.json(updatedAccount);
    } else {
      // Just update the account without changing default status
      const updatedAccount = await prisma.account.update({
        where: { id },
        data: body,
        include: {
          debt: true
        }
      });

      return NextResponse.json(updatedAccount);
    }
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 }
    );
  }
}
