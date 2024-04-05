import prisma from "@/lib/prisma";
import { NextApiRequest } from "next";

export async function GET(request: NextApiRequest) {
    const { fromDate, toDate} = request.query;
    const transactions = await prisma.transaction.findMany(
        {
            orderBy: {
                date: "desc"
            },
            where: {
                date: {
                    gte: new Date(fromDate as string),
                    lte: new Date(toDate as string)
                
            }
        }}
    )
    return Response.json({ transactions })
}

export async function POST(request: Request) {
    const { date, value, categoryId } = await request.json();
    try {
        const transaction = await prisma.transaction.create({
            data: {
                date,
                value,
                categoryId
            }
        });
        return Response.json({ transaction }, { status: 201 })
    } catch (error: any) {
        return Response.json({ error: JSON.stringify(error) }, { status: 400 });
    }
}