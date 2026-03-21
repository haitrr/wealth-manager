import api from "@/lib/axios";
import { CategoryType } from "./transaction-categories";
import { Currency } from "./accounts";

export type BudgetPeriod = "monthly" | "yearly" | "custom";

export interface Budget {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  period: BudgetPeriod;
  startDate: string;
  endDate: string | null;
  accountId: string | null;
  account: { id: string; name: string; currency: Currency } | null;
  categoryId: string | null;
  category: { id: string; name: string; type: CategoryType; icon: string | null } | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  // progress
  periodStart: string;
  periodEnd: string;
  spent: number;
  remaining: number;
  percentUsed: number;
  daysTotal: number;
  daysElapsed: number;
  daysRemaining: number;
  avgSpentPerDay: number;
  suggestedDailySpend: number;
}

export interface BudgetPayload {
  name: string;
  amount: number;
  currency?: Currency;
  period: BudgetPeriod;
  startDate?: string;
  endDate?: string;
  accountId?: string;
  categoryId?: string;
}

export async function getBudgets(): Promise<Budget[]> {
  const { data } = await api.get<Budget[]>("/budgets");
  return data;
}

export async function getBudget(id: string): Promise<Budget> {
  const { data } = await api.get<Budget>(`/budgets/${id}`);
  return data;
}

export async function createBudget(payload: BudgetPayload): Promise<Budget> {
  const { data } = await api.post<Budget>("/budgets", payload);
  return data;
}

export async function updateBudget(id: string, payload: BudgetPayload): Promise<Budget> {
  const { data } = await api.put<Budget>(`/budgets/${id}`, payload);
  return data;
}

export async function deleteBudget(id: string): Promise<void> {
  await api.delete(`/budgets/${id}`);
}

export async function getBudgetTransactions(id: string) {
  const { data } = await api.get(`/budgets/${id}/transactions`);
  return data;
}
