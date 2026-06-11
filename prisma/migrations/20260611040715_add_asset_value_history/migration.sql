-- CreateTable
CREATE TABLE "AssetValueHistory" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetValueHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssetValueHistory_assetId_date_idx" ON "AssetValueHistory"("assetId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AssetValueHistory_assetId_date_key" ON "AssetValueHistory"("assetId", "date");

-- AddForeignKey
ALTER TABLE "AssetValueHistory" ADD CONSTRAINT "AssetValueHistory_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
