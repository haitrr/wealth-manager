import api from "@/lib/axios";
import { Currency } from "./accounts";

export type LoanDirection = "borrowed" | "lent";
export type LoanStatus = "active" | "closed";

export interface LoanTransaction {
  id: string;
  amount: number;
  date: string;
  description: string;
  categoryId: string | null;
}

export interface LoanPayment {
  id: string;
  loanId: string;
  accountId: string;
  account: { id: string; name: string; currency: Currency };
  paymentDate: string;
  principalTransactionId: string | null;
  interestTransactionId: string | null;
  prepayFeeTransactionId: string | null;
  principalTransaction: LoanTransaction | null;
  interestTransaction: LoanTransaction | null;
  prepayFeeTransaction: LoanTransaction | null;
  note: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoanSummary {
  remainingPrincipal: number;
  progressPercent: number;
}

export interface LoanCategoryConfig {
  id: string;
  name: string;
  type: string;
}

export interface Loan {
  id: string;
  name: string;
  direction: LoanDirection;
  principalAmount: number;
  currency: Currency;
  startDate: string;
  counterpartyName: string | null;
  notes: string | null;
  status: LoanStatus;
  accountId: string;
  account: { id: string; name: string; currency: Currency };
  principalCategoryId: string | null;
  principalCategory: LoanCategoryConfig | null;
  interestCategoryId: string | null;
  interestCategory: LoanCategoryConfig | null;
  prepayFeeCategoryId: string | null;
  prepayFeeCategory: LoanCategoryConfig | null;
  userId: string;
  payments: LoanPayment[];
  createdAt: string;
  updatedAt: string;
  summary: LoanSummary;
}

export interface LoanPayload {
  name: string;
  direction: LoanDirection;
  principalAmount: number;
  currency: Currency;
  startDate: string;
  counterpartyName?: string;
  notes?: string;
  status?: LoanStatus;
  accountId: string;
  principalCategoryId?: string | null;
  interestCategoryId?: string | null;
  prepayFeeCategoryId?: string | null;
}

export interface LoanPaymentPayload {
  accountId: string;
  paymentDate: string;
  principalAmount?: number;
  interestAmount?: number;
  prepayFeeAmount?: number;
  note?: string;
}

export async function getLoans(): Promise<Loan[]> {
  const { data } = await api.get<Loan[]>("/loans");
  return data;
}

export async function getLoan(id: string): Promise<Loan> {
  const { data } = await api.get<Loan>(`/loans/${id}`);
  return data;
}

export async function createLoan(payload: LoanPayload): Promise<Loan> {
  const { data } = await api.post<Loan>("/loans", payload);
  return data;
}

export async function updateLoan(id: string, payload: LoanPayload): Promise<Loan> {
  const { data } = await api.put<Loan>(`/loans/${id}`, payload);
  return data;
}

export async function deleteLoan(id: string): Promise<void> {
  await api.delete(`/loans/${id}`);
}

export async function createLoanPayment(id: string, payload: LoanPaymentPayload): Promise<Loan> {
  const { data } = await api.post<Loan>(`/loans/${id}/payments`, payload);
  return data;
}

export async function updateLoanPayment(id: string, paymentId: string, payload: LoanPaymentPayload): Promise<Loan> {
  const { data } = await api.put<Loan>(`/loans/${id}/payments/${paymentId}`, payload);
  return data;
}

export async function deleteLoanPayment(id: string, paymentId: string): Promise<Loan> {
  const { data } = await api.delete<Loan>(`/loans/${id}/payments/${paymentId}`);
  return data;
}
