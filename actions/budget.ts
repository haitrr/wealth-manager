"use server"
import prisma from "@/lib/prisma";

type BudgetCreateParams = {
    name: string;
    categoryIds: string[];
    value: number;
    period: "MONTHLY" | "WEEKLY" | "DAILY";
    startDate: Date;
    repeat: boolean;
}

export const createBudget = async (params: BudgetCreateParams) => {
    const createData = {
        name: params.name,
        value: params.value,
        period: params.period,
        startDate: new Date(params.startDate),
        repeat: params.repeat,
        categories: {
            connect: params.categoryIds.map(id => ({ id }))
        }
    }
    await prisma.budget.create({ data: createData });
}