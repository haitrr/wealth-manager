import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const debts = await prisma.debt.findMany({
            orderBy: {
                startDate: 'desc'
            }
        });

        const loans = await prisma.loan.findMany({
            orderBy: {
                startDate: 'desc'
            }
        });

        return NextResponse.json({
            debts: debts.map(debt => ({ ...debt, type: 'debt' })),
            loans: loans.map(loan => ({ ...loan, type: 'loan' }))
        });
    } catch (error) {
        console.error("Error fetching debt/loans:", error);
        return NextResponse.json(
            { error: "Failed to fetch debt/loans" },
            { status: 500 }
        );
    }
}
