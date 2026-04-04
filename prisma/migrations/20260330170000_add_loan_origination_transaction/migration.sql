-- AlterTable
ALTER TABLE "Loan" ADD COLUMN "originationTransactionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Loan_originationTransactionId_key" ON "Loan"("originationTransactionId");

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_originationTransactionId_fkey" FOREIGN KEY ("originationTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;