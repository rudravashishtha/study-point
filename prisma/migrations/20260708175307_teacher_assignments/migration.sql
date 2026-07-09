/*
  Warnings:

  - You are about to drop the column `teacherId` on the `Batch` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PermissionCapability" AS ENUM ('BATCH_VIEW', 'BATCH_MANAGE', 'MEMBERS_VIEW', 'MEMBERS_MANAGE', 'ATTENDANCE_VIEW', 'ATTENDANCE_MANAGE', 'CURRICULUM_PROGRESS_VIEW', 'CURRICULUM_PROGRESS_MANAGE', 'MATERIALS_VIEW', 'MATERIALS_MANAGE', 'HOMEWORK_VIEW', 'HOMEWORK_MANAGE', 'QUESTION_BANK_VIEW', 'QUESTION_BANK_MANAGE', 'TESTS_VIEW', 'TESTS_MANAGE', 'RESULTS_VIEW', 'RESULTS_MANAGE', 'FEES_VIEW', 'FEES_MANAGE', 'PAYMENTS_RECORD', 'SCHEDULE_VIEW', 'SCHEDULE_MANAGE', 'ANNOUNCEMENTS_VIEW', 'ANNOUNCEMENTS_MANAGE');

-- CreateTable
CREATE TABLE "TeacherAssignment" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "permissions" "PermissionCapability"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,

    CONSTRAINT "TeacherAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeacherAssignment_teacherId_idx" ON "TeacherAssignment"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherAssignment_batchId_idx" ON "TeacherAssignment"("batchId");

-- CreatePartialUniqueIndex
CREATE UNIQUE INDEX "TeacherAssignment_teacher_batch_key" ON "TeacherAssignment"("teacherId", "batchId") WHERE "archivedAt" IS NULL;

-- AddForeignKey
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Data Backfill
INSERT INTO "TeacherAssignment" (
  "id", "teacherId", "batchId", "permissions", "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(), 
  "teacherId", 
  "id", 
  ARRAY['BATCH_VIEW', 'MEMBERS_VIEW']::"PermissionCapability"[], 
  NOW(), 
  NOW()
FROM "Batch" 
WHERE "teacherId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "Batch" DROP CONSTRAINT "Batch_teacherId_fkey";

-- AlterTable
ALTER TABLE "Batch" DROP COLUMN "teacherId";
