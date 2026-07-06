-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "reviewed" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "content" TEXT,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
