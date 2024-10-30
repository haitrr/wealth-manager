"use server"
import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export const createTransaction = async (transaction) => {
    await prisma.transaction.create({ data: transaction });
}

export const getTransaction = async (id: string) => {
    const transaction = await prisma.transaction.findFirst({
        where: {
            id: id,
        },
        include: {
            category: true,
        },
    });
    if (!transaction) {
        return null;
    }
    return { ...transaction, value: transaction?.value.toNumber() };
}