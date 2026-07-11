-- CreateEnum
CREATE TYPE "FeePlanFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'OTHER');

-- CreateEnum
CREATE TYPE "FeeDueStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'WAIVED', 'CANCELLED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "FeeAssignmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- DropIndex
DROP INDEX IF EXISTS "AcademicSession_isActive_key";

-- DropIndex
DROP INDEX IF EXISTS "Batch_session_track_name_key";

-- DropIndex
DROP INDEX IF EXISTS "CurriculumTrack_board_class_subject_null_prog_key";

-- DropIndex
DROP INDEX IF EXISTS "CurriculumTrack_board_prog_class_subject_key";

-- DropIndex
DROP INDEX IF EXISTS "Enrolment_student_session_track_key";

-- DropIndex
DROP INDEX IF EXISTS "TeacherAssignment_teacher_batch_key";

-- CreateTable
CREATE TABLE "FeePlan" (
    "id" TEXT NOT NULL,
    "academicSessionId" TEXT NOT NULL,
    "curriculumTrackId" TEXT NOT NULL,
    "batchId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "frequency" "FeePlanFrequency" NOT NULL,
    "showPublicly" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,

    CONSTRAINT "FeePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeePlanInstallment" (
    "id" TEXT NOT NULL,
    "feePlanId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "dueOffsetDays" INTEGER,
    "dueDate" TIMESTAMP(3),
    "amount" DECIMAL(10,2) NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeePlanInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeePlan_academicSessionId_idx" ON "FeePlan"("academicSessionId");

-- CreateIndex
CREATE INDEX "FeePlan_curriculumTrackId_idx" ON "FeePlan"("curriculumTrackId");

-- CreateIndex
CREATE INDEX "FeePlan_batchId_idx" ON "FeePlan"("batchId");

-- CreateIndex
CREATE INDEX "FeePlan_frequency_idx" ON "FeePlan"("frequency");

-- CreateIndex
CREATE INDEX "FeePlan_isActive_idx" ON "FeePlan"("isActive");

-- CreateIndex
CREATE INDEX "FeePlanInstallment_feePlanId_idx" ON "FeePlanInstallment"("feePlanId");

-- AddForeignKey
ALTER TABLE "FeePlan" ADD CONSTRAINT "FeePlan_academicSessionId_fkey" FOREIGN KEY ("academicSessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePlan" ADD CONSTRAINT "FeePlan_curriculumTrackId_fkey" FOREIGN KEY ("curriculumTrackId") REFERENCES "CurriculumTrack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePlan" ADD CONSTRAINT "FeePlan_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePlanInstallment" ADD CONSTRAINT "FeePlanInstallment_feePlanId_fkey" FOREIGN KEY ("feePlanId") REFERENCES "FeePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Re-create protected unmanaged partial unique indexes
-- These are created via custom SQL and must be restored after Prisma's automatic DROP.
CREATE UNIQUE INDEX "AcademicSession_isActive_key" ON "AcademicSession" ("isActive") WHERE "isActive" = true;
CREATE UNIQUE INDEX "Batch_session_track_name_key" ON "Batch" ("academicSessionId", "curriculumTrackId", "name") WHERE "archivedAt" IS NULL;
CREATE UNIQUE INDEX "CurriculumTrack_board_class_subject_null_prog_key" ON "CurriculumTrack" ("boardId", "classLevel", "subjectId") WHERE "programmeId" IS NULL;
CREATE UNIQUE INDEX "CurriculumTrack_board_prog_class_subject_key" ON "CurriculumTrack" ("boardId", "programmeId", "classLevel", "subjectId") WHERE "programmeId" IS NOT NULL;
CREATE UNIQUE INDEX "Enrolment_student_session_track_key" ON "Enrolment" ("studentId", "academicSessionId", "curriculumTrackId") WHERE "archivedAt" IS NULL;
CREATE UNIQUE INDEX "TeacherAssignment_teacher_batch_key" ON "TeacherAssignment" ("teacherId", "batchId") WHERE "archivedAt" IS NULL;
