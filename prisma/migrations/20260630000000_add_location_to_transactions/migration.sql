-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "locationPlaceId" TEXT,
ADD COLUMN "locationPlaceName" TEXT;

-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN "openTimelineUrl" TEXT;
