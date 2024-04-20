import prisma from "@prisma/client";

export type Transaction = {
    date: Date;
    id: string;
    value: number;
    category: Category;
}
export type Category = {
    id?: string;
    name: string;
    type: "INCOME" | "EXPENSE" | "DEBT" | "LOAN"
    | "DEBT_COLLECTION"
    | "LOAN_PAYMENT";
}
