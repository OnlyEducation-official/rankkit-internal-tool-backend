/*
  Warnings:

  - You are about to drop the column `lineTotal` on the `QuotationItem` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `QuotationItem` table. All the data in the column will be lost.
  - You are about to drop the column `taxPercent` on the `QuotationItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "QuotationItem" DROP COLUMN "lineTotal",
DROP COLUMN "quantity",
DROP COLUMN "taxPercent";
