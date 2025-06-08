import { Budget, Category, Transaction } from "@prisma/client";

export type TransactionWithNumberValue = Omit<Transaction, "value"> & {
    value: number;
}

export type TransactionWithCategory = Omit<Transaction, "value"> & {
    category: Category;
    value: number;
};

export type BudgetWithNumberValue = Omit<Budget, "value"> & {
    value: number;
    repeat: boolean;
};