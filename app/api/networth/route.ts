import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { Currency } from "@prisma/client";

function hasExchangeRate(
  fromCurrency: Currency,
  toCurrency: Currency,
  rates: { fromCurrency: string; toCurrency: string; rate: number }[]
): boolean {
  if (fromCurrency === toCurrency) return true;
  return rates.some(r =>
    (r.fromCurrency === fromCurrency && r.toCurrency === toCurrency) ||
    (r.fromCurrency === toCurrency && r.toCurrency === fromCurrency)
  );
}

function convertToCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  rates: { fromCurrency: string; toCurrency: string; rate: number }[]
): number {
  if (fromCurrency === toCurrency) return amount;
  const direct = rates.find(r => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency);
  if (direct) return amount * direct.rate;
  const inverse = rates.find(r => r.fromCurrency === toCurrency && r.toCurrency === fromCurrency);
  if (inverse) return amount / inverse.rate;
  return amount;
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [settings, accounts, assets, loans, exchangeRates] = await Promise.all([
    prisma.userSettings.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId },
      update: {},
    }),
    prisma.account.findMany({
      where: { userId: session.userId },
      include: { transactions: { include: { category: { select: { type: true } } } } },
    }),
    prisma.asset.findMany({
      where: { userId: session.userId, OR: [{ sellDate: null }, { sellDate: { gt: new Date() } }] },
    }),
    prisma.loan.findMany({
      where: { userId: session.userId, status: "active" },
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
  const missingRates: string[] = [];

  function convert(amount: number, fromCurrency: Currency): number {
    if (fromCurrency !== targetCurrency && !hasExchangeRate(fromCurrency, targetCurrency, exchangeRates)) {
      missingRates.push(`${fromCurrency}/${targetCurrency}`);
    }
    return convertToCurrency(amount, fromCurrency, targetCurrency, exchangeRates);
  }

  const accountItems = accounts.map(({ transactions, ...a }) => {
    const balance = transactions.reduce((sum, tx) => {
      const isIncome = tx.category.type === "income";
      return sum + (isIncome ? tx.amount : -tx.amount);
    }, 0);
    return {
      id: a.id,
      name: a.name,
      balance,
      currency: a.currency,
      valueInTarget: convert(balance, a.currency),
    };
  });

  const assetItems = assets.map(a => ({
    ...a,
    valueInTarget: convert(a.currentValue, a.currency),
  }));

  const loanItems = loans.map(loan => {
    const principalAmount = loan.initialTransaction?.amount ?? 0;
    const paidPrincipal = loan.payments.reduce((sum, p) => sum + (p.principalTransaction?.amount ?? 0), 0);
    const outstandingPrincipal = Math.max(0, principalAmount - paidPrincipal);
    return {
      id: loan.id,
      name: loan.name,
      direction: loan.direction,
      outstandingPrincipal,
      currency: loan.currency,
      valueInTarget: convert(outstandingPrincipal, loan.currency),
    };
  });

  const borrowedLoans = loanItems.filter(l => l.direction === "borrowed");

  const liquidTotal = accountItems.reduce((s, a) => s + a.valueInTarget, 0);
  const assetsByType = {
    real_estate: assetItems.filter(a => a.type === "real_estate"),
    stock: assetItems.filter(a => a.type === "stock"),
    bond: assetItems.filter(a => a.type === "bond"),
    gold: assetItems.filter(a => a.type === "gold"),
  };
  const assetsTotal = assetItems.reduce((s, a) => s + a.valueInTarget, 0);
  const liabilitiesTotal = borrowedLoans.reduce((s, l) => s + l.valueInTarget, 0);

  return NextResponse.json({
    currency: targetCurrency,
    totalNetWorth: liquidTotal + assetsTotal - liabilitiesTotal,
    missingRates: [...new Set(missingRates)],
    liquid: { total: liquidTotal, accounts: accountItems },
    assets: {
      total: assetsTotal,
      byType: {
        real_estate: { total: assetsByType.real_estate.reduce((s, a) => s + a.valueInTarget, 0), items: assetsByType.real_estate },
        stock: { total: assetsByType.stock.reduce((s, a) => s + a.valueInTarget, 0), items: assetsByType.stock },
        bond: { total: assetsByType.bond.reduce((s, a) => s + a.valueInTarget, 0), items: assetsByType.bond },
        gold: { total: assetsByType.gold.reduce((s, a) => s + a.valueInTarget, 0), items: assetsByType.gold },
      },
    },
    liabilities: { total: liabilitiesTotal, loans: borrowedLoans },
  });
}
