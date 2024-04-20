
import prisma from "../lib/prisma";
import dayjs from "dayjs";
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { CategoryType } from "@prisma/client";
import { randomUUID } from "crypto";
import { Decimal } from "@prisma/client/runtime/library";
dayjs.extend(customParseFormat);


export const seed = async () => {
    try {
        // Reset db
        await prisma.transaction.deleteMany();
        await prisma.category.deleteMany();
        await prisma.budget.deleteMany();

        // categories
        const foodId = randomUUID()
        const salaryId = randomUUID()
        const categories = [
            { name: "Food", type: CategoryType.EXPENSE, id: foodId },
            { name: "Salary", type: CategoryType.INCOME, id: salaryId },
        ];
        await prisma.category.createMany({
            data: categories
        });

        // transactions
        const transactions = [
            { date: dayjs().startOf("month").toISOString(), value: 30_000_000, categoryId: salaryId },
        ];
        for (let i = 0; i < 100; i++) {
            for (let j = 0; j < 4; j++) {
                transactions.push({
                    date: dayjs().subtract(i, 'day').toISOString(),
                    value: Math.floor(Math.random() * 100_000 + 50_000),
                    categoryId: foodId
                });
            }
        }
        await prisma.transaction.createMany({ data: transactions })

        // budgets
        await prisma.budget.create({
            data: {
                name: "Monthly food",
                startDate: dayjs().startOf('month').toDate(),
                period: "MONTHLY",
                value: new Decimal(10_000_000),
                repeat: true,
                categories: {
                    connect: {id: foodId}
                }
            }
        })

    } catch (err) {
        console.error(err);
    }
}

seed();
