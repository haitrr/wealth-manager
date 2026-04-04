-- Drop schedule entries first (depends on LoanRatePeriod and Loan)
DROP TABLE IF EXISTS "LoanScheduleEntry";

-- Drop rate periods (depends on Loan)
DROP TABLE IF EXISTS "LoanRatePeriod";

-- Drop origination transaction unique constraint and FK from Loan
ALTER TABLE "Loan" DROP CONSTRAINT IF EXISTS "Loan_originationTransactionId_key";
ALTER TABLE "Loan" DROP CONSTRAINT IF EXISTS "Loan_originationTransactionId_fkey";

-- Drop old LoanPayment transaction FK and unique constraint
ALTER TABLE "LoanPayment" DROP CONSTRAINT IF EXISTS "LoanPayment_transactionId_key";
ALTER TABLE "LoanPayment" DROP CONSTRAINT IF EXISTS "LoanPayment_transactionId_fkey";

-- Drop columns from Loan
ALTER TABLE "Loan"
  DROP COLUMN IF EXISTS "productType",
  DROP COLUMN IF EXISTS "installmentStrategy",
  DROP COLUMN IF EXISTS "termMonths",
  DROP COLUMN IF EXISTS "repaymentFrequency",
  DROP COLUMN IF EXISTS "firstPaymentDate",
  DROP COLUMN IF EXISTS "originationTransactionId";

-- Drop columns from LoanPayment
ALTER TABLE "LoanPayment"
  DROP COLUMN IF EXISTS "paymentKind",
  DROP COLUMN IF EXISTS "prepaymentStrategy",
  DROP COLUMN IF EXISTS "totalAmount",
  DROP COLUMN IF EXISTS "transactionId";

-- Add new columns to LoanPayment
ALTER TABLE "LoanPayment" ADD COLUMN IF NOT EXISTS "prepayFeeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "LoanPayment" ADD COLUMN IF NOT EXISTS "principalTransactionId" TEXT;
ALTER TABLE "LoanPayment" ADD COLUMN IF NOT EXISTS "interestTransactionId" TEXT;
ALTER TABLE "LoanPayment" ADD COLUMN IF NOT EXISTS "prepayFeeTransactionId" TEXT;

-- Add unique constraints for new transaction links
ALTER TABLE "LoanPayment" ADD CONSTRAINT "LoanPayment_principalTransactionId_key" UNIQUE ("principalTransactionId");
ALTER TABLE "LoanPayment" ADD CONSTRAINT "LoanPayment_interestTransactionId_key" UNIQUE ("interestTransactionId");
ALTER TABLE "LoanPayment" ADD CONSTRAINT "LoanPayment_prepayFeeTransactionId_key" UNIQUE ("prepayFeeTransactionId");

-- Add FK constraints for the 3 transaction links
ALTER TABLE "LoanPayment" ADD CONSTRAINT "LoanPayment_principalTransactionId_fkey"
  FOREIGN KEY ("principalTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LoanPayment" ADD CONSTRAINT "LoanPayment_interestTransactionId_fkey"
  FOREIGN KEY ("interestTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LoanPayment" ADD CONSTRAINT "LoanPayment_prepayFeeTransactionId_fkey"
  FOREIGN KEY ("prepayFeeTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop unused enums
DROP TYPE IF EXISTS "LoanProductType";
DROP TYPE IF EXISTS "LoanInstallmentStrategy";
DROP TYPE IF EXISTS "LoanRatePeriodType";
DROP TYPE IF EXISTS "LoanScheduleStatus";
DROP TYPE IF EXISTS "PrepaymentStrategy";
DROP TYPE IF EXISTS "LoanPaymentKind";
DROP TYPE IF EXISTS "RepaymentFrequency";

-- Simplify LoanStatus: remove 'draft' value
UPDATE "Loan" SET "status" = 'active' WHERE "status" = 'draft';
ALTER TABLE "Loan" ALTER COLUMN "status" DROP DEFAULT;
ALTER TYPE "LoanStatus" RENAME TO "LoanStatus_old";
CREATE TYPE "LoanStatus" AS ENUM ('active', 'closed');
ALTER TABLE "Loan" ALTER COLUMN "status" TYPE "LoanStatus" USING "status"::text::"LoanStatus";
ALTER TABLE "Loan" ALTER COLUMN "status" SET DEFAULT 'active';
DROP TYPE "LoanStatus_old";
