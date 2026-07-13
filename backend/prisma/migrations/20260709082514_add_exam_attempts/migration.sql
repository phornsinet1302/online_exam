-- CreateTable
CREATE TABLE "exam_attempts" (
    "id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "studentId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "score" DOUBLE PRECISION,

    CONSTRAINT "exam_attempts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
