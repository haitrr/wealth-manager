/*
  Warnings:

  - You are about to drop the column `borrowingId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `loanId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `Borrowing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Loan` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `accountId` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DebtDirection" AS ENUM ('TAKEN', 'GIVEN');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CASH', 'BORROWING', 'LOAN');

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_borrowingId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_loanId_fkey";

-- DropIndex
DROP INDEX "Transaction_borrowingId_idx";

-- DropIndex
DROP INDEX "Transaction_loanId_idx";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "borrowingId",
DROP COLUMN "loanId",
ADD COLUMN     "accountId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Borrowing";

-- DropTable
DROP TABLE "Loan";

-- CreateTable
CREATE TABLE "Debt" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "direction" "DebtDirection" NOT NULL,
    "principalAmount" DOUBLE PRECISION NOT NULL,
    "interestRate" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "Debt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "debtId" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Debt_accountId_key" ON "Debt"("accountId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
