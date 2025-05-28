/*
  Warnings:

  - You are about to drop the column `pdfPath` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `pdfPath` on the `Quote` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "pdfPath",
ADD COLUMN     "pdfUrl" TEXT;

-- AlterTable
ALTER TABLE "Quote" DROP COLUMN "pdfPath",
ADD COLUMN     "pdfUrl" TEXT;
