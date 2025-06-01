import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        // First check if it's a debt
        let item = await prisma.borrowing.findUnique({
            where: { id }
        });

        let type = "borrowing";

        // If not found, check if it's a loan
        if (!item) {
            item = await prisma.loan.findUnique({
                where: { id }
            });
            type = "loan";
        }

        if (!item) {
            return NextResponse.json({ error: "Debt or loan not found" }, { status: 404 });
        }

        // Return the item with type information
        return NextResponse.json({ ...item, type });
    } catch (error) {
        console.error("Error fetching debt/loan:", error);
        return NextResponse.json(
            { error: "Failed to fetch debt/loan" },
            { status: 500 }
        );
    }
}