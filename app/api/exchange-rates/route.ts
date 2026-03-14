import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const exchangeRates = await prisma.exchangeRate.findMany({
    where: { userId: session.userId },
    orderBy: [{ fromCurrency: "asc" }, { toCurrency: "asc" }],
  });

  return NextResponse.json(exchangeRates);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fromCurrency, toCurrency, rate } = await req.json();

  if (!fromCurrency || !toCurrency) {
    return NextResponse.json({ error: "From and to currencies are required" }, { status: 400 });
  }
  if (fromCurrency === toCurrency) {
    return NextResponse.json({ error: "From and to currencies must be different" }, { status: 400 });
  }
  if (!rate || rate <= 0) {
    return NextResponse.json({ error: "Rate must be positive" }, { status: 400 });
  }

  // Check if exchange rate already exists
  const existing = await prisma.exchangeRate.findUnique({
    where: {
      userId_fromCurrency_toCurrency: {
        userId: session.userId,
        fromCurrency,
        toCurrency,
      },
    },
  });

  if (existing) {
    return NextResponse.json({ error: "Exchange rate already exists" }, { status: 409 });
  }

  const exchangeRate = await prisma.exchangeRate.create({
    data: {
      fromCurrency,
      toCurrency,
      rate: parseFloat(rate),
      userId: session.userId,
    },
  });

  return NextResponse.json(exchangeRate, { status: 201 });
}
