import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        // Get optional pagination parameters from URL
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const sortBy = url.searchParams.get('sortBy') || 'startDate';
        const sortDirection = url.searchParams.get('sortDirection') || 'desc';
        
        // Build dynamic orderBy object
        const orderBy: any = {};
        orderBy[sortBy] = sortDirection;
        
        // Execute both queries in parallel for better performance
        const [debts, loans, totalDebts, totalLoans] = await Promise.all([
            prisma.debt.findMany({
                orderBy,
                include: {
                    // Include count of related transactions for optimization
                    _count: {
                        select: {
                            transactions: true
                        }
                    }
                },
                take: limit,
                skip: offset
            }),
            prisma.loan.findMany({
                orderBy,
                include: {
                    // Include count of related transactions for optimization
                    _count: {
                        select: {
                            transactions: true
                        }
                    }
                },
                take: limit,
                skip: offset
            }),
            prisma.debt.count(),
            prisma.loan.count()
        ]);

        return NextResponse.json({
            debts: debts.map(debt => ({ ...debt, type: 'debt' })),
            loans: loans.map(loan => ({ ...loan, type: 'loan' })),
            pagination: {
                limit,
                offset,
                totalDebts,
                totalLoans,
            }
        });
    } catch (error) {
        console.error("Error fetching debt/loans:", error);
        return NextResponse.json(
            { error: "Failed to fetch debt/loans" },
            { status: 500 }
        );
    }
}
