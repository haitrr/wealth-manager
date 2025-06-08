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
            select: {
                id: true,
                name: true,
                type: true,
                default: true,
                debt: {
                    select: {
                        name: true,
                        principalAmount: true,
                        interestRate: true,
                        startDate: true,
                        dueDate: true,
                        direction: true
                    }
                }
            }
        });
        
        console.log("Fetched accounts:", JSON.stringify(accounts, null, 2));
        
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

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, type, principalAmount, interestRate, startDate, dueDate } = body;

        // Validate required fields
        if (!name || !type) {
            return NextResponse.json(
                { error: "Name and type are required" },
                { status: 400 }
            );
        }

        // Create account based on type
        if (type === "CASH") {
            const account = await prisma.account.create({
                data: {
                    name,
                    type,
                    default: false
                }
            });
            return NextResponse.json(account, { status: 201 });
        } else if (type === "BORROWING" || type === "LOAN") {
            // Validate debt/loan specific fields
            if (!principalAmount || !interestRate || !startDate || !dueDate) {
                return NextResponse.json(
                    { error: "Principal amount, interest rate, start date, and due date are required for debt/loan accounts" },
                    { status: 400 }
                );
            }

            const account = await prisma.account.create({
                data: {
                    name,
                    type,
                    default: false,
                    debt: {
                        create: {
                            name,
                            direction: type === "BORROWING" ? "TAKEN" : "GIVEN",
                            principalAmount: parseFloat(principalAmount),
                            interestRate: parseFloat(interestRate) / 100, // Convert percentage to decimal
                            startDate: new Date(startDate),
                            dueDate: new Date(dueDate)
                        }
                    }
                },
                include: {
                    debt: true
                }
            });
            return NextResponse.json(account, { status: 201 });
        } else {
            return NextResponse.json(
                { error: "Invalid account type" },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error("Error creating account:", error);
        return NextResponse.json(
            { error: "Failed to create account" },
            { status: 500 }
        );
    }
}
