-- CreateEnum
CREATE TYPE "ExamSessionState" AS ENUM ('WAITING', 'ACTIVE', 'ENDED');

-- AlterTable
ALTER TABLE "exams" ADD COLUMN     "lateAllowanceMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sessionState" "ExamSessionState" NOT NULL DEFAULT 'WAITING';
