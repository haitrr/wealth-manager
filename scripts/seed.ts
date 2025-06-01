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
        await prisma.debt.deleteMany();
        await prisma.account.deleteMany();
        await prisma.budget.deleteMany();
        await prisma.category.deleteMany();

        // categories
        const foodId = randomUUID()
        const rentalId = randomUUID()
        const billsiD = randomUUID()
        const transportationId = randomUUID()
        const partyId = randomUUID()
        const salaryId = randomUUID()
        const borrowingCategoryId = randomUUID()
        const loanCategoryId = randomUUID()
        const borrowingPaymentId = randomUUID()
        const loanCollectionId = randomUUID()

        const categories = [
            { name: "Food", type: CategoryType.EXPENSE, id: foodId, icon: "food" },
            { name: "Party", type: CategoryType.EXPENSE, id: partyId, icon: "party" },
            { name: "Salary", type: CategoryType.INCOME, id: salaryId, icon: "salary" },
            { name: "Bills", type: CategoryType.EXPENSE, id: billsiD, icon: "bills" },
            { name: "Rental", type: CategoryType.EXPENSE, id: rentalId, parentId: billsiD, icon: "rental" },
            { name: "Transportation", type: CategoryType.EXPENSE, id: transportationId, icon: "transportation" },
            { name: "Borrowing", type: CategoryType.BORROWING, id: borrowingCategoryId, icon: "borrowing" },
            { name: "Loan", type: CategoryType.LOAN, id: loanCategoryId, icon: "loan" },
            { name: "Borrowing Payment", type: CategoryType.BORROWING_PAYMENT, id: borrowingPaymentId, icon: "borrowing-payment" },
            { name: "Loan Collection", type: CategoryType.LOAN_COLLECTION, id: loanCollectionId, icon: "loan-collection" },
            { name: "Borrowing Interest Payment", type: CategoryType.BORROWING_INTEREST_PAYMENT, id: randomUUID(), icon: "borrowing-interest-payment" },
            { name: "Loan Interest Collection", type: CategoryType.LOAN_INTEREST_COLLECTION, id: randomUUID(), icon: "loan-interest-collection" },
        ];
        await prisma.category.createMany({
            data: categories
        });

        // Create accounts for debt and loan tracking
        const cashAccount = await prisma.account.create({
            data: {
                name: "Cash Account",
                type: "CASH"
            }
        });

        const creditCardAccount = await prisma.account.create({
            data: {
                name: "Credit Card Debt",
                type: "BORROWING"
            }
        });

        const carLoanAccount = await prisma.account.create({
            data: {
                name: "Car Loan",
                type: "BORROWING"
            }
        });

        const personalLoanAccount = await prisma.account.create({
            data: {
                name: "Personal Loan",
                type: "BORROWING"
            }
        });

        const mortgageAccount = await prisma.account.create({
            data: {
                name: "Mortgage",
                type: "BORROWING"
            }
        });

        const friendLoanAccount = await prisma.account.create({
            data: {
                name: "Friend Loan",
                type: "LOAN"
            }
        });

        const businessLoanAccount = await prisma.account.create({
            data: {
                name: "Business Loan",
                type: "LOAN"
            }
        });

        const familyLoanAccount = await prisma.account.create({
            data: {
                name: "Family Loan",
                type: "LOAN"
            }
        });

        // Create debt records (money we owe)
        const creditCardDebt = await prisma.debt.create({
            data: {
                name: "Credit Card Debt",
                direction: "TAKEN",
                principalAmount: 20_000_000,
                interestRate: 0.18, // 18% annual
                startDate: dayjs().subtract(3, 'month').toDate(),
                dueDate: dayjs().add(2, 'year').toDate(),
                accountId: creditCardAccount.id
            }
        });

        const carLoan = await prisma.debt.create({
            data: {
                name: "Car Loan",
                direction: "TAKEN",
                principalAmount: 150_000_000,
                interestRate: 0.06, // 6% annual
                startDate: dayjs().subtract(1, 'year').toDate(),
                dueDate: dayjs().add(4, 'year').toDate(),
                accountId: carLoanAccount.id
            }
        });

        const personalLoan = await prisma.debt.create({
            data: {
                name: "Personal Loan",
                direction: "TAKEN",
                principalAmount: 25_000_000,
                interestRate: 0.12, // 12% annual
                startDate: dayjs().subtract(6, 'month').toDate(),
                dueDate: dayjs().add(3, 'year').toDate(),
                accountId: personalLoanAccount.id
            }
        });

        const mortgageDebt = await prisma.debt.create({
            data: {
                name: "Mortgage",
                direction: "TAKEN",
                principalAmount: 500_000_000,
                interestRate: 0.04, // 4% annual
                startDate: dayjs().subtract(2, 'year').toDate(),
                dueDate: dayjs().add(28, 'year').toDate(),
                accountId: mortgageAccount.id
            }
        });

        // Create loan records (money we gave out)
        const friendLoan = await prisma.debt.create({
            data: {
                name: "Friend Loan",
                direction: "GIVEN",
                principalAmount: 10_000_000,
                interestRate: 0.05, // 5% annual
                startDate: dayjs().subtract(2, 'month').toDate(),
                dueDate: dayjs().add(1, 'year').toDate(),
                accountId: friendLoanAccount.id
            }
        });

        const businessLoan = await prisma.debt.create({
            data: {
                name: "Business Loan",
                direction: "GIVEN",
                principalAmount: 50_000_000,
                interestRate: 0.08, // 8% annual
                startDate: dayjs().startOf('month').toDate(),
                dueDate: dayjs().add(2, 'year').toDate(),
                accountId: businessLoanAccount.id
            }
        });

        const familyLoan = await prisma.debt.create({
            data: {
                name: "Family Loan",
                direction: "GIVEN",
                principalAmount: 15_000_000,
                interestRate: 0.03, // 3% annual
                startDate: dayjs().subtract(4, 'month').toDate(),
                dueDate: dayjs().add(5, 'year').toDate(),
                accountId: familyLoanAccount.id
            }
        });

        // transactions
        const transactions = [
            { date: dayjs().startOf("month").toISOString(), value: 30_000_000, categoryId: salaryId, accountId: cashAccount.id },
            // rental 6_000_000 to 7_000_000 at start of the month
            { date: dayjs().startOf("month").toISOString(), value: getRandomNumber(6_000, 7_000) * 1000, categoryId: rentalId, accountId: cashAccount.id },
            // Credit card debt payment
            {
                date: dayjs().startOf("month").toISOString(),
                value: 1_500_000,
                categoryId: borrowingPaymentId,
                accountId: creditCardAccount.id
            },
            // Car loan payment
            {
                date: dayjs().startOf("month").toISOString(),
                value: 3_000_000,
                categoryId: borrowingPaymentId,
                accountId: carLoanAccount.id
            },
            // Friend loan collection
            {
                date: dayjs().startOf("month").subtract(5, 'day').toISOString(),
                value: 500_000,
                categoryId: loanCollectionId,
                accountId: friendLoanAccount.id
            },
            // Business loan given out
            {
                date: dayjs().startOf("month").toISOString(),
                value: 50_000_000,
                categoryId: loanCategoryId,
                accountId: businessLoanAccount.id
            },
        ];

        for (let i = 0; i < 100; i++) {
            // 4 food transactions from 10k to 50k
            for (let j = 0; j < 4; j++) {
                transactions.push({
                    date: dayjs().subtract(i, 'day').toISOString(),
                    value: getRandomNumber(10, 50) * 1000,
                    categoryId: foodId,
                    accountId: cashAccount.id
                });
            }

            // 1 party per 7 days from 200k to 500k
            if (i % 7 === 0) {
                transactions.push({
                    date: dayjs().subtract(i, 'day').toISOString(),
                    value: getRandomNumber(200, 500) * 1000,
                    categoryId: partyId,
                    accountId: cashAccount.id
                });
            }

            // 1 transportation per 3 days from 50k to 100k
            if (i % 3 === 0) {
                transactions.push({
                    date: dayjs().subtract(i, 'day').toISOString(),
                    value: getRandomNumber(50, 100) * 1000,
                    categoryId: transportationId,
                    accountId: cashAccount.id
                });
            }

            // Borrowing payments every 30 days
            if (i % 30 === 0 && i > 0) {
                // Credit card payment
                transactions.push({
                    date: dayjs().subtract(i, 'day').toISOString(),
                    value: 1_500_000,
                    categoryId: borrowingPaymentId,
                    accountId: creditCardAccount.id
                });

                // Car loan payment
                transactions.push({
                    date: dayjs().subtract(i, 'day').toISOString(),
                    value: 3_000_000,
                    categoryId: borrowingPaymentId,
                    accountId: carLoanAccount.id
                });

                // Mortgage payment
                transactions.push({
                    date: dayjs().subtract(i, 'day').toISOString(),
                    value: 5_000_000,
                    categoryId: borrowingPaymentId,
                    accountId: mortgageAccount.id
                });

                // Personal loan payment
                transactions.push({
                    date: dayjs().subtract(i, 'day').toISOString(),
                    value: 2_000_000,
                    categoryId: borrowingPaymentId,
                    accountId: personalLoanAccount.id
                });
            }

            // Loan collections every 15 days
            if (i % 15 === 0 && i > 0) {
                transactions.push({
                    date: dayjs().subtract(i, 'day').toISOString(),
                    value: 500_000,
                    categoryId: loanCollectionId,
                    accountId: friendLoanAccount.id
                });

                // Family loan collection
                if (i % 30 === 0) {
                    transactions.push({
                        date: dayjs().subtract(i, 'day').toISOString(),
                        value: 750_000,
                        categoryId: loanCollectionId,
                        accountId: familyLoanAccount.id
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
                        { id: borrowingPaymentId },
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
                        { id: loanCollectionId },
                    ]
                },
            }
        })

    } catch (err) {
        console.error(err);
    }
}

seed();
