import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const transactions = await prisma.transaction.findMany({
      where: {
        accountId: params.id
      },
      include: {
        category: true
      },
      orderBy: {
        date: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Transform the data to match the expected format
    const transformedTransactions = transactions.map(transaction => ({
      ...transaction,
      value: transaction.value.toNumber(),
      category: {
        ...transaction.category,
        type: transaction.category.type as any
      }
    }));

    return NextResponse.json({
      transactions: transformedTransactions,
      pagination: {
        limit,
        offset,
        total: await prisma.transaction.count({
          where: { accountId: params.id }
        })
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}