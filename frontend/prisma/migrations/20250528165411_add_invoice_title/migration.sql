/*
  Warnings:

  - You are about to drop the column `bic` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `iban` on the `Invoice` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "bic",
DROP COLUMN "iban";
