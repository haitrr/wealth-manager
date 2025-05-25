import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        // First check if it's a debt
        let isDebt = await prisma.debt.findUnique({
            where: { id },
            select: { id: true }
        });

        // Check if this is a debt or loan
        if (isDebt) {
            // Fetch transactions for debt
            const transactions = await prisma.transaction.findMany({
                where: {
                    debtId: id
                },
                include: {
                    category: true
                },
                orderBy: {
                    date: 'desc'
                }
            });

            return NextResponse.json(transactions);
        } else {
            // Fetch transactions for loan
            const transactions = await prisma.transaction.findMany({
                where: {
                    loanId: id
                },
                include: {
                    category: true
                },
                orderBy: {
                    date: 'desc'
                }
            });

            return NextResponse.json(transactions);
        }
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return NextResponse.json(
            { error: "Failed to fetch transactions" },
            { status: 500 }
        );
    }
}