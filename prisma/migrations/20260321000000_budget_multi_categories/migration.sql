-- AlterTable: replace categoryId with categoryIds and excludedCategoryIds arrays
ALTER TABLE "Budget" ADD COLUMN "categoryIds" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "Budget" ADD COLUMN "excludedCategoryIds" TEXT[] NOT NULL DEFAULT '{}';

-- Migrate existing single categoryId into the new categoryIds array
UPDATE "Budget" SET "categoryIds" = CAST('{' || "categoryId" || '}' AS TEXT[]) WHERE "categoryId" IS NOT NULL;

-- Drop old column and FK
ALTER TABLE "Budget" DROP CONSTRAINT IF EXISTS "Budget_categoryId_fkey";
ALTER TABLE "Budget" DROP COLUMN IF EXISTS "categoryId";
