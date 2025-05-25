-- CreateIndex
CREATE INDEX "Debt_startDate_idx" ON "Debt"("startDate");

-- CreateIndex
CREATE INDEX "Loan_startDate_idx" ON "Loan"("startDate");

-- CreateIndex
CREATE INDEX "Transaction_debtId_idx" ON "Transaction" USING HASH ("debtId");

-- CreateIndex
CREATE INDEX "Transaction_loanId_idx" ON "Transaction" USING HASH ("loanId");
