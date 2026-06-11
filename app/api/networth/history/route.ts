import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import {
  AssetHistoryRecord,
  ExchangeRateRecord,
  LoanRecord,
  TxRecord,
  computeNetWorthHistory,
  toDateStr,
} from "@/lib/networth-history";

function getCutoffDate(range: string): Date | null {
  const MS_PER_DAY = 86_400_000;
  const now = new Date();
  if (range === "1m") return new Date(now.getTime() - 30 * MS_PER_DAY);
  if (range === "3m") return new Date(now.getTime() - 90 * MS_PER_DAY);
  if (range === "6m") return new Date(now.getTime() - 180 * MS_PER_DAY);
  if (range === "1y") return new Date(now.getTime() - 365 * MS_PER_DAY);
  return null;
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const range = new URL(req.url).searchParams.get("range") ?? "all";
  const cutoff = getCutoffDate(range);

  const [settings, transactions, assetHistories, loans, exchangeRates] = await Promise.all([
    prisma.userSettings.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId },
      update: {},
    }),
    prisma.transaction.findMany({
      where: { userId: session.userId },
      include: {
        category: { select: { type: true } },
        account: { select: { currency: true } },
      },
    }),
    prisma.assetValueHistory.findMany({
      where: { asset: { userId: session.userId } },
      include: { asset: { select: { currency: true } } },
    }),
    prisma.loan.findMany({
      where: { userId: session.userId, status: "active", direction: "borrowed" },
      include: {
        initialTransaction: { select: { amount: true } },
        payments: {
          include: {
            principalTransaction: { select: { amount: true } },
          },
        },
      },
    }),
    prisma.exchangeRate.findMany({ where: { userId: session.userId } }),
  ]);

  const targetCurrency = settings.defaultCurrency;

  // Collect all unique date strings from transactions + asset histories
  const allDateStrs = new Set<string>();
  for (const tx of transactions) {
    allDateStrs.add(toDateStr(new Date(tx.date)));
  }
  for (const h of assetHistories) {
    allDateStrs.add(toDateStr(new Date(h.date)));
  }

  // Filter to range and add cutoff as anchor point
  const cutoffStr = cutoff ? toDateStr(cutoff) : null;
  if (cutoffStr) allDateStrs.add(cutoffStr);

  const dates = Array.from(allDateStrs)
    .filter(ds => !cutoffStr || ds >= cutoffStr)
    .map(ds => new Date(ds + "T00:00:00.000Z"));

  if (dates.length === 0) return NextResponse.json([]);

  const txRecords: TxRecord[] = transactions.map(tx => ({
    date: new Date(tx.date),
    amount: tx.amount,
    type: tx.category.type as "income" | "expense",
    accountId: tx.accountId,
    accountCurrency: tx.account.currency,
  }));

  const assetHistoryRecords: AssetHistoryRecord[] = assetHistories.map(h => ({
    assetId: h.assetId,
    date: new Date(h.date),
    value: h.value,
    currency: h.asset.currency,
  }));

  const loanRecords: LoanRecord[] = loans.map(loan => ({
    id: loan.id,
    direction: loan.direction,
    initialAmount: loan.initialTransaction?.amount ?? 0,
    currency: loan.currency,
    principalPayments: loan.payments
      .filter(p => p.principalTransaction)
      .map(p => ({
        date: new Date(p.paymentDate),
        amount: p.principalTransaction!.amount,
      })),
  }));

  const rateRecords: ExchangeRateRecord[] = exchangeRates.map(r => ({
    fromCurrency: r.fromCurrency,
    toCurrency: r.toCurrency,
    rate: r.rate,
  }));

  const result = computeNetWorthHistory(
    txRecords,
    assetHistoryRecords,
    loanRecords,
    rateRecords,
    targetCurrency,
    dates
  );

  return NextResponse.json(result);
}
