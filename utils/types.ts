import  prisma from "@prisma/client";

export type Transaction = {
    date: Date;
    id: string;
    value: prisma.Prisma.Decimal;
    category: Category;
}
export type Category = {
    id?: string;
    name: string;
    type: "INCOME" | "EXPENSE";
}
