import api from "@/lib/axios";
import { CategoryType } from "./transaction-categories";
import { Currency } from "./accounts";

export type LoanPaymentRole = "principal" | "interest" | "prepayFee";

export interface Transaction {
  id: string;
  amount: number;
  date: string;
  description: string | null;
  details: string | null;
  accountId: string;
  account: { id: string; name: string; currency: Currency };
  categoryId: string;
  category: { id: string; name: string; type: CategoryType; icon: string | null };
  userId: string;
  createdAt: string;
  updatedAt: string;
  loanPaymentPrincipal: { id: string; loanId: string; loan: { id: string; name: string } } | null;
  loanPaymentInterest: { id: string; loanId: string; loan: { id: string; name: string } } | null;
  loanPaymentPrepayFee: { id: string; loanId: string; loan: { id: string; name: string } } | null;
}

export interface PaginatedTransactions {
  data: Transaction[];
  hasMore: boolean;
}

export async function getTransactions(params?: {
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedTransactions> {
  // Strip falsy date values so the backend doesn't receive empty strings
  const cleaned = params
    ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null))
    : undefined;
  const { data } = await api.get<PaginatedTransactions>("/transactions", { params: cleaned });
  return data;
}

export async function createTransaction(payload: {
  amount: number;
  date: string;
  description?: string;
  details?: string;
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
    details?: string;
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

export async function attachTransactionToLoan(
  id: string,
  loanId: string,
  paymentType: "principal" | "interest" | "prepayFee"
): Promise<Transaction> {
  const { data } = await api.post<Transaction>(`/transactions/${id}/attach-loan`, { loanId, paymentType });
  return data;
}

export async function importTransactions(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<ImportResult>("/transactions/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
