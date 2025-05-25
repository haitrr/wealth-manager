import { NextResponse } from "next/server";
import prisma from "@/prisma/client";

export async function GET() {
    try {
        const debts = await prisma.debt.findMany();
        return NextResponse.json({ debts });
    } catch (error) {
        console.error("Error fetching debts:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
