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

export async function getTransactions(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<Transaction[]> {
  const { data } = await api.get<Transaction[]>("/transactions", { params });
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

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export async function importTransactions(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<ImportResult>("/transactions/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
