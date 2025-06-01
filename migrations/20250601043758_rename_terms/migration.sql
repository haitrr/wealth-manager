/*
  Warnings:

  - The values [DEBT,DEBT_COLLECTION,LOAN_PAYMENT] on the enum `CategoryType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `debtId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `Debt` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CategoryType_new" AS ENUM ('INCOME', 'EXPENSE', 'BORROWING', 'BORROWING_PAYMENT', 'BORROWING_INTEREST_PAYMENT', 'BORROWING_FEE_PAYMENT', 'LOAN', 'LOAN_COLLECTION', 'LOAN_INTEREST_COLLECTION', 'LOAN_FEE_COLLECTION');
ALTER TABLE "Category" ALTER COLUMN "type" TYPE "CategoryType_new" USING ("type"::text::"CategoryType_new");
ALTER TYPE "CategoryType" RENAME TO "CategoryType_old";
ALTER TYPE "CategoryType_new" RENAME TO "CategoryType";
DROP TYPE "CategoryType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_debtId_fkey";

-- DropIndex
DROP INDEX "Transaction_debtId_idx";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "debtId",
ADD COLUMN     "borrowingId" TEXT;

-- DropTable
DROP TABLE "Debt";

-- CreateTable
CREATE TABLE "Borrowing" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "paidAmount" DECIMAL(65,30) NOT NULL,
    "startDate" TIMESTAMP(3),

    CONSTRAINT "Borrowing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Borrowing_startDate_idx" ON "Borrowing"("startDate");

-- CreateIndex
CREATE INDEX "Transaction_borrowingId_idx" ON "Transaction" USING HASH ("borrowingId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_borrowingId_fkey" FOREIGN KEY ("borrowingId") REFERENCES "Borrowing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
