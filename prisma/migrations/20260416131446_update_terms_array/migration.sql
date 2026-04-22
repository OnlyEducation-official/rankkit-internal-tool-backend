/*
  Warnings:

  - Made the column `description` on table `QuotationItem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "QuotationItem" ALTER COLUMN "description" SET NOT NULL;
