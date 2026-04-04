import { Currency, LoanDirection, LoanStatus, Prisma } from "@prisma/client";
import { prisma } from "@/app/lib/db";

export const LOAN_INCLUDE = {
  account: { select: { id: true, name: true, currency: true } },
  initialTransaction: { select: { id: true, amount: true, date: true, categoryId: true } },
  principalCategory: { select: { id: true, name: true, type: true } },
  interestCategory: { select: { id: true, name: true, type: true } },
  prepayFeeCategory: { select: { id: true, name: true, type: true } },
  payments: {
    orderBy: [{ paymentDate: "desc" as const }],
    include: {
      account: { select: { id: true, name: true, currency: true } },
      principalTransaction: { select: { id: true, amount: true, date: true, description: true, categoryId: true } },
      interestTransaction: { select: { id: true, amount: true, date: true, description: true, categoryId: true } },
      prepayFeeTransaction: { select: { id: true, amount: true, date: true, description: true, categoryId: true } },
    },
  },
} satisfies Prisma.LoanInclude;

export type LoanWithRelations = Prisma.LoanGetPayload<{ include: typeof LOAN_INCLUDE }>;
export type LoanTransactionClient = Prisma.TransactionClient;

const LOAN_DIRECTIONS = new Set<LoanDirection>(["borrowed", "lent"]);
const LOAN_STATUSES = new Set<LoanStatus>(["active", "closed"]);

export interface LoanPayload {
  name: string;
  direction: string;
  principalAmount: number;
  currency?: string;
  startDate: string;
  counterpartyName?: string;
  notes?: string;
  status?: string;
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

export function parseLoanPayload(payload: LoanPayload) {
  const name = payload.name?.trim();
  if (!name) throw new Error("Name is required");
  if (!LOAN_DIRECTIONS.has(payload.direction as LoanDirection)) throw new Error("Invalid loan direction");
  if (!Number.isFinite(Number(payload.principalAmount)) || Number(payload.principalAmount) <= 0) {
    throw new Error("Principal amount must be positive");
  }

  const currency = (payload.currency ?? "USD") as Currency;
  if (currency !== "USD" && currency !== "VND") throw new Error("Invalid currency");

  const status = (payload.status ?? "active") as LoanStatus;
  if (!LOAN_STATUSES.has(status)) throw new Error("Invalid loan status");

  const startDate = new Date(payload.startDate);
  if (Number.isNaN(startDate.getTime())) throw new Error("Start date is required");
  if (!payload.accountId) throw new Error("Account is required");

  return {
    name,
    direction: payload.direction as LoanDirection,
    principalAmount: Number(payload.principalAmount),
    currency,
    startDate,
    counterpartyName: payload.counterpartyName?.trim() || null,
    notes: payload.notes?.trim() || null,
    status,
    accountId: payload.accountId,
    principalCategoryId: payload.principalCategoryId || null,
    interestCategoryId: payload.interestCategoryId || null,
    prepayFeeCategoryId: payload.prepayFeeCategoryId || null,
  };
}

export function parseLoanPaymentPayload(payload: LoanPaymentPayload) {
  const paymentDate = new Date(payload.paymentDate);
  if (Number.isNaN(paymentDate.getTime())) throw new Error("Payment date is required");
  if (!payload.accountId) throw new Error("Account is required");

  const principalAmount = Number(payload.principalAmount ?? 0);
  const interestAmount = Number(payload.interestAmount ?? 0);
  const prepayFeeAmount = Number(payload.prepayFeeAmount ?? 0);

  if (!Number.isFinite(principalAmount) || principalAmount < 0) throw new Error("Principal amount is invalid");
  if (!Number.isFinite(interestAmount) || interestAmount < 0) throw new Error("Interest amount is invalid");
  if (!Number.isFinite(prepayFeeAmount) || prepayFeeAmount < 0) throw new Error("Prepay fee amount is invalid");
  if (principalAmount + interestAmount + prepayFeeAmount <= 0) throw new Error("Payment must have at least one non-zero amount");

  return {
    accountId: payload.accountId,
    paymentDate,
    principalAmount,
    interestAmount,
    prepayFeeAmount,
    note: payload.note?.trim() || null,
  };
}

export async function getOwnedLoan(loanId: string, userId: string) {
  return prisma.loan.findFirst({
    where: { id: loanId, userId },
    include: LOAN_INCLUDE,
  });
}

export async function getOwnedLoanPayment(loanId: string, paymentId: string, userId: string) {
  return prisma.loanPayment.findFirst({
    where: { id: paymentId, loanId, userId },
  });
}

export async function ensureOwnedAccount(accountId: string, userId: string) {
  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
  if (!account) throw new Error("Account not found");
  return account;
}

export async function ensureLoanInitialCategory(
  tx: LoanTransactionClient,
  userId: string,
  direction: LoanDirection
) {
  // Borrowed: income (received loan money, balance increases)
  // Lent: expense (gave money out, balance decreases)
  const config = direction === "borrowed"
    ? { name: "Loan Received", type: "income" as const }
    : { name: "Loan Given", type: "expense" as const };

  const existing = await tx.transactionCategory.findFirst({
    where: { userId, name: config.name, type: config.type },
  });
  if (existing) return existing;

  return tx.transactionCategory.create({
    data: { name: config.name, type: config.type, userId, icon: null },
  });
}

export async function ensureLoanTransactionCategory(
  tx: LoanTransactionClient,
  userId: string,
  direction: LoanDirection,
  type: "principal" | "interest" | "prepay_fee" = "principal",
  categoryId?: string | null,
  globalCategoryId?: string | null
) {
  if (categoryId) {
    const configured = await tx.transactionCategory.findFirst({ where: { id: categoryId, userId } });
    if (configured) return configured;
  }

  if (globalCategoryId) {
    const global = await tx.transactionCategory.findFirst({ where: { id: globalCategoryId, userId } });
    if (global) return global;
  }

  const configs = {
    principal: direction === "borrowed"
      ? { name: "Loan Repayment", type: "expense" as const }
      : { name: "Loan Collection", type: "income" as const },
    interest: { name: "Loan Interest", type: direction === "borrowed" ? "expense" as const : "income" as const },
    prepay_fee: { name: "Loan Prepay Fee", type: "expense" as const },
  };

  const config = configs[type];
  const existing = await tx.transactionCategory.findFirst({
    where: { userId, name: config.name, type: config.type },
  });
  if (existing) return existing;

  return tx.transactionCategory.create({
    data: { name: config.name, type: config.type, userId, icon: null },
  });
}

export function getLoanPrincipalAmount(loan: LoanWithRelations): number {
  return loan.initialTransaction?.amount ?? 0;
}

export function serializeLoan(loan: LoanWithRelations) {
  const principalAmount = getLoanPrincipalAmount(loan);
  const paidPrincipal = loan.payments.reduce((sum, p) => sum + (p.principalTransaction?.amount ?? 0), 0);
  const remainingPrincipal = Math.max(0, principalAmount - paidPrincipal);
  const progressPercent = principalAmount === 0
    ? 100
    : Math.max(0, Math.min(100, (paidPrincipal / principalAmount) * 100));

  return {
    ...loan,
    principalAmount,
    summary: { remainingPrincipal, progressPercent },
  };
}
