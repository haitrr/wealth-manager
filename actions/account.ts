"use server"
import prisma from "@/lib/prisma";

export const getAccounts = async () => {
    return await prisma.account.findMany({
        orderBy: {
            name: "asc"
        }
    });
}
