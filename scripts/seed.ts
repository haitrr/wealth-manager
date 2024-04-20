
import prisma from "../lib/prisma";
import dayjs from "dayjs";
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { CategoryType } from "@prisma/client";
import { randomUUID } from "crypto";
dayjs.extend(customParseFormat);


export const seed = async () => {
    try {
        // Reset db
        await prisma.transaction.deleteMany();
        await prisma.category.deleteMany();

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
            { date: dayjs().toISOString(), value: 100000, categoryId: foodId },
            { date: dayjs().subtract(1, 'day').toISOString(), value: 200000, categoryId: salaryId },
        ];
        for (let i = 0; i < 300; i++) {
            for (let j = 0; j < 7; j++) {
                const categoryId = j % 2 === 0 ? foodId : salaryId;
                transactions.push({
                    date: dayjs().subtract(i, 'day').toISOString(),
                    value: Math.floor(Math.random() * 1000000),
                    categoryId: categoryId
                });
            }
        }
        await prisma.transaction.createMany({ data: transactions })
    } catch (err) {
        console.error(err);
    }
}

seed();
