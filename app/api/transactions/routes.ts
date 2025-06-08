import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    // Extract query parameters from URL
    const url = new URL(request.url);
    const fromDate = url.searchParams.get('fromDate');
    const toDate = url.searchParams.get('toDate');
    
    try {
        // Build query filter object based on available params
        let dateFilter = {};
        
        if (fromDate && toDate) {
            dateFilter = {
                date: {
                    gte: new Date(fromDate),
                    lte: new Date(toDate)
                }
            };
        } else if (fromDate) {
            dateFilter = {
                date: {
                    gte: new Date(fromDate)
                }
            };
        } else if (toDate) {
            dateFilter = {
                date: {
                    lte: new Date(toDate)
                }
            };
        }
        
        const transactions = await prisma.transaction.findMany({
            orderBy: {
                date: "desc"
            },
            where: dateFilter,
            // Include related category data to avoid additional queries
            include: {
                category: {
                    select: {
                        name: true,
                        type: true,
                        icon: true
                    }
                }
            },
            // Limit to 100 records for performance
            take: 100
        });
        
        return Response.json({ transactions });
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return Response.json({ error: "Failed to fetch transactions" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { date, value, categoryId, accountId } = await request.json();
        
        const transaction = await prisma.transaction.create({
            data: {
                date: new Date(date),
                value: parseFloat(value),
                categoryId,
                accountId
            }
        });
        return Response.json({ transaction }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating transaction:", error);
        return Response.json({ error: JSON.stringify(error) }, { status: 400 });
    }
}