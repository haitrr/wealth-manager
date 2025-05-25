import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, amount } = body;

        if (!name || !amount) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const newDebt = await prisma.debt.create({
            data: {
                name,
                amount,
                paidAmount: 0, // Default value for paidAmount
            },
        });
        return NextResponse.json({ debt: newDebt }, { status: 201 });
    } catch (error) {
        console.error("Error creating debt:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
