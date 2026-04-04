-- AlterTable
ALTER TABLE "Loan" ADD COLUMN "initialTransactionId" TEXT;
ALTER TABLE "Loan" DROP COLUMN "principalAmount";

-- CreateIndex
CREATE UNIQUE INDEX "Loan_initialTransactionId_key" ON "Loan"("initialTransactionId");

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_initialTransactionId_fkey" FOREIGN KEY ("initialTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
