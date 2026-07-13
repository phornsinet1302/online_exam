/*
  Warnings:

  - A unique constraint covering the columns `[uniqueCode]` on the table `exams` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "exams" ADD COLUMN     "magicLinkToken" TEXT,
ADD COLUMN     "uniqueCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "exams_uniqueCode_key" ON "exams"("uniqueCode");
