"use server"
import prisma from "@/lib/prisma";

export const createTransaction = async (transaction) => {
    await prisma.transaction.create({ data: transaction });
}