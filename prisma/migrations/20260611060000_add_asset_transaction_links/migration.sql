-- AlterTable
ALTER TABLE "Asset" ADD COLUMN "purchaseTransactionId" TEXT,
ADD COLUMN "sellTransactionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Asset_purchaseTransactionId_key" ON "Asset"("purchaseTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_sellTransactionId_key" ON "Asset"("sellTransactionId");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_purchaseTransactionId_fkey" FOREIGN KEY ("purchaseTransactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_sellTransactionId_fkey" FOREIGN KEY ("sellTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
