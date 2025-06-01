import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        // Get optional pagination parameters from URL
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const sortBy = url.searchParams.get('sortBy') || undefined;
        const sortDirection = url.searchParams.get('sortDirection') || 'desc';

        // Build dynamic orderBy object
        const orderBy: any = {};
        if (sortBy) {
            orderBy[sortBy] = sortDirection;
        }
        const accounts = await prisma.account.findMany({
            take: limit,
            skip: offset,
            orderBy: orderBy,
            include: {
                debt: {
                },
            }
        });
        return NextResponse.json({
            accounts
        })

        // Execute both queries in parallel for better performance
    } catch (error) {
        console.error("Error fetching debt/loans:", error);
        return NextResponse.json(
            { error: "Failed to fetch debt/loans" },
            { status: 500 }
        );
    }
}
