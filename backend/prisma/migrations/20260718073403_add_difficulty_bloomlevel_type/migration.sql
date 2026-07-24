/*
  Warnings:

  - The `bloomLevel` column on the `questions` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "BloomLevel" AS ENUM ('Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create');

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "bloomLevel",
ADD COLUMN     "bloomLevel" "BloomLevel";
