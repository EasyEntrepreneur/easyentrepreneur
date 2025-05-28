/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `Client` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "email" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "legalNote" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");
