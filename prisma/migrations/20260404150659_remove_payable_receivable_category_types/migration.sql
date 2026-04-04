-- Migrate existing data: payable -> expense, receivable -> income
UPDATE "TransactionCategory" SET type = 'expense' WHERE type = 'payable';
UPDATE "TransactionCategory" SET type = 'income' WHERE type = 'receivable';

-- PostgreSQL doesn't support dropping enum values directly, so we recreate the type
CREATE TYPE "CategoryType_new" AS ENUM ('income', 'expense');

ALTER TABLE "TransactionCategory"
  ALTER COLUMN type TYPE "CategoryType_new"
  USING type::text::"CategoryType_new";

DROP TYPE "CategoryType";
ALTER TYPE "CategoryType_new" RENAME TO "CategoryType";
