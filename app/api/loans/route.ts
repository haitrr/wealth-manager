import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

        const newLoan = await prisma.loan.create({
            data: {
                name,
                amount,
                paidAmount: 0,
            },
        });
        return NextResponse.json({ loan: newLoan }, { status: 201 });
    } catch (error) {
        console.error("Error creating loan:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
