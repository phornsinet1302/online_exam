/*
  Warnings:

  - You are about to drop the column `endDate` on the `exams` table. All the data in the column will be lost.
  - You are about to drop the column `isPublic` on the `exams` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ExamAccess" AS ENUM ('PUBLIC', 'PRIVATE', 'PASSWORD_PROTECTED');

-- AlterTable
ALTER TABLE "exams" DROP COLUMN "endDate",
DROP COLUMN "isPublic",
ADD COLUMN     "accessType" "ExamAccess" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "password" TEXT,
ADD COLUMN     "randomizeQuestions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showResults" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "timezone" TEXT;
