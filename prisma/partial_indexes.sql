-- Enforce only one active academic session
CREATE UNIQUE INDEX "AcademicSession_isActive_key" 
ON "AcademicSession" ("isActive") 
WHERE "isActive" = true;

-- Enforce CurriculumTrack uniqueness for CBSE (programmeId IS NULL)
CREATE UNIQUE INDEX "CurriculumTrack_board_class_subject_null_prog_key" 
ON "CurriculumTrack" ("boardId", "classLevel", "subjectId") 
WHERE "programmeId" IS NULL;

-- Enforce CurriculumTrack uniqueness for CISCE (programmeId IS NOT NULL)
CREATE UNIQUE INDEX "CurriculumTrack_board_prog_class_subject_key" 
ON "CurriculumTrack" ("boardId", "programmeId", "classLevel", "subjectId") 
WHERE "programmeId" IS NOT NULL;
