-- AlterTable
ALTER TABLE "exams" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true;
