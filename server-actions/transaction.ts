"use server"

import prisma from "@/lib/prisma";

export default async function createTransaction(transaction: any) {
    const newTransaction = await prisma.transaction.create({
        data: transaction,
    });
    return newTransaction;
}