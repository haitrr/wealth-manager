/*
  Warnings:

  - Changed the type of `amount` on the `Debt` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `paidAmount` on the `Debt` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `amount` on the `Loan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `paidAmount` on the `Loan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Debt" DROP COLUMN "amount",
ADD COLUMN     "amount" DECIMAL(65,30) NOT NULL,
DROP COLUMN "paidAmount",
ADD COLUMN     "paidAmount" DECIMAL(65,30) NOT NULL;

-- AlterTable
ALTER TABLE "Loan" DROP COLUMN "amount",
ADD COLUMN     "amount" DECIMAL(65,30) NOT NULL,
DROP COLUMN "paidAmount",
ADD COLUMN     "paidAmount" DECIMAL(65,30) NOT NULL;
