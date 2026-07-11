-- CreateEnum
CREATE TYPE "QuestionFormat" AS ENUM ('PLAIN_TEXT', 'MARKDOWN_LATEX');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SHORT_ANSWER', 'LONG_ANSWER', 'MCQ', 'NUMERICAL', 'PROOF', 'ASSERTION_REASON', 'CASE_STUDY', 'OTHER');

-- CreateEnum
CREATE TYPE "QuestionDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

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
DROP INDEX "TeacherAssignment_teacher_batch_key";

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "curriculumTrackId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "topicId" TEXT,
    "questionText" TEXT NOT NULL,
    "questionFormat" "QuestionFormat" NOT NULL DEFAULT 'MARKDOWN_LATEX',
    "questionType" "QuestionType" NOT NULL,
    "difficulty" "QuestionDifficulty" NOT NULL,
    "marks" INTEGER NOT NULL,
    "answerText" TEXT,
    "solutionText" TEXT,
    "imageFileId" TEXT,
    "source" TEXT,
    "academicRelevance" TEXT,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Question_curriculumTrackId_idx" ON "Question"("curriculumTrackId");

-- CreateIndex
CREATE INDEX "Question_chapterId_idx" ON "Question"("chapterId");

-- CreateIndex
CREATE INDEX "Question_topicId_idx" ON "Question"("topicId");

-- CreateIndex
CREATE INDEX "Question_curriculumTrackId_questionType_difficulty_idx" ON "Question"("curriculumTrackId", "questionType", "difficulty");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_curriculumTrackId_fkey" FOREIGN KEY ("curriculumTrackId") REFERENCES "CurriculumTrack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Re-create protected unmanaged partial unique indexes
-- These are created via custom SQL and must be restored after Prisma's automatic DROP.
CREATE UNIQUE INDEX "AcademicSession_isActive_key" ON "AcademicSession" ("isActive") WHERE "isActive" = true;
CREATE UNIQUE INDEX "Batch_session_track_name_key" ON "Batch" ("academicSessionId", "curriculumTrackId", "name") WHERE "archivedAt" IS NULL;
CREATE UNIQUE INDEX "CurriculumTrack_board_class_subject_null_prog_key" ON "CurriculumTrack" ("boardId", "classLevel", "subjectId") WHERE "programmeId" IS NULL;
CREATE UNIQUE INDEX "CurriculumTrack_board_prog_class_subject_key" ON "CurriculumTrack" ("boardId", "programmeId", "classLevel", "subjectId") WHERE "programmeId" IS NOT NULL;
CREATE UNIQUE INDEX "Enrolment_student_session_track_key" ON "Enrolment" ("studentId", "academicSessionId", "curriculumTrackId") WHERE "archivedAt" IS NULL;
CREATE UNIQUE INDEX "TeacherAssignment_teacher_batch_key" ON "TeacherAssignment" ("teacherId", "batchId") WHERE "archivedAt" IS NULL;
