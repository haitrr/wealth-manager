-- CreateIndex
CREATE INDEX "Transaction_categoryId_idx" ON "Transaction" USING HASH ("categoryId");
