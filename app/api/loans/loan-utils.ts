import {
  Currency,
  LoanDirection,
  LoanInstallmentStrategy,
  LoanProductType,
  LoanRatePeriodType,
  LoanScheduleStatus,
  RepaymentFrequency,
} from "@prisma/client";

export interface LoanRatePeriodInput {
  id?: string;
  periodType: LoanRatePeriodType;
  annualRate: number;
  startDate: Date;
  endDate?: Date | null;
  repricingIntervalMonths?: number | null;
  sequence?: number;
}

export interface LoanComputationInput {
  productType: LoanProductType;
  installmentStrategy: LoanInstallmentStrategy;
  principalAmount: number;
  remainingPrincipal?: number;
  currency: Currency;
  termMonths: number;
  repaymentFrequency: RepaymentFrequency;
  startDate: Date;
  firstPaymentDate: Date;
  direction: LoanDirection;
}

export interface LoanScheduleEntryInput {
  installmentIndex: number;
  dueDate: Date;
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
  ratePeriodSequence: number | null;
}

export interface LoanSummary {
  principalAmount: number;
  remainingPrincipal: number;
  totalScheduledInterest: number;
  totalScheduledAmount: number;
  nextDueDate: Date | null;
  currentAnnualRate: number;
  currentRatePeriodType: LoanRatePeriodType;
  progressPercent: number;
}

export const REPAYMENT_INTERVAL_MONTHS: Record<RepaymentFrequency, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

export function roundCurrency(amount: number, currency: Currency) {
  const decimals = currency === "VND" ? 0 : 2;
  const factor = 10 ** decimals;
  return Math.round((amount + Number.EPSILON) * factor) / factor;
}

function addMonthsClamped(date: Date, months: number) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  const ms = date.getUTCMilliseconds();

  const targetMonth = month + months;
  const monthStart = new Date(Date.UTC(year, targetMonth, 1, hours, minutes, seconds, ms));
  const monthEnd = new Date(Date.UTC(year, targetMonth + 1, 0, hours, minutes, seconds, ms));
  const clampedDay = Math.min(day, monthEnd.getUTCDate());

  monthStart.setUTCDate(clampedDay);
  return monthStart;
}

function getInstallmentCount(termMonths: number, repaymentFrequency: RepaymentFrequency) {
  const intervalMonths = REPAYMENT_INTERVAL_MONTHS[repaymentFrequency];
  if (termMonths <= 0 || termMonths % intervalMonths !== 0) {
    throw new Error("Term months must align with repayment frequency");
  }
  return termMonths / intervalMonths;
}

function normalizeRatePeriods(ratePeriods: LoanRatePeriodInput[]) {
  if (ratePeriods.length === 0) {
    throw new Error("At least one rate period is required");
  }

  const normalized = ratePeriods
    .map((period, index) => ({
      ...period,
      annualRate: Number(period.annualRate),
      startDate: new Date(period.startDate),
      endDate: period.endDate ? new Date(period.endDate) : null,
      sequence: period.sequence ?? index + 1,
    }))
    .sort((left, right) => {
      const startDiff = left.startDate.getTime() - right.startDate.getTime();
      return startDiff !== 0 ? startDiff : left.sequence - right.sequence;
    });

  for (let index = 0; index < normalized.length; index += 1) {
    const period = normalized[index];
    if (!Number.isFinite(period.annualRate) || period.annualRate < 0) {
      throw new Error("Annual rate must be zero or positive");
    }
    if (period.endDate && period.endDate.getTime() < period.startDate.getTime()) {
      throw new Error("Rate period end date must not be before start date");
    }
    if (period.periodType === "floating") {
      if (!period.repricingIntervalMonths || period.repricingIntervalMonths <= 0) {
        throw new Error("Floating rate periods require a repricing interval in months");
      }
    }

    const next = normalized[index + 1];
    if (!next) continue;

    const currentEnd = period.endDate?.getTime();
    if (currentEnd == null || currentEnd >= next.startDate.getTime()) {
      throw new Error("Rate periods must be contiguous and non-overlapping");
    }
  }

  return normalized;
}

function resolveRatePeriod(ratePeriods: ReturnType<typeof normalizeRatePeriods>, dueDate: Date) {
  const match = ratePeriods.find((period) => {
    const startsBeforeOrOnDueDate = period.startDate.getTime() <= dueDate.getTime();
    const endsAfterOrOnDueDate = !period.endDate || period.endDate.getTime() >= dueDate.getTime();
    return startsBeforeOrOnDueDate && endsAfterOrOnDueDate;
  });

  if (!match) {
    throw new Error(`No rate period covers due date ${dueDate.toISOString()}`);
  }

  return match;
}

function calculateAnnuityPayment(principal: number, periodicRate: number, remainingInstallments: number) {
  if (remainingInstallments <= 0) return 0;
  if (periodicRate === 0) return principal / remainingInstallments;

  const numerator = principal * periodicRate;
  const denominator = 1 - (1 + periodicRate) ** -remainingInstallments;
  return numerator / denominator;
}

export function generateLoanSchedule(
  loan: LoanComputationInput,
  ratePeriodsInput: LoanRatePeriodInput[]
): LoanScheduleEntryInput[] {
  const ratePeriods = normalizeRatePeriods(ratePeriodsInput);
  const installmentCount = getInstallmentCount(loan.termMonths, loan.repaymentFrequency);
  const intervalMonths = REPAYMENT_INTERVAL_MONTHS[loan.repaymentFrequency];
  const schedule: LoanScheduleEntryInput[] = [];

  let remainingPrincipal = roundCurrency(loan.remainingPrincipal ?? loan.principalAmount, loan.currency);
  let annuityPayment = 0;
  let previousAnnualRate: number | null = null;

  for (let installmentIndex = 1; installmentIndex <= installmentCount; installmentIndex += 1) {
    const remainingInstallments = installmentCount - installmentIndex + 1;
    const dueDate = addMonthsClamped(loan.firstPaymentDate, intervalMonths * (installmentIndex - 1));
    const ratePeriod = resolveRatePeriod(ratePeriods, dueDate);
    const periodicRate = (ratePeriod.annualRate / 100) * (intervalMonths / 12);
    const openingPrincipal = remainingPrincipal;

    let scheduledPrincipal = 0;
    const scheduledInterest = roundCurrency(openingPrincipal * periodicRate, loan.currency);

    if (loan.productType === "bullet" || loan.installmentStrategy === "bullet") {
      scheduledPrincipal = installmentIndex === installmentCount ? openingPrincipal : 0;
    } else if (loan.installmentStrategy === "equal_principal") {
      scheduledPrincipal = roundCurrency(openingPrincipal / remainingInstallments, loan.currency);
      if (installmentIndex === installmentCount || scheduledPrincipal > openingPrincipal) {
        scheduledPrincipal = openingPrincipal;
      }
    } else {
      if (previousAnnualRate !== ratePeriod.annualRate || annuityPayment === 0) {
        annuityPayment = roundCurrency(
          calculateAnnuityPayment(openingPrincipal, periodicRate, remainingInstallments),
          loan.currency
        );
      }
      scheduledPrincipal = roundCurrency(annuityPayment - scheduledInterest, loan.currency);
      if (installmentIndex === installmentCount || scheduledPrincipal > openingPrincipal) {
        scheduledPrincipal = openingPrincipal;
      }
      if (scheduledPrincipal < 0) {
        scheduledPrincipal = 0;
      }
    }

    const scheduledTotal = roundCurrency(scheduledPrincipal + scheduledInterest, loan.currency);
    const closingPrincipal = roundCurrency(Math.max(0, openingPrincipal - scheduledPrincipal), loan.currency);

    schedule.push({
      installmentIndex,
      dueDate,
      openingPrincipal,
      scheduledPrincipal,
      scheduledInterest,
      scheduledTotal,
      closingPrincipal,
      appliedAnnualRate: ratePeriod.annualRate,
      status: "pending",
      paidPrincipal: 0,
      paidInterest: 0,
      paidTotal: 0,
      ratePeriodSequence: ratePeriod.sequence,
    });

    remainingPrincipal = closingPrincipal;
    previousAnnualRate = ratePeriod.annualRate;
  }

  return schedule;
}

export function summarizeLoan(
  loan: Pick<LoanComputationInput, "principalAmount" | "remainingPrincipal">,
  schedule: LoanScheduleEntryInput[],
  ratePeriodsInput: LoanRatePeriodInput[],
  asOf = new Date()
): LoanSummary {
  const ratePeriods = normalizeRatePeriods(ratePeriodsInput);
  const ratePeriod = resolveRatePeriod(ratePeriods, asOf);
  const principalAmount = loan.principalAmount;
  const remainingPrincipal = loan.remainingPrincipal ?? principalAmount;
  const totalScheduledInterest = schedule.reduce((sum, entry) => sum + entry.scheduledInterest, 0);
  const totalScheduledAmount = schedule.reduce((sum, entry) => sum + entry.scheduledTotal, 0);
  const nextDueDate = schedule.find((entry) => entry.status !== "paid")?.dueDate ?? null;
  const progressPercent = principalAmount === 0 ? 100 : ((principalAmount - remainingPrincipal) / principalAmount) * 100;

  return {
    principalAmount,
    remainingPrincipal,
    totalScheduledInterest,
    totalScheduledAmount,
    nextDueDate,
    currentAnnualRate: ratePeriod.annualRate,
    currentRatePeriodType: ratePeriod.periodType,
    progressPercent: Math.max(0, Math.min(100, progressPercent)),
  };
}
