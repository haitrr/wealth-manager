/*
  Warnings:

  - Made the column `icon` on table `Category` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "icon" SET NOT NULL,
ALTER COLUMN "icon" SET DEFAULT 'money';
