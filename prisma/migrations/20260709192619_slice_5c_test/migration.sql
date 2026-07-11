-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('CHAPTER_TEST', 'UNIT_TEST', 'FULL_SYLLABUS_TEST');

-- CreateEnum
CREATE TYPE "TestLifecycleState" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterEnum
ALTER TYPE "FileUploadUsageCategory" ADD VALUE 'TEST';

-- CreateTable
CREATE TABLE "Test" (
    "id" TEXT NOT NULL,
    "academicSessionId" TEXT NOT NULL,
    "curriculumTrackId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "chapterId" TEXT,
    "topicId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "testType" "TestType" NOT NULL,
    "testDate" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER,
    "maximumMarks" INTEGER NOT NULL,
    "syllabusDescription" TEXT,
    "questionPaperFileId" TEXT,
    "lifecycleState" "TestLifecycleState" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "archivedBy" TEXT,

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Test_academicSessionId_curriculumTrackId_lifecycleState_idx" ON "Test"("academicSessionId", "curriculumTrackId", "lifecycleState");

-- CreateIndex
CREATE INDEX "Test_batchId_lifecycleState_idx" ON "Test"("batchId", "lifecycleState");

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_academicSessionId_fkey" FOREIGN KEY ("academicSessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_curriculumTrackId_fkey" FOREIGN KEY ("curriculumTrackId") REFERENCES "CurriculumTrack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_questionPaperFileId_fkey" FOREIGN KEY ("questionPaperFileId") REFERENCES "FileAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
