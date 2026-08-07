-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "description" TEXT,
ADD COLUMN     "required" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "title" TEXT;
