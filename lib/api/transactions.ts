import api from "@/lib/axios";
import { CategoryType } from "./transaction-categories";
import { Currency } from "./accounts";

export interface Transaction {
  id: string;
  amount: number;
  date: string;
  description: string | null;
  accountId: string;
  account: { id: string; name: string; currency: Currency };
  categoryId: string;
  category: { id: string; name: string; type: CategoryType };
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export async function getTransactions(): Promise<Transaction[]> {
  const { data } = await api.get<Transaction[]>("/transactions");
  return data;
}

export async function createTransaction(payload: {
  amount: number;
  date: string;
  description?: string;
  accountId: string;
  categoryId: string;
}): Promise<Transaction> {
  const { data } = await api.post<Transaction>("/transactions", payload);
  return data;
}

export async function updateTransaction(
  id: string,
  payload: {
    amount: number;
    date: string;
    description?: string;
    accountId: string;
    categoryId: string;
  }
): Promise<Transaction> {
  const { data } = await api.put<Transaction>(`/transactions/${id}`, payload);
  return data;
}

export async function deleteTransaction(id: string): Promise<void> {
  await api.delete(`/transactions/${id}`);
}
