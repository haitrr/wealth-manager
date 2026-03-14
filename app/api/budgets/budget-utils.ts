import { Budget, Account, TransactionCategory, Currency } from "@prisma/client";
import { prisma } from "@/app/lib/db";

export type BudgetPeriod = "monthly" | "yearly" | "custom";

export type BudgetWithRelations = Budget & {
  account: Pick<Account, "id" | "name"> | null;
  category: Pick<TransactionCategory, "id" | "name" | "type"> | null;
};

/**
 * Convert an amount from one currency to another using user's exchange rates.
 * Returns the original amount if currencies are the same or no exchange rate is found.
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  userId: string
): Promise<number> {
  // No conversion needed if currencies are the same
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Try to find a direct exchange rate
  const directRate = await prisma.exchangeRate.findUnique({
    where: {
      userId_fromCurrency_toCurrency: {
        userId,
        fromCurrency,
        toCurrency,
      },
    },
  });

  if (directRate) {
    return amount * directRate.rate;
  }

  // Try to find an inverse exchange rate (e.g., if we need USD->VND but only have VND->USD)
  const inverseRate = await prisma.exchangeRate.findUnique({
    where: {
      userId_fromCurrency_toCurrency: {
        userId,
        fromCurrency: toCurrency,
        toCurrency: fromCurrency,
      },
    },
  });

  if (inverseRate) {
    return amount / inverseRate.rate;
  }

  // No exchange rate found, return original amount
  // (you might want to log a warning here)
  return amount;
}

export function getPeriodBounds(budget: Budget, now: Date): { start: Date; end: Date } {
  if (budget.period === "custom") {
    return { start: new Date(budget.startDate), end: new Date(budget.endDate!) };
  }
  if (budget.period === "yearly") {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { start, end };
  }
  // monthly
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function computeProgress(budget: Budget, spent: number, now: Date) {
  const { start, end } = getPeriodBounds(budget, now);
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysTotal = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / msPerDay));
  const daysElapsed = Math.max(1, Math.min(daysTotal, Math.ceil((now.getTime() - start.getTime()) / msPerDay)));
  const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / msPerDay));
  const remaining = budget.amount - spent;
  const percentUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  const avgSpentPerDay = spent / daysElapsed;
  const suggestedDailySpend = daysRemaining > 0 ? remaining / daysRemaining : 0;

  return {
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    spent,
    remaining,
    percentUsed,
    daysTotal,
    daysElapsed,
    daysRemaining,
    avgSpentPerDay,
    suggestedDailySpend,
  };
}
