-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "purchasePrice" DOUBLE PRECISION,
ADD COLUMN     "sellDate" TIMESTAMP(3),
ADD COLUMN     "sellPrice" DOUBLE PRECISION;
