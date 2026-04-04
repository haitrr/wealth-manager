-- AlterTable
ALTER TABLE "Loan" ADD COLUMN "principalCategoryId" TEXT;
ALTER TABLE "Loan" ADD COLUMN "interestCategoryId" TEXT;
ALTER TABLE "Loan" ADD COLUMN "prepayFeeCategoryId" TEXT;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_principalCategoryId_fkey" FOREIGN KEY ("principalCategoryId") REFERENCES "TransactionCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_interestCategoryId_fkey" FOREIGN KEY ("interestCategoryId") REFERENCES "TransactionCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_prepayFeeCategoryId_fkey" FOREIGN KEY ("prepayFeeCategoryId") REFERENCES "TransactionCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
