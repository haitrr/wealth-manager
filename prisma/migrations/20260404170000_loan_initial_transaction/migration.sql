-- AlterTable
ALTER TABLE "Loan" ADD COLUMN "initialTransactionId" TEXT;
ALTER TABLE "Loan" DROP COLUMN "principalAmount";

ALTER TABLE "UserSettings" ADD COLUMN "loanBorrowedInitialCategoryId" TEXT;
ALTER TABLE "UserSettings" ADD COLUMN "loanLentInitialCategoryId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Loan_initialTransactionId_key" ON "Loan"("initialTransactionId");

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_initialTransactionId_fkey" FOREIGN KEY ("initialTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
