/*
  Warnings:

  - Added the required column `difficulty` to the `questions` table without a default value. This is not possible if the table is not empty.
  - Made the column `bloomLevel` on table `questions` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "isAIGenerated" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "difficulty",
ADD COLUMN     "difficulty" "Difficulty" NOT NULL,
ALTER COLUMN "bloomLevel" SET NOT NULL;
