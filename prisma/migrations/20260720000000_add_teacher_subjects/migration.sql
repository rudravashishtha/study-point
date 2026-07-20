-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN "subjects" TEXT[] DEFAULT ARRAY[]::TEXT[];
