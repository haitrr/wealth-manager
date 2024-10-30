"use server"
import prisma from "@/lib/prisma";

export const createTransaction = async (transaction: any) => {
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