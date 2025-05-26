"use server"

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export default async function createTransaction(transaction: any) {
    const newTransaction = await prisma.transaction.create({
        data: transaction,
    });
    revalidatePath("/transactions");
    revalidatePath("/");
    return newTransaction;
}