import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { Currency } from "@prisma/client";

function convertToUsd(
  amount: number,
  currency: Currency,
  rates: { fromCurrency: string; toCurrency: string; rate: number }[]
): number {
  if (currency === "USD") return amount;
  const direct = rates.find(r => r.fromCurrency === currency && r.toCurrency === "USD");
  if (direct) return amount * direct.rate;
  const inverse = rates.find(r => r.fromCurrency === "USD" && r.toCurrency === currency);
  if (inverse) return amount / inverse.rate;
  return amount;
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [accounts, assets, loans, exchangeRates] = await Promise.all([
    prisma.account.findMany({ where: { userId: session.userId } }),
    prisma.asset.findMany({ where: { userId: session.userId } }),
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

  const missingRates: string[] = [];

  const accountItems = accounts.map(a => {
    const valueInUsd = convertToUsd(a.balance, a.currency, exchangeRates);
    if (a.currency !== "USD" && valueInUsd === a.balance) missingRates.push(`${a.currency}/USD`);
    return { id: a.id, name: a.name, balance: a.balance, currency: a.currency, valueInUsd };
  });

  const assetItems = assets.map(a => {
    const valueInUsd = convertToUsd(a.currentValue, a.currency, exchangeRates);
    if (a.currency !== "USD" && valueInUsd === a.currentValue) missingRates.push(`${a.currency}/USD`);
    return { ...a, valueInUsd };
  });

  const loanItems = loans.map(loan => {
    const principalAmount = loan.initialTransaction?.amount ?? 0;
    const paidPrincipal = loan.payments.reduce((sum, p) => sum + (p.principalTransaction?.amount ?? 0), 0);
    const outstandingPrincipal = Math.max(0, principalAmount - paidPrincipal);
    const valueInUsd = convertToUsd(outstandingPrincipal, loan.currency, exchangeRates);
    return { id: loan.id, name: loan.name, direction: loan.direction, outstandingPrincipal, currency: loan.currency, valueInUsd };
  });

  const borrowedLoans = loanItems.filter(l => l.direction === "borrowed");

  const liquidTotal = accountItems.reduce((s, a) => s + a.valueInUsd, 0);
  const assetsByType = {
    real_estate: assetItems.filter(a => a.type === "real_estate"),
    stock: assetItems.filter(a => a.type === "stock"),
    bond: assetItems.filter(a => a.type === "bond"),
    gold: assetItems.filter(a => a.type === "gold"),
  };
  const assetsTotal = assetItems.reduce((s, a) => s + a.valueInUsd, 0);
  const liabilitiesTotal = borrowedLoans.reduce((s, l) => s + l.valueInUsd, 0);

  return NextResponse.json({
    totalNetWorth: liquidTotal + assetsTotal - liabilitiesTotal,
    missingRates: [...new Set(missingRates)],
    liquid: { total: liquidTotal, accounts: accountItems },
    assets: {
      total: assetsTotal,
      byType: {
        real_estate: { total: assetsByType.real_estate.reduce((s, a) => s + a.valueInUsd, 0), items: assetsByType.real_estate },
        stock: { total: assetsByType.stock.reduce((s, a) => s + a.valueInUsd, 0), items: assetsByType.stock },
        bond: { total: assetsByType.bond.reduce((s, a) => s + a.valueInUsd, 0), items: assetsByType.bond },
        gold: { total: assetsByType.gold.reduce((s, a) => s + a.valueInUsd, 0), items: assetsByType.gold },
      },
    },
    liabilities: { total: liabilitiesTotal, loans: borrowedLoans },
  });
}
