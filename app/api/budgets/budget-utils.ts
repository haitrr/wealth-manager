import { Budget, Account, TransactionCategory } from "@prisma/client";

export type BudgetPeriod = "monthly" | "yearly" | "custom";

export type BudgetWithRelations = Budget & {
  account: Pick<Account, "id" | "name"> | null;
  category: Pick<TransactionCategory, "id" | "name" | "type"> | null;
};

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
