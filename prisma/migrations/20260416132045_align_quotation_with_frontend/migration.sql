/*
  Warnings:

  - You are about to drop the column `companyType` on the `Quotation` table. All the data in the column will be lost.
  - Added the required column `salesPersonName` to the `Quotation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Quotation" DROP COLUMN "companyType",
ADD COLUMN     "salesPersonName" TEXT NOT NULL,
ALTER COLUMN "clientAddress" DROP NOT NULL,
ALTER COLUMN "clientPhone" DROP NOT NULL,
ALTER COLUMN "clientEmail" DROP NOT NULL,
ALTER COLUMN "grandTotal" DROP DEFAULT;

-- AlterTable
ALTER TABLE "QuotationItem" ALTER COLUMN "description" DROP NOT NULL;

-- DropEnum
DROP TYPE "QuotationStatus";
