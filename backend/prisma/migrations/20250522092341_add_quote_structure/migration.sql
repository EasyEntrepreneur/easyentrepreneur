/*
  Warnings:

  - You are about to drop the column `date` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `items` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `Quote` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[number]` on the table `Quote` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `clientCity` to the `Quote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientZip` to the `Quote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `number` to the `Quote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalHT` to the `Quote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalTTC` to the `Quote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalTVA` to the `Quote` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('ACCEPTE', 'EN_ATTENTE', 'REFUSE');

-- AlterTable
ALTER TABLE "Quote" DROP COLUMN "date",
DROP COLUMN "items",
DROP COLUMN "status",
DROP COLUMN "total",
ADD COLUMN     "clientCity" TEXT NOT NULL,
ADD COLUMN     "clientEmail" TEXT,
ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "clientPhone" TEXT,
ADD COLUMN     "clientZip" TEXT NOT NULL,
ADD COLUMN     "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "number" TEXT NOT NULL,
ADD COLUMN     "pdfPath" TEXT,
ADD COLUMN     "statut" "QuoteStatus" NOT NULL DEFAULT 'EN_ATTENTE',
ADD COLUMN     "totalHT" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalTTC" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalTVA" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "validUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "QuoteItem" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "vatRate" DOUBLE PRECISION NOT NULL,
    "totalHT" DOUBLE PRECISION NOT NULL,
    "totalTVA" DOUBLE PRECISION NOT NULL,
    "totalTTC" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Quote_number_key" ON "Quote"("number");

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
