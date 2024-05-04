
import prisma from "../lib/prisma";
import dayjs from "dayjs";
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { CategoryType } from "@prisma/client";
import { randomUUID } from "crypto";
import { Decimal } from "@prisma/client/runtime/library";
dayjs.extend(customParseFormat);

const getRandomNumber = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


export const seed = async () => {
    try {
        // Reset db
        await prisma.transaction.deleteMany();
        await prisma.category.deleteMany();
        await prisma.budget.deleteMany();

        // categories
        const foodId = randomUUID()
        const rentalId = randomUUID()
        const billsiD = randomUUID()
        const transportationId = randomUUID()
        const partyId = randomUUID()
        const salaryId = randomUUID()
        const categories = [
            { name: "Food", type: CategoryType.EXPENSE, id: foodId },
            { name: "Party", type: CategoryType.EXPENSE, id: partyId },
            { name: "Salary", type: CategoryType.INCOME, id: salaryId },
            { name: "Bills", type: CategoryType.EXPENSE, id: billsiD },
            { name: "Rental", type: CategoryType.EXPENSE, id: rentalId, parentId: billsiD },
            { name: "Transportation", type: CategoryType.EXPENSE, id: transportationId },
        ];
        await prisma.category.createMany({
            data: categories
        });

        // transactions
        const transactions = [
            { date: dayjs().startOf("month").toISOString(), value: 30_000_000, categoryId: salaryId },
            // rental 6_000_000 to 7_000_000 at 5th of the month
            { date: dayjs().startOf("month").add(5, 'day').toISOString(), value: getRandomNumber(6_000, 7_000)*1000, categoryId: rentalId },
        ];
        for (let i = 0; i < 100; i++) {
            // 4 food transactions from 10k to 50k
            for (let j = 0; j < 4; j++) {
                transactions.push({
                    date: dayjs().subtract(i, 'day').toISOString(),
                    value: getRandomNumber(10, 50)*1000,
                    categoryId: foodId
                });
            }

            // 1 party per 7 days from 200k to 500k
            if (i % 7 === 0) {
                transactions.push({
                    date: dayjs().subtract(i, 'day').toISOString(),
                    value: getRandomNumber(200, 500)*1000,
                    categoryId: partyId
                });
            }

            // 1 transportation per 3 days from 50k to 100k
            if(i % 3 === 0) {
                transactions.push({
                    date: dayjs().subtract(i, 'day').toISOString(),
                    value: getRandomNumber(50, 100)*1000,
                    categoryId: transportationId
                });
            }
        }
        await prisma.transaction.createMany({ data: transactions })

        // budgets
        await prisma.budget.create({
            data: {
                name: "Need",
                startDate: dayjs().startOf('month').toDate(),
                period: "MONTHLY",
                value: new Decimal(15_000_000),
                repeat: true,
                categories: {
                    connect: [
                        {id: foodId},
                        {id: billsiD},
                    ],
                }
            }
        })
        await prisma.budget.create({
            data: {
                name: "Want",
                startDate: dayjs().startOf('month').toDate(),
                period: "MONTHLY",
                value: new Decimal(9_000_000),
                repeat: true,
                categories: {
                    connect: [
                        {id: partyId},
                    ]
                },
            }
        })

    } catch (err) {
        console.error(err);
    }
}

seed();
