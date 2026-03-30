-- CreateEnum
CREATE TYPE "PrepaymentStrategy" AS ENUM ('reduce_payment', 'shorten_term');

-- AlterTable
ALTER TABLE "LoanPayment" ADD COLUMN     "prepaymentStrategy" "PrepaymentStrategy";
