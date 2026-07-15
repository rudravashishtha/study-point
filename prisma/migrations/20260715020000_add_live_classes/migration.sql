-- CreateEnum
CREATE TYPE "LiveClassSessionStatus" AS ENUM ('SCHEDULED', 'CANCELLED', 'COMPLETED');

-- DropIndex
DROP INDEX "AcademicSession_isActive_key";

-- DropIndex
DROP INDEX "Batch_session_track_name_key";

-- DropIndex
DROP INDEX "CurriculumTrack_board_class_subject_null_prog_key";

-- DropIndex
DROP INDEX "CurriculumTrack_board_prog_class_subject_key";

-- DropIndex
DROP INDEX "Enrolment_student_session_track_key";

-- DropIndex
DROP INDEX "StudentFeeAssignment_enrolmentId_feePlanId_key";

-- DropIndex
DROP INDEX "TeacherAssignment_teacher_batch_key";

-- CreateTable
CREATE TABLE "LiveClassSession" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "batchScheduleId" TEXT,
    "title" TEXT NOT NULL,
    "scheduledStartTime" TIMESTAMP(3) NOT NULL,
    "scheduledEndTime" TIMESTAMP(3) NOT NULL,
    "meetingUrl" TEXT,
    "status" "LiveClassSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "LiveClassSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LiveClassSession_batchId_idx" ON "LiveClassSession"("batchId");

-- CreateIndex
CREATE INDEX "LiveClassSession_teacherId_idx" ON "LiveClassSession"("teacherId");

-- CreateIndex
CREATE INDEX "LiveClassSession_scheduledStartTime_idx" ON "LiveClassSession"("scheduledStartTime");

-- CreateIndex
CREATE INDEX "LiveClassSession_status_idx" ON "LiveClassSession"("status");

-- CreateIndex
CREATE INDEX "LiveClassSession_batchId_scheduledStartTime_idx" ON "LiveClassSession"("batchId", "scheduledStartTime");

-- CreateIndex
CREATE INDEX "LiveClassSession_teacherId_scheduledStartTime_idx" ON "LiveClassSession"("teacherId", "scheduledStartTime");

-- AddForeignKey
ALTER TABLE "LiveClassSession" ADD CONSTRAINT "LiveClassSession_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassSession" ADD CONSTRAINT "LiveClassSession_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassSession" ADD CONSTRAINT "LiveClassSession_batchScheduleId_fkey" FOREIGN KEY ("batchScheduleId") REFERENCES "BatchSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
