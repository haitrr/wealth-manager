import {
  Currency,
  LoanDirection,
  LoanInstallmentStrategy,
  LoanPaymentKind,
  LoanProductType,
  LoanStatus,
  Prisma,
  RepaymentFrequency,
} from "@prisma/client";
import { prisma } from "@/app/lib/db";
import {
  generateLoanSchedule,
  LoanComputationInput,
  LoanRatePeriodInput,
  REPAYMENT_INTERVAL_MONTHS,
  roundCurrency,
  summarizeLoan,
} from "./loan-utils";

const LOAN_INCLUDE = {
  account: { select: { id: true, name: true, currency: true } },
  ratePeriods: { orderBy: [{ sequence: "asc" }] },
  scheduleEntries: { orderBy: [{ installmentIndex: "asc" }] },
  payments: {
    orderBy: [{ paymentDate: "desc" }],
    include: {
      account: { select: { id: true, name: true, currency: true } },
      transaction: {
        select: {
          id: true,
          amount: true,
          date: true,
          description: true,
          categoryId: true,
        },
      },
    },
  },
} satisfies Prisma.LoanInclude;

const LOAN_DIRECTIONS = new Set<LoanDirection>(["borrowed", "lent"]);
const LOAN_PRODUCT_TYPES = new Set<LoanProductType>(["installment", "bullet"]);
const LOAN_STRATEGIES = new Set<LoanInstallmentStrategy>(["equal_principal", "annuity", "bullet"]);
const LOAN_STATUSES = new Set<LoanStatus>(["draft", "active", "closed"]);
const REPAYMENT_FREQUENCIES = new Set<RepaymentFrequency>(["monthly", "quarterly", "yearly"]);
const LOAN_PAYMENT_KINDS = new Set<LoanPaymentKind>(["scheduled", "prepayment", "adjustment"]);

export type LoanWithRelations = Prisma.LoanGetPayload<{ include: typeof LOAN_INCLUDE }>;
export type LoanTransactionClient = Prisma.TransactionClient;

export interface LoanRatePeriodPayload {
  periodType: string;
  annualRate: number;
  startDate: string;
  endDate?: string | null;
  repricingIntervalMonths?: number | null;
}

export interface LoanPayload {
  name: string;
  direction: string;
  productType: string;
  installmentStrategy: string;
  principalAmount: number;
  currency?: string;
  termMonths: number;
  repaymentFrequency?: string;
  startDate: string;
  firstPaymentDate: string;
  counterpartyName?: string;
  notes?: string;
  status?: string;
  accountId: string;
  ratePeriods: LoanRatePeriodPayload[];
}

export interface LoanPaymentPayload {
  accountId: string;
  paymentDate: string;
  paymentKind?: string;
  totalAmount: number;
  principalAmount: number;
  interestAmount: number;
  note?: string;
  prepaymentStrategy?: string;
}

export interface LoanRepricingPayload {
  effectiveDate: string;
  annualRate: number;
  repricingIntervalMonths?: number | null;
}

export type PrepaymentStrategy = "reduce_payment" | "shorten_term";

export function parseLoanPayload(payload: LoanPayload) {
  const name = payload.name?.trim();
  if (!name) throw new Error("Name is required");
  if (!LOAN_DIRECTIONS.has(payload.direction as LoanDirection)) throw new Error("Invalid loan direction");
  if (!LOAN_PRODUCT_TYPES.has(payload.productType as LoanProductType)) throw new Error("Invalid loan product type");
  if (!LOAN_STRATEGIES.has(payload.installmentStrategy as LoanInstallmentStrategy)) {
    throw new Error("Invalid installment strategy");
  }
  if (!Number.isFinite(Number(payload.principalAmount)) || Number(payload.principalAmount) <= 0) {
    throw new Error("Principal amount must be positive");
  }
  if (!Number.isInteger(Number(payload.termMonths)) || Number(payload.termMonths) <= 0) {
    throw new Error("Term months must be a positive integer");
  }

  const currency = (payload.currency ?? "USD") as Currency;
  if (currency !== "USD" && currency !== "VND") throw new Error("Invalid currency");

  const repaymentFrequency = (payload.repaymentFrequency ?? "monthly") as RepaymentFrequency;
  if (!REPAYMENT_FREQUENCIES.has(repaymentFrequency)) throw new Error("Invalid repayment frequency");

  const status = (payload.status ?? "active") as LoanStatus;
  if (!LOAN_STATUSES.has(status)) throw new Error("Invalid loan status");

  const startDate = new Date(payload.startDate);
  const firstPaymentDate = new Date(payload.firstPaymentDate);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(firstPaymentDate.getTime())) {
    throw new Error("Start date and first payment date are required");
  }
  if (!payload.accountId) throw new Error("Account is required");

  if (!Array.isArray(payload.ratePeriods) || payload.ratePeriods.length === 0) {
    throw new Error("At least one rate period is required");
  }

  const ratePeriods: LoanRatePeriodInput[] = payload.ratePeriods.map((period, index) => {
    const start = new Date(period.startDate);
    const end = period.endDate ? new Date(period.endDate) : null;
    if (Number.isNaN(start.getTime()) || (end && Number.isNaN(end.getTime()))) {
      throw new Error("Rate period dates are invalid");
    }
    return {
      periodType: period.periodType as LoanRatePeriodInput["periodType"],
      annualRate: Number(period.annualRate),
      startDate: start,
      endDate: end,
      repricingIntervalMonths: period.repricingIntervalMonths ?? null,
      sequence: index + 1,
    };
  });

  const productType = payload.productType as LoanProductType;
  const installmentStrategy = payload.installmentStrategy as LoanInstallmentStrategy;
  if (productType === "bullet" && installmentStrategy !== "bullet") {
    throw new Error("Bullet loans must use the bullet installment strategy");
  }
  if (productType === "installment" && installmentStrategy === "bullet") {
    throw new Error("Installment loans must use equal_principal or annuity strategy");
  }

  const computationInput: LoanComputationInput = {
    productType,
    installmentStrategy,
    principalAmount: Number(payload.principalAmount),
    remainingPrincipal: Number(payload.principalAmount),
    currency,
    termMonths: Number(payload.termMonths),
    repaymentFrequency,
    startDate,
    firstPaymentDate,
    direction: payload.direction as LoanDirection,
  };

  return {
    data: {
      name,
      direction: payload.direction as LoanDirection,
      productType,
      installmentStrategy,
      principalAmount: Number(payload.principalAmount),
      remainingPrincipal: Number(payload.principalAmount),
      currency,
      termMonths: Number(payload.termMonths),
      repaymentFrequency,
      startDate,
      firstPaymentDate,
      counterpartyName: payload.counterpartyName?.trim() || null,
      notes: payload.notes?.trim() || null,
      status,
      accountId: payload.accountId,
    },
    ratePeriods,
    computationInput,
  };
}

export function parseLoanPaymentPayload(payload: LoanPaymentPayload) {
  const paymentDate = new Date(payload.paymentDate);
  if (Number.isNaN(paymentDate.getTime())) throw new Error("Payment date is required");
  if (!payload.accountId) throw new Error("Account is required");

  const totalAmount = Number(payload.totalAmount);
  const principalAmount = Number(payload.principalAmount);
  const interestAmount = Number(payload.interestAmount);
  const paymentKind = (payload.paymentKind ?? "scheduled") as LoanPaymentKind;

  if (!LOAN_PAYMENT_KINDS.has(paymentKind)) throw new Error("Invalid payment kind");
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) throw new Error("Total amount must be positive");
  if (!Number.isFinite(principalAmount) || principalAmount < 0) throw new Error("Principal amount is invalid");
  if (!Number.isFinite(interestAmount) || interestAmount < 0) throw new Error("Interest amount is invalid");

  const expectedTotal = Number((principalAmount + interestAmount).toFixed(2));
  const normalizedTotal = Number(totalAmount.toFixed(2));
  if (Math.abs(expectedTotal - normalizedTotal) > 0.01) {
    throw new Error("Total amount must equal principal plus interest");
  }

  const prepaymentStrategy = (payload.prepaymentStrategy ?? "reduce_payment") as PrepaymentStrategy;
  if (!["reduce_payment", "shorten_term"].includes(prepaymentStrategy)) {
    throw new Error("Invalid prepayment strategy");
  }

  return {
    accountId: payload.accountId,
    paymentDate,
    paymentKind,
    totalAmount,
    principalAmount,
    interestAmount,
    note: payload.note?.trim() || null,
    prepaymentStrategy,
  };
}

export function parseLoanRepricingPayload(payload: LoanRepricingPayload) {
  const effectiveDate = new Date(payload.effectiveDate);
  if (Number.isNaN(effectiveDate.getTime())) throw new Error("Effective date is required");
  const annualRate = Number(payload.annualRate);
  if (!Number.isFinite(annualRate) || annualRate < 0) throw new Error("Annual rate must be zero or positive");

  const repricingIntervalMonths = payload.repricingIntervalMonths == null
    ? null
    : Number(payload.repricingIntervalMonths);

  if (repricingIntervalMonths != null && (!Number.isInteger(repricingIntervalMonths) || repricingIntervalMonths <= 0)) {
    throw new Error("Repricing interval must be a positive integer");
  }

  return {
    effectiveDate,
    annualRate,
    repricingIntervalMonths,
  };
}

export async function getOwnedLoan(loanId: string, userId: string) {
  return prisma.loan.findFirst({
    where: { id: loanId, userId },
    include: LOAN_INCLUDE,
  });
}

export async function ensureOwnedAccount(accountId: string, userId: string) {
  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
  if (!account) throw new Error("Account not found");
  return account;
}

export function getRatePeriodInputs(loan: LoanWithRelations): LoanRatePeriodInput[] {
  return loan.ratePeriods.map((period) => ({
    id: period.id,
    periodType: period.periodType,
    annualRate: period.annualRate,
    startDate: period.startDate,
    endDate: period.endDate,
    repricingIntervalMonths: period.repricingIntervalMonths,
    sequence: period.sequence,
  }));
}

export function getLoanComputationInput(
  loan: LoanWithRelations,
  overrides: Partial<LoanComputationInput> = {}
): LoanComputationInput {
  return {
    productType: loan.productType,
    installmentStrategy: loan.installmentStrategy,
    principalAmount: overrides.principalAmount ?? loan.principalAmount,
    remainingPrincipal: overrides.remainingPrincipal ?? loan.remainingPrincipal,
    currency: overrides.currency ?? loan.currency,
    termMonths: overrides.termMonths ?? loan.termMonths,
    repaymentFrequency: overrides.repaymentFrequency ?? loan.repaymentFrequency,
    startDate: overrides.startDate ?? loan.startDate,
    firstPaymentDate: overrides.firstPaymentDate ?? loan.firstPaymentDate,
    direction: overrides.direction ?? loan.direction,
  };
}

export async function ensureLoanTransactionCategory(
  tx: LoanTransactionClient,
  userId: string,
  direction: LoanDirection
) {
  const name = direction === "borrowed" ? "Loan Repayment" : "Loan Collection";
  const type = direction === "borrowed" ? "payable" : "receivable";

  const existing = await tx.transactionCategory.findFirst({
    where: { userId, name, type },
  });
  if (existing) return existing;

  return tx.transactionCategory.create({
    data: {
      name,
      type,
      userId,
      icon: null,
    },
  });
}

export async function regenerateScheduleFrom(
  tx: LoanTransactionClient,
  loan: LoanWithRelations,
  firstInstallmentIndex: number | null,
  openingPrincipal: number
) {
  if (firstInstallmentIndex == null || openingPrincipal <= 0) {
    await tx.loanScheduleEntry.deleteMany({
      where: { loanId: loan.id, installmentIndex: { gte: firstInstallmentIndex ?? 1 } },
    });
    return;
  }

  const existingEntries = loan.scheduleEntries.filter((entry) => entry.installmentIndex >= firstInstallmentIndex);
  if (existingEntries.length === 0) return;

  const firstEntry = existingEntries[0];
  const regenerated = generateLoanSchedule(
    getLoanComputationInput(loan, {
      principalAmount: openingPrincipal,
      remainingPrincipal: openingPrincipal,
      termMonths: existingEntries.length * ({ monthly: 1, quarterly: 3, yearly: 12 }[loan.repaymentFrequency]),
      firstPaymentDate: firstEntry.dueDate,
    }),
    getRatePeriodInputs(loan)
  );

  await tx.loanScheduleEntry.deleteMany({
    where: { loanId: loan.id, installmentIndex: { gte: firstInstallmentIndex } },
  });

  await tx.loanScheduleEntry.createMany({
    data: regenerated.map((entry, index) => ({
      loanId: loan.id,
      ratePeriodId: loan.ratePeriods.find((period) => period.sequence === entry.ratePeriodSequence)?.id ?? null,
      installmentIndex: firstInstallmentIndex + index,
      dueDate: entry.dueDate,
      openingPrincipal: entry.openingPrincipal,
      scheduledPrincipal: entry.scheduledPrincipal,
      scheduledInterest: entry.scheduledInterest,
      scheduledTotal: entry.scheduledTotal,
      closingPrincipal: entry.closingPrincipal,
      appliedAnnualRate: entry.appliedAnnualRate,
      status: entry.status,
      paidPrincipal: entry.paidPrincipal,
      paidInterest: entry.paidInterest,
      paidTotal: entry.paidTotal,
    })),
  });
}

export async function shortenLoanTermFrom(
  tx: LoanTransactionClient,
  loan: LoanWithRelations,
  firstInstallmentIndex: number,
  openingPrincipal: number
) {
  if (loan.productType === "bullet" || loan.installmentStrategy === "bullet") {
    throw new Error("Shorten-term prepayment is not supported for bullet loans");
  }

  const futureEntries = loan.scheduleEntries
    .filter((entry) => entry.installmentIndex >= firstInstallmentIndex)
    .sort((left, right) => left.installmentIndex - right.installmentIndex);

  if (futureEntries.length === 0) return;

  const intervalMonths = REPAYMENT_INTERVAL_MONTHS[loan.repaymentFrequency];
  let remainingPrincipal = openingPrincipal;
  const shortenedEntries = [] as Array<{
    loanId: string;
    ratePeriodId: string | null;
    installmentIndex: number;
    dueDate: Date;
    openingPrincipal: number;
    scheduledPrincipal: number;
    scheduledInterest: number;
    scheduledTotal: number;
    closingPrincipal: number;
    appliedAnnualRate: number;
    status: "pending";
    paidPrincipal: number;
    paidInterest: number;
    paidTotal: number;
  }>;

  for (const entry of futureEntries) {
    if (remainingPrincipal <= 0.01) break;

    const opening = remainingPrincipal;
    const periodicRate = (entry.appliedAnnualRate / 100) * (intervalMonths / 12);
    const scheduledInterest = roundCurrency(opening * periodicRate, loan.currency);
    let scheduledPrincipal = 0;

    if (loan.installmentStrategy === "equal_principal") {
      scheduledPrincipal = roundCurrency(Math.min(opening, entry.scheduledPrincipal), loan.currency);
    } else {
      const targetTotal = Math.max(entry.scheduledTotal, scheduledInterest);
      scheduledPrincipal = roundCurrency(Math.min(opening, Math.max(0, targetTotal - scheduledInterest)), loan.currency);
      if (scheduledPrincipal <= 0 && opening > 0) {
        scheduledPrincipal = opening;
      }
    }

    const closingPrincipal = roundCurrency(Math.max(0, opening - scheduledPrincipal), loan.currency);
    const scheduledTotal = roundCurrency(scheduledPrincipal + scheduledInterest, loan.currency);

    shortenedEntries.push({
      loanId: loan.id,
      ratePeriodId: entry.ratePeriodId,
      installmentIndex: firstInstallmentIndex + shortenedEntries.length,
      dueDate: entry.dueDate,
      openingPrincipal: opening,
      scheduledPrincipal,
      scheduledInterest,
      scheduledTotal,
      closingPrincipal,
      appliedAnnualRate: entry.appliedAnnualRate,
      status: "pending",
      paidPrincipal: 0,
      paidInterest: 0,
      paidTotal: 0,
    });

    remainingPrincipal = closingPrincipal;
  }

  await tx.loanScheduleEntry.deleteMany({
    where: { loanId: loan.id, installmentIndex: { gte: firstInstallmentIndex } },
  });

  if (shortenedEntries.length > 0) {
    await tx.loanScheduleEntry.createMany({ data: shortenedEntries });
  }
}

export async function settleScheduleWithPayment(
  tx: LoanTransactionClient,
  loan: LoanWithRelations,
  principalAmount: number,
  interestAmount: number,
  paymentDate: Date
) {
  const entries = loan.scheduleEntries
    .filter((entry) => entry.status !== "paid")
    .sort((left, right) => left.installmentIndex - right.installmentIndex);

  let remainingPrincipal = principalAmount;
  let remainingInterest = interestAmount;

  for (const entry of entries) {
    if (remainingPrincipal <= 0 && remainingInterest <= 0) break;
    if (entry.dueDate.getTime() > paymentDate.getTime() && remainingInterest > 0) {
      break;
    }

    const unpaidInterest = Math.max(0, entry.scheduledInterest - entry.paidInterest);
    const appliedInterest = Math.min(unpaidInterest, remainingInterest);
    remainingInterest -= appliedInterest;

    const unpaidPrincipal = Math.max(0, entry.scheduledPrincipal - entry.paidPrincipal);
    const appliedPrincipal = Math.min(unpaidPrincipal, remainingPrincipal);
    remainingPrincipal -= appliedPrincipal;

    const nextPaidInterest = entry.paidInterest + appliedInterest;
    const nextPaidPrincipal = entry.paidPrincipal + appliedPrincipal;
    const nextPaidTotal = entry.paidTotal + appliedInterest + appliedPrincipal;

    let status = entry.status;
    if (nextPaidInterest >= entry.scheduledInterest && nextPaidPrincipal >= entry.scheduledPrincipal) {
      status = "paid";
    } else if (nextPaidTotal > 0) {
      status = "partially_paid";
    }

    await tx.loanScheduleEntry.update({
      where: { id: entry.id },
      data: {
        paidInterest: nextPaidInterest,
        paidPrincipal: nextPaidPrincipal,
        paidTotal: nextPaidTotal,
        status,
      },
    });
  }

  return {
    remainingUnallocatedPrincipal: remainingPrincipal,
    remainingUnallocatedInterest: remainingInterest,
  };
}

export function buildScheduleCreateManyInput(
  loanId: string,
  schedule: ReturnType<typeof generateLoanSchedule>,
  ratePeriods: Array<{ id: string; sequence: number }>
) {
  return schedule.map((entry) => ({
    loanId,
    ratePeriodId: ratePeriods.find((period) => period.sequence === entry.ratePeriodSequence)?.id ?? null,
    installmentIndex: entry.installmentIndex,
    dueDate: entry.dueDate,
    openingPrincipal: entry.openingPrincipal,
    scheduledPrincipal: entry.scheduledPrincipal,
    scheduledInterest: entry.scheduledInterest,
    scheduledTotal: entry.scheduledTotal,
    closingPrincipal: entry.closingPrincipal,
    appliedAnnualRate: entry.appliedAnnualRate,
    status: entry.status,
    paidPrincipal: entry.paidPrincipal,
    paidInterest: entry.paidInterest,
    paidTotal: entry.paidTotal,
  }));
}

export function serializeLoan(loan: LoanWithRelations) {
  const summary = summarizeLoan(
    {
      principalAmount: loan.principalAmount,
      remainingPrincipal: loan.remainingPrincipal,
    },
    loan.scheduleEntries.map((entry) => ({
      installmentIndex: entry.installmentIndex,
      dueDate: entry.dueDate,
      openingPrincipal: entry.openingPrincipal,
      scheduledPrincipal: entry.scheduledPrincipal,
      scheduledInterest: entry.scheduledInterest,
      scheduledTotal: entry.scheduledTotal,
      closingPrincipal: entry.closingPrincipal,
      appliedAnnualRate: entry.appliedAnnualRate,
      status: entry.status,
      paidPrincipal: entry.paidPrincipal,
      paidInterest: entry.paidInterest,
      paidTotal: entry.paidTotal,
      ratePeriodSequence: loan.ratePeriods.find((period) => period.id === entry.ratePeriodId)?.sequence ?? null,
    })),
    loan.ratePeriods.map((period) => ({
      id: period.id,
      periodType: period.periodType,
      annualRate: period.annualRate,
      startDate: period.startDate,
      endDate: period.endDate,
      repricingIntervalMonths: period.repricingIntervalMonths,
      sequence: period.sequence,
    }))
  );

  return {
    ...loan,
    summary,
  };
}

export { LOAN_INCLUDE };
