/*
  Warnings:

  - You are about to drop the column `status` on the `Quotation` table. All the data in the column will be lost.
  - You are about to drop the column `subtotal` on the `Quotation` table. All the data in the column will be lost.
  - You are about to drop the column `terms` on the `Quotation` table. All the data in the column will be lost.
  - You are about to drop the column `totalTax` on the `Quotation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Quotation" DROP COLUMN "status",
DROP COLUMN "subtotal",
DROP COLUMN "terms",
DROP COLUMN "totalTax";
