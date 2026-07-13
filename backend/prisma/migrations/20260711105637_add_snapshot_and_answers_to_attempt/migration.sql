/*
  Warnings:

  - Added the required column `snapshot` to the `exam_attempts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `exam_attempts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "exam_attempts" ADD COLUMN     "answers" JSONB,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "snapshot" JSONB NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
