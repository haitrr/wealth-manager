-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'VND');

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'USD';
