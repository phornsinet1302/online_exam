/*
  Warnings:

  - You are about to drop the column `endDate` on the `exams` table. All the data in the column will be lost.
  - You are about to drop the column `isPublic` on the `exams` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "exams" DROP COLUMN "endDate",
DROP COLUMN "isPublic";
