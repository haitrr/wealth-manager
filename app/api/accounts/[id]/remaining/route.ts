import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CategoryType } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accountId = params.id;

    // Get the account with its debt information
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        debt: true,
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    if (!account.debt) {
      return NextResponse.json(
        { error: "Account has no debt information" },
        { status: 400 }
      );
    }

    // Calculate remaining amount based on specific transaction categories
    let remainingAmount: number;
    
    if (account.type === "BORROWING") {
      // For borrowing: remaining = principal - borrowing payment transactions
      const paymentTransactions = await prisma.transaction.aggregate({
        where: {
          accountId: accountId,
          category: {
            type: CategoryType.BORROWING_PAYMENT
          }
        },
        _sum: {
          value: true,
        },
      });
      
      const totalPayments = Number(paymentTransactions._sum.value) || 0;
      remainingAmount = account.debt.principalAmount - totalPayments;
    } else if (account.type === "LOAN") {
      // For loan: remaining = principal - loan collection transactions
      const collectionTransactions = await prisma.transaction.aggregate({
        where: {
          accountId: accountId,
          category: {
            type: CategoryType.LOAN_COLLECTION
          }
        },
        _sum: {
          value: true,
        },
      });
      
      const totalCollections = Number(collectionTransactions._sum.value) || 0;
      remainingAmount = account.debt.principalAmount - totalCollections;
    } else {
      remainingAmount = account.debt.principalAmount;
    }

    // Ensure remaining amount doesn't go below zero
    remainingAmount = Math.max(0, remainingAmount);

    return NextResponse.json({
      remainingAmount,
      principalAmount: account.debt.principalAmount,
      accountType: account.type,
    });

  } catch (error) {
    console.error("Error calculating remaining amount:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}