import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        // Get optional pagination parameters from URL
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        
        // Execute both queries in parallel for better performance
        const [debts, loans] = await Promise.all([
            prisma.debt.findMany({
                orderBy: {
                    startDate: 'desc'
                },
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
                orderBy: {
                    startDate: 'desc'
                },
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
            })
        ]);

        return NextResponse.json({
            debts: debts.map(debt => ({ ...debt, type: 'debt' })),
            loans: loans.map(loan => ({ ...loan, type: 'loan' })),
            pagination: {
                limit,
                offset,
                totalDebts: await prisma.debt.count(),
                totalLoans: await prisma.loan.count(),
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
