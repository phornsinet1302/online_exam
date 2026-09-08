-- CreateEnum
CREATE TYPE "GradingStatus" AS ENUM ('auto_graded', 'needs_review', 'graded');

-- AlterTable
ALTER TABLE "exam_attempts" ADD COLUMN     "gradingKey" JSONB,
ADD COLUMN     "gradingStatus" "GradingStatus",
ADD COLUMN     "totalScore" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "student_answers" (
    "id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "selectedOptionIds" TEXT[],
    "textAnswer" TEXT,
    "matchingPairs" JSONB,
    "fileUrl" TEXT,
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "status" "GradingStatus" NOT NULL DEFAULT 'needs_review',
    "feedback" TEXT,
    "gradedBy" TEXT,
    "gradedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_answers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "student_answers" ADD CONSTRAINT "student_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "exam_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
