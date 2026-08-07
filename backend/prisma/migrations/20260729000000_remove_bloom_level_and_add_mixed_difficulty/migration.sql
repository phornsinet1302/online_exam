-- Remove bloom level from questions and add Mixed difficulty support
ALTER TABLE "questions" DROP COLUMN "bloomLevel";

ALTER TYPE "Difficulty" ADD VALUE 'MIXED';

DROP TYPE "BloomLevel";
