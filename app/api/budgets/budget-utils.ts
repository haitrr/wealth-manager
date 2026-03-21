import { Budget, Account, TransactionCategory, Currency, CategoryType } from "@prisma/client";
import { prisma } from "@/app/lib/db";

export type BudgetPeriod = "monthly" | "yearly" | "custom";

export type CategorySummary = Pick<TransactionCategory, "id" | "name" | "type" | "icon">;

export type BudgetWithRelations = Budget & {
  account: Pick<Account, "id" | "name" | "currency"> | null;
  categories: CategorySummary[];
  excludedCategories: CategorySummary[];
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
  if (fromCurrency === toCurrency) return amount;

  const directRate = await prisma.exchangeRate.findUnique({
    where: { userId_fromCurrency_toCurrency: { userId, fromCurrency, toCurrency } },
  });
  if (directRate) return amount * directRate.rate;

  const inverseRate = await prisma.exchangeRate.findUnique({
    where: { userId_fromCurrency_toCurrency: { userId, fromCurrency: toCurrency, toCurrency: fromCurrency } },
  });
  if (inverseRate) return amount / inverseRate.rate;

  return amount;
}

/**
 * Returns the given category ID plus all descendant category IDs (recursive children).
 */
export async function getCategoryIdWithDescendants(categoryId: string, userId: string): Promise<string[]> {
  const allCategories = await prisma.transactionCategory.findMany({
    where: { userId },
    select: { id: true, parentId: true },
  });

  const ids = new Set<string>();
  const queue = [categoryId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    ids.add(current);
    for (const cat of allCategories) {
      if (cat.parentId === current) queue.push(cat.id);
    }
  }
  return Array.from(ids);
}

/**
 * Builds a Prisma transaction `where` filter for a budget's category configuration.
 * - categoryIds: include only these categories (and their descendants)
 * - excludedCategoryIds: all expense/payable except these (and their descendants)
 * - neither: all expense/payable
 */
export async function getCategoryFilter(
  budget: Pick<Budget, "categoryIds" | "excludedCategoryIds">,
  userId: string
) {
  if (budget.categoryIds.length > 0) {
    const allIds = new Set<string>();
    for (const catId of budget.categoryIds) {
      const descendants = await getCategoryIdWithDescendants(catId, userId);
      descendants.forEach((id) => allIds.add(id));
    }
    return { categoryId: { in: Array.from(allIds) } };
  }

  if (budget.excludedCategoryIds.length > 0) {
    const excludedIds = new Set<string>();
    for (const catId of budget.excludedCategoryIds) {
      const descendants = await getCategoryIdWithDescendants(catId, userId);
      descendants.forEach((id) => excludedIds.add(id));
    }
    return {
      AND: [
        { category: { type: { in: ["expense", "payable"] as CategoryType[] } } },
        { categoryId: { notIn: Array.from(excludedIds) } },
      ],
    };
  }

  return { category: { type: { in: ["expense", "payable"] as CategoryType[] } } };
}

/**
 * Resolves category IDs to full category objects for display.
 */
export async function resolveCategorySummaries(ids: string[]): Promise<CategorySummary[]> {
  if (ids.length === 0) return [];
  return prisma.transactionCategory.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, type: true, icon: true },
  });
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
