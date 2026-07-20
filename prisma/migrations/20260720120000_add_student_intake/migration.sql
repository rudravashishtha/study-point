-- CreateEnum
CREATE TYPE "StudentIntakeSubmissionStatus" AS ENUM ('NEW', 'CONTACTED', 'REVIEWED', 'CONVERTED', 'REJECTED');

-- CreateTable
CREATE TABLE "StudentIntakeLink" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "academicSessionId" TEXT NOT NULL,
    "curriculumTrackId" TEXT,
    "batchId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "maxSubmissions" INTEGER,
    "submissionCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,

    CONSTRAINT "StudentIntakeLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentIntakeSubmission" (
    "id" TEXT NOT NULL,
    "intakeLinkId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "phone" TEXT,
    "guardianName" TEXT,
    "guardianPhone" TEXT,
    "email" TEXT,
    "school" TEXT,
    "address" TEXT,
    "message" TEXT,
    "academicSessionId" TEXT NOT NULL,
    "curriculumTrackId" TEXT,
    "batchId" TEXT,
    "status" "StudentIntakeSubmissionStatus" NOT NULL DEFAULT 'NEW',
    "adminNotes" TEXT,
    "convertedStudentId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,

    CONSTRAINT "StudentIntakeSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentIntakeLink_tokenHash_key" ON "StudentIntakeLink"("tokenHash");
CREATE INDEX "StudentIntakeLink_academicSessionId_idx" ON "StudentIntakeLink"("academicSessionId");
CREATE INDEX "StudentIntakeLink_curriculumTrackId_idx" ON "StudentIntakeLink"("curriculumTrackId");
CREATE INDEX "StudentIntakeLink_batchId_idx" ON "StudentIntakeLink"("batchId");
CREATE INDEX "StudentIntakeLink_createdBy_idx" ON "StudentIntakeLink"("createdBy");
CREATE INDEX "StudentIntakeLink_isActive_archivedAt_idx" ON "StudentIntakeLink"("isActive", "archivedAt");
CREATE INDEX "StudentIntakeLink_expiresAt_idx" ON "StudentIntakeLink"("expiresAt");
CREATE INDEX "StudentIntakeSubmission_intakeLinkId_idx" ON "StudentIntakeSubmission"("intakeLinkId");
CREATE INDEX "StudentIntakeSubmission_academicSessionId_idx" ON "StudentIntakeSubmission"("academicSessionId");
CREATE INDEX "StudentIntakeSubmission_curriculumTrackId_idx" ON "StudentIntakeSubmission"("curriculumTrackId");
CREATE INDEX "StudentIntakeSubmission_batchId_idx" ON "StudentIntakeSubmission"("batchId");
CREATE INDEX "StudentIntakeSubmission_status_idx" ON "StudentIntakeSubmission"("status");
CREATE INDEX "StudentIntakeSubmission_submittedAt_idx" ON "StudentIntakeSubmission"("submittedAt");
CREATE INDEX "StudentIntakeSubmission_convertedStudentId_idx" ON "StudentIntakeSubmission"("convertedStudentId");

-- AddForeignKey
ALTER TABLE "StudentIntakeLink" ADD CONSTRAINT "StudentIntakeLink_academicSessionId_fkey" FOREIGN KEY ("academicSessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentIntakeLink" ADD CONSTRAINT "StudentIntakeLink_curriculumTrackId_fkey" FOREIGN KEY ("curriculumTrackId") REFERENCES "CurriculumTrack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentIntakeLink" ADD CONSTRAINT "StudentIntakeLink_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentIntakeLink" ADD CONSTRAINT "StudentIntakeLink_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentIntakeSubmission" ADD CONSTRAINT "StudentIntakeSubmission_intakeLinkId_fkey" FOREIGN KEY ("intakeLinkId") REFERENCES "StudentIntakeLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentIntakeSubmission" ADD CONSTRAINT "StudentIntakeSubmission_academicSessionId_fkey" FOREIGN KEY ("academicSessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentIntakeSubmission" ADD CONSTRAINT "StudentIntakeSubmission_curriculumTrackId_fkey" FOREIGN KEY ("curriculumTrackId") REFERENCES "CurriculumTrack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentIntakeSubmission" ADD CONSTRAINT "StudentIntakeSubmission_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentIntakeSubmission" ADD CONSTRAINT "StudentIntakeSubmission_convertedStudentId_fkey" FOREIGN KEY ("convertedStudentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentIntakeSubmission" ADD CONSTRAINT "StudentIntakeSubmission_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
