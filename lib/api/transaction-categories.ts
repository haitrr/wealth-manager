import api from "@/lib/axios";

export type CategoryType = "income" | "expense" | "payable" | "receivable";

export interface TransactionCategory {
  id: string;
  name: string;
  type: CategoryType;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export async function getTransactionCategories(): Promise<TransactionCategory[]> {
  const { data } = await api.get<TransactionCategory[]>("/transaction-categories");
  return data;
}

export async function createTransactionCategory(payload: {
  name: string;
  type: CategoryType;
}): Promise<TransactionCategory> {
  const { data } = await api.post<TransactionCategory>("/transaction-categories", payload);
  return data;
}

export async function updateTransactionCategory(
  id: string,
  payload: { name: string; type: CategoryType }
): Promise<TransactionCategory> {
  const { data } = await api.put<TransactionCategory>(`/transaction-categories/${id}`, payload);
  return data;
}

export async function deleteTransactionCategory(id: string): Promise<void> {
  await api.delete(`/transaction-categories/${id}`);
}
