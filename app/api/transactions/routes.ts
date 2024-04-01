import prisma from "@/lib/prisma";

export async function GET(request: Request) {
    const transactions = await prisma.transaction.findMany();
    return Response.json({ transactions })
}