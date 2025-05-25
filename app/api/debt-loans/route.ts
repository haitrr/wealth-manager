import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const debts = await prisma.debt.findMany();
        const loans = await prisma.loan.findMany();
        return NextResponse.json({ debts, loans });
    } catch (error) {
        console.error("Error fetching debt-loans:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
