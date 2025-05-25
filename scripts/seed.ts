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
        await prisma.debt.deleteMany();
        await prisma.loan.deleteMany();

        // categories
        const foodId = randomUUID()
        const rentalId = randomUUID()
        const billsiD = randomUUID()
        const transportationId = randomUUID()
        const partyId = randomUUID()
        const salaryId = randomUUID()
        const debtCategoryId = randomUUID()
        const loanCategoryId = randomUUID()
        const debtCollectionId = randomUUID()
        const loanPaymentId = randomUUID()

        const categories = [
            { name: "Food", type: CategoryType.EXPENSE, id: foodId },
            { name: "Party", type: CategoryType.EXPENSE, id: partyId },
            { name: "Salary", type: CategoryType.INCOME, id: salaryId },
            { name: "Bills", type: CategoryType.EXPENSE, id: billsiD },
            { name: "Rental", type: CategoryType.EXPENSE, id: rentalId, parentId: billsiD },
            { name: "Transportation", type: CategoryType.EXPENSE, id: transportationId },
            { name: "Debt", type: CategoryType.DEBT, id: debtCategoryId },
            { name: "Loan", type: CategoryType.LOAN, id: loanCategoryId },
            { name: "Debt Collection", type: CategoryType.DEBT_COLLECTION, id: debtCollectionId },
            { name: "Loan Payment", type: CategoryType.LOAN_PAYMENT, id: loanPaymentId },
        ];
        await prisma.category.createMany({
            data: categories
        });

        // Create debts and loans
        const creditCardDebt = await prisma.debt.create({
            data: {
                name: "Credit Card Debt",
                amount: new Decimal(20_000_000),
                paidAmount: new Decimal(5_000_000),
                startDate: dayjs().subtract(3, 'month').toDate(),
            }
        });

        const carLoan = await prisma.debt.create({
            data: {
                name: "Car Loan",
                amount: new Decimal(150_000_000),
                paidAmount: new Decimal(30_000_000),
                startDate: dayjs().subtract(1, 'year').toDate(),
            }
        });

        const personalLoan = await prisma.debt.create({
            data: {
                name: "Personal Loan",
                amount: new Decimal(25_000_000),
                paidAmount: new Decimal(5_000_000),
                startDate: dayjs().subtract(6, 'month').toDate(),
            }
        });

        const mortgageDebt = await prisma.debt.create({
            data: {
                name: "Mortgage",
                amount: new Decimal(500_000_000),
                paidAmount: new Decimal(50_000_000),
                startDate: dayjs().subtract(2, 'year').toDate(),
            }
        });

        const friendLoan = await prisma.loan.create({
            data: {
                name: "Friend Loan",
                amount: new Decimal(10_000_000),
                paidAmount: new Decimal(2_000_000),
                startDate: dayjs().subtract(2, 'month').toDate(),
            }
        });

        const businessLoan = await prisma.loan.create({
            data: {
                name: "Business Loan",
                amount: new Decimal(50_000_000),
                paidAmount: new Decimal(0),
                startDate: dayjs().startOf('month').toDate(),
            }
        });

        const familyLoan = await prisma.loan.create({
            data: {
                name: "Family Loan",
                amount: new Decimal(15_000_000),
                paidAmount: new Decimal(3_000_000),
                startDate: dayjs().subtract(4, 'month').toDate(),
            }
        });

        // transactions
        const transactions = [
            { date: dayjs().startOf("month").toISOString(), value: 30_000_000, categoryId: salaryId },
            // rental 6_000_000 to 7_000_000 at start of the month
            { date: dayjs().startOf("month").toISOString(), value: getRandomNumber(6_000, 7_000) * 1000, categoryId: rentalId },
            // Credit card debt payment
            {
                date: dayjs().startOf("month").toISOString(),
                value: 1_500_000,
                categoryId: debtCategoryId,
                debtId: creditCardDebt.id
            },
            // Car loan payment
            {
                date: dayjs().startOf("month").toISOString(),
                value: 3_000_000,
                categoryId: debtCategoryId,
                debtId: carLoan.id
            },
            // Friend loan collection
            {
                date: dayjs().startOf("month").subtract(5, 'day').toISOString(),
                value: 500_000,
                categoryId: debtCollectionId,
                loanId: friendLoan.id
            },
            // Business loan given out
            {
                date: dayjs().startOf("month").toISOString(),
                value: 50_000_000,
                categoryId: loanCategoryId,
                loanId: businessLoan.id
            },
        ];

        for (let i = 0; i < 100; i++) {
            // 4 food transactions from 10k to 50k
            for (let j = 0; j < 4; j++) {
                transactions.push({
                    date: dayjs().subtract(i, 'day').toISOString(),
                    value: getRandomNumber(10, 50) * 1000,
                    categoryId: foodId
                });
            }

            // 1 party per 7 days from 200k to 500k
            if (i % 7 === 0) {
                transactions.push({
                    date: dayjs().subtract(i, 'day').toISOString(),
                    value: getRandomNumber(200, 500) * 1000,
                    categoryId: partyId
                });
            }

            // 1 transportation per 3 days from 50k to 100k
            if (i % 3 === 0) {
                transactions.push({
                    date: dayjs().subtract(i, 'day').toISOString(),
                    value: getRandomNumber(50, 100) * 1000,
                    categoryId: transportationId
                });
            }

            // Debt payments every 30 days
            if (i % 30 === 0 && i > 0) {
                // Credit card payment
                transactions.push({
                    date: dayjs().subtract(i, 'day').toISOString(),
                    value: 1_500_000,
                    categoryId: debtCategoryId,
                    debtId: creditCardDebt.id
                });

                // Car loan payment
                transactions.push({
                    date: dayjs().subtract(i, 'day').toISOString(),
                    value: 3_000_000,
                    categoryId: debtCategoryId,
                    debtId: carLoan.id
                });

                // Mortgage payment
                transactions.push({
                    date: dayjs().subtract(i, 'day').toISOString(),
                    value: 5_000_000,
                    categoryId: debtCategoryId,
                    debtId: mortgageDebt.id
                });

                // Personal loan payment
                transactions.push({
                    date: dayjs().subtract(i, 'day').toISOString(),
                    value: 2_000_000,
                    categoryId: debtCategoryId,
                    debtId: personalLoan.id
                });
            }

            // Loan collections every 15 days
            if (i % 15 === 0 && i > 0) {
                transactions.push({
                    date: dayjs().subtract(i, 'day').toISOString(),
                    value: 500_000,
                    categoryId: debtCollectionId,
                    loanId: friendLoan.id
                });

                // Family loan collection
                if (i % 30 === 0) {
                    transactions.push({
                        date: dayjs().subtract(i, 'day').toISOString(),
                        value: 750_000,
                        categoryId: debtCollectionId,
                        loanId: familyLoan.id
                    });
                }
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
                        { id: foodId },
                        { id: billsiD },
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
                        { id: partyId },
                    ]
                },
            }
        })
        await prisma.budget.create({
            data: {
                name: "Debt Management",
                startDate: dayjs().startOf('month').toDate(),
                period: "MONTHLY",
                value: new Decimal(11_500_000),
                repeat: true,
                categories: {
                    connect: [
                        { id: debtCategoryId },
                    ]
                },
            }
        })

        await prisma.budget.create({
            data: {
                name: "Loan Collections",
                startDate: dayjs().startOf('month').toDate(),
                period: "MONTHLY",
                value: new Decimal(1_250_000),
                repeat: true,
                categories: {
                    connect: [
                        { id: debtCollectionId },
                    ]
                },
            }
        })

    } catch (err) {
        console.error(err);
    }
}

seed();
