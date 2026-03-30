-- CreateEnum
CREATE TYPE "LoanDirection" AS ENUM ('borrowed', 'lent');

-- CreateEnum
CREATE TYPE "LoanProductType" AS ENUM ('installment', 'bullet');

-- CreateEnum
CREATE TYPE "LoanInstallmentStrategy" AS ENUM ('equal_principal', 'annuity', 'bullet');

-- CreateEnum
CREATE TYPE "RepaymentFrequency" AS ENUM ('monthly', 'quarterly', 'yearly');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('draft', 'active', 'closed');

-- CreateEnum
CREATE TYPE "LoanRatePeriodType" AS ENUM ('fixed', 'floating');

-- CreateEnum
CREATE TYPE "LoanPaymentKind" AS ENUM ('scheduled', 'prepayment', 'adjustment');

-- CreateEnum
CREATE TYPE "LoanScheduleStatus" AS ENUM ('pending', 'partially_paid', 'paid');

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "direction" "LoanDirection" NOT NULL,
    "productType" "LoanProductType" NOT NULL,
    "installmentStrategy" "LoanInstallmentStrategy" NOT NULL,
    "principalAmount" DOUBLE PRECISION NOT NULL,
    "remainingPrincipal" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "termMonths" INTEGER NOT NULL,
    "repaymentFrequency" "RepaymentFrequency" NOT NULL DEFAULT 'monthly',
    "startDate" TIMESTAMP(3) NOT NULL,
    "firstPaymentDate" TIMESTAMP(3) NOT NULL,
    "counterpartyName" TEXT,
    "notes" TEXT,
    "status" "LoanStatus" NOT NULL DEFAULT 'active',
    "accountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanRatePeriod" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "periodType" "LoanRatePeriodType" NOT NULL,
    "annualRate" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "repricingIntervalMonths" INTEGER,
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanRatePeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanScheduleEntry" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "ratePeriodId" TEXT,
    "installmentIndex" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "openingPrincipal" DOUBLE PRECISION NOT NULL,
    "scheduledPrincipal" DOUBLE PRECISION NOT NULL,
    "scheduledInterest" DOUBLE PRECISION NOT NULL,
    "scheduledTotal" DOUBLE PRECISION NOT NULL,
    "closingPrincipal" DOUBLE PRECISION NOT NULL,
    "appliedAnnualRate" DOUBLE PRECISION NOT NULL,
    "status" "LoanScheduleStatus" NOT NULL DEFAULT 'pending',
    "paidPrincipal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidInterest" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanScheduleEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanPayment" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "transactionId" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentKind" "LoanPaymentKind" NOT NULL DEFAULT 'scheduled',
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "principalAmount" DOUBLE PRECISION NOT NULL,
    "interestAmount" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Loan_userId_status_idx" ON "Loan"("userId", "status");

-- CreateIndex
CREATE INDEX "Loan_accountId_idx" ON "Loan"("accountId");

-- CreateIndex
CREATE INDEX "LoanRatePeriod_loanId_startDate_idx" ON "LoanRatePeriod"("loanId", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "LoanRatePeriod_loanId_sequence_key" ON "LoanRatePeriod"("loanId", "sequence");

-- CreateIndex
CREATE INDEX "LoanScheduleEntry_loanId_dueDate_idx" ON "LoanScheduleEntry"("loanId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "LoanScheduleEntry_loanId_installmentIndex_key" ON "LoanScheduleEntry"("loanId", "installmentIndex");

-- CreateIndex
CREATE UNIQUE INDEX "LoanPayment_transactionId_key" ON "LoanPayment"("transactionId");

-- CreateIndex
CREATE INDEX "LoanPayment_loanId_paymentDate_idx" ON "LoanPayment"("loanId", "paymentDate");

-- CreateIndex
CREATE INDEX "LoanPayment_userId_idx" ON "LoanPayment"("userId");

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanRatePeriod" ADD CONSTRAINT "LoanRatePeriod_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanScheduleEntry" ADD CONSTRAINT "LoanScheduleEntry_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanScheduleEntry" ADD CONSTRAINT "LoanScheduleEntry_ratePeriodId_fkey" FOREIGN KEY ("ratePeriodId") REFERENCES "LoanRatePeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanPayment" ADD CONSTRAINT "LoanPayment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanPayment" ADD CONSTRAINT "LoanPayment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanPayment" ADD CONSTRAINT "LoanPayment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanPayment" ADD CONSTRAINT "LoanPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
