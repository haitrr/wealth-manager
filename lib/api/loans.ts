import api from "@/lib/axios";
import { Currency } from "./accounts";

export type LoanDirection = "borrowed" | "lent";
export type LoanProductType = "installment" | "bullet";
export type LoanInstallmentStrategy = "equal_principal" | "annuity" | "bullet";
export type RepaymentFrequency = "monthly" | "quarterly" | "yearly";
export type LoanStatus = "draft" | "active" | "closed";
export type LoanRatePeriodType = "fixed" | "floating";
export type LoanPaymentKind = "scheduled" | "prepayment" | "adjustment";
export type LoanScheduleStatus = "pending" | "partially_paid" | "paid";
export type PrepaymentStrategy = "reduce_payment" | "shorten_term";

export interface LoanRatePeriod {
  id: string;
  loanId: string;
  periodType: LoanRatePeriodType;
  annualRate: number;
  startDate: string;
  endDate: string | null;
  repricingIntervalMonths: number | null;
  sequence: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoanScheduleEntry {
  id: string;
  loanId: string;
  ratePeriodId: string | null;
  installmentIndex: number;
  dueDate: string;
  openingPrincipal: number;
  scheduledPrincipal: number;
  scheduledInterest: number;
  scheduledTotal: number;
  closingPrincipal: number;
  appliedAnnualRate: number;
  status: LoanScheduleStatus;
  paidPrincipal: number;
  paidInterest: number;
  paidTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoanPayment {
  id: string;
  loanId: string;
  accountId: string;
  transactionId: string | null;
  paymentDate: string;
  paymentKind: LoanPaymentKind;
  totalAmount: number;
  principalAmount: number;
  interestAmount: number;
  prepaymentStrategy: PrepaymentStrategy | null;
  note: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoanSummary {
  principalAmount: number;
  remainingPrincipal: number;
  totalScheduledInterest: number;
  totalScheduledAmount: number;
  nextDueDate: string | null;
  currentAnnualRate: number;
  currentRatePeriodType: LoanRatePeriodType;
  progressPercent: number;
}

export interface Loan {
  id: string;
  name: string;
  direction: LoanDirection;
  productType: LoanProductType;
  installmentStrategy: LoanInstallmentStrategy;
  principalAmount: number;
  remainingPrincipal: number;
  currency: Currency;
  termMonths: number;
  repaymentFrequency: RepaymentFrequency;
  startDate: string;
  firstPaymentDate: string;
  counterpartyName: string | null;
  notes: string | null;
  status: LoanStatus;
  accountId: string;
  account: { id: string; name: string; currency: Currency };
  userId: string;
  ratePeriods: LoanRatePeriod[];
  scheduleEntries: LoanScheduleEntry[];
  payments: LoanPayment[];
  createdAt: string;
  updatedAt: string;
  summary: LoanSummary;
}

export interface LoanRatePeriodPayload {
  periodType: LoanRatePeriodType;
  annualRate: number;
  startDate: string;
  endDate?: string | null;
  repricingIntervalMonths?: number | null;
}

export interface LoanPayload {
  name: string;
  direction: LoanDirection;
  productType: LoanProductType;
  installmentStrategy: LoanInstallmentStrategy;
  principalAmount: number;
  currency: Currency;
  termMonths: number;
  repaymentFrequency?: RepaymentFrequency;
  startDate: string;
  firstPaymentDate: string;
  counterpartyName?: string;
  notes?: string;
  status?: LoanStatus;
  accountId: string;
  ratePeriods: LoanRatePeriodPayload[];
}

export interface LoanPaymentPayload {
  accountId: string;
  paymentDate: string;
  paymentKind?: LoanPaymentKind;
  totalAmount: number;
  principalAmount: number;
  interestAmount: number;
  note?: string;
  prepaymentStrategy?: PrepaymentStrategy;
}

export interface LoanRepricingPayload {
  effectiveDate: string;
  annualRate: number;
  repricingIntervalMonths?: number | null;
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

export async function repriceLoan(id: string, payload: LoanRepricingPayload): Promise<Loan> {
  const { data } = await api.post<Loan>(`/loans/${id}/repricing`, payload);
  return data;
}
