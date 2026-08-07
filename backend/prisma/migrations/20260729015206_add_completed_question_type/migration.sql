/*
  Warnings:

  - The values [DROPDOWN,MATH] on the enum `QuestionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "QuestionType_new" AS ENUM ('MCQ', 'MULTIPLE_SELECT', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY', 'FILL_IN_BLANK', 'MATCHING', 'CHECKBOX', 'FILE_UPLOAD', 'MATH_FORMULA');
ALTER TABLE "questions" ALTER COLUMN "type" TYPE "QuestionType_new" USING ("type"::text::"QuestionType_new");
ALTER TYPE "QuestionType" RENAME TO "QuestionType_old";
ALTER TYPE "QuestionType_new" RENAME TO "QuestionType";
DROP TYPE "public"."QuestionType_old";
COMMIT;
