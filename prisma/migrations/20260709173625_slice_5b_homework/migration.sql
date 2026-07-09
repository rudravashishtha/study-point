-- CreateEnum
CREATE TYPE "HomeworkLifecycleState" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterEnum
ALTER TYPE "FileUploadUsageCategory" ADD VALUE 'HOMEWORK';



-- CreateTable
CREATE TABLE "Homework" (
    "id" TEXT NOT NULL,
    "academicSessionId" TEXT NOT NULL,
    "curriculumTrackId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "chapterId" TEXT,
    "topicId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileAssetId" TEXT,
    "assignedDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "lifecycleState" "HomeworkLifecycleState" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "archivedBy" TEXT,

    CONSTRAINT "Homework_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Homework_academicSessionId_curriculumTrackId_lifecycleState_idx" ON "Homework"("academicSessionId", "curriculumTrackId", "lifecycleState");

-- CreateIndex
CREATE INDEX "Homework_batchId_lifecycleState_idx" ON "Homework"("batchId", "lifecycleState");

-- AddForeignKey
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_academicSessionId_fkey" FOREIGN KEY ("academicSessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_curriculumTrackId_fkey" FOREIGN KEY ("curriculumTrackId") REFERENCES "CurriculumTrack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_fileAssetId_fkey" FOREIGN KEY ("fileAssetId") REFERENCES "FileAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
