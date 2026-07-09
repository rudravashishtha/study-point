# Database Design

Phase: 0 research and planning.
Status: Draft for human review.
Last reviewed: 2026-07-07.

## Design Principles

- Use relational modelling for core domain data.
- Keep authentication identity separate from application user and domain profiles.
- Keep permanent student data separate from session-specific enrolment.
- Scope academic records to `AcademicSession` where required.
- Scope academic content with curriculum records, not class level alone.
- Keep `Subject` as a proper entity even though the initial subject is Mathematics.
- Prefer enums for controlled business states.
- Use JSON only for genuinely flexible settings, not as a substitute for relational modelling.
- Archive normal business records instead of deleting them through the UI.
- Avoid redundant student references where an entity already belongs to an enrolment.
- Add useful unique constraints and indexes during schema implementation.

## Core Identity Model

### AppUser

Application-level user linked to Supabase Auth.

Important fields:

- `id`.
- `supabaseAuthUserId`, unique, nullable until invitation/linking completes.
- `email`, unique where present.
- `role`: `ADMIN`, `TEACHER`, `STUDENT`.
- `status`: active, invited, disabled.
- `studentId`, nullable unique.
- `teacherId`, nullable unique.
- `createdAt`, `updatedAt`, `createdBy`, `updatedBy`.

Notes:

- A student can exist without an `AppUser`.
- Student account activation uses Supabase invitation.
- An `AppUser` must not contain student or teacher domain details.
- Client-supplied role must never be trusted.

### Student

Permanent student identity and institute information.

Important fields:

- `id`.
- `studentCode`, unique.
- `fullName`.
- `phone`, nullable.
- `guardianPhone`, nullable.
- `email`, nullable.
- `joiningDate`.
- `accountStatus`: none, invited, active, disabled.
- `archivedAt`, `archivedBy`.
- Metadata fields where useful.

Notes:

- Student IDs are application-generated, human-readable identifiers. Use a sensible initial format such as `STU-2026-0001`.
- Keep student ID generation logic isolated so the format can be changed before real production data is imported.

Relationships:

- One student can have many enrolments.
- One student can have zero or one linked student `AppUser`.

### Teacher

Teacher domain profile. Teacher portal is deferred, but the role and schema support remain.

Important fields:

- `id`.
- `displayName`.
- `phone`, nullable.
- `email`, nullable.
- `bio`, nullable.
- `qualifications`, nullable text.
- `photoFileId`, nullable.
- `active`.
- Metadata fields.

Relationships:

- One teacher can have zero or one linked teacher `AppUser`.
- One teacher can have assignments to many batches.

**Teacher Authorization Model (Planned, not implemented):**

Teacher authorization is contextual.

A Teacher does not receive institute-wide capabilities merely from having the TEACHER role.

Access is scoped through Teacher-to-Batch assignments. Each assignment may grant a different set of permissions.

A Teacher may:

- manage attendance in Batch A
- manage curriculum progress in Batch A
- have read-only access to Batch B
- have no access to Batch C

The architecture supports multiple Teachers per Batch through `TeacherAssignment` records.

Canonical curriculum structure remains Admin-controlled. Teachers may be granted permission to manage Batch-specific curriculum progress, but this does not imply permission to edit global curriculum Tracks, Chapters, or Topics.

Important Distinction:

- **Role** answers: What kind of account is this?
- **Assignment** answers: Which Batch can this Teacher access?
- **Permission** answers: What can this Teacher do in that Batch?

## Curriculum Model

The curriculum hierarchy is:

```text
Board -> Programme where relevant -> ClassLevel -> Subject -> Chapter -> Topic
```

### Board

Important fields:

- `id`.
- `code`, unique, such as `CBSE` or `CISCE`.
- `name`.
- `active`.

Initial records:

- CBSE.
- CISCE.

### Programme

Represents board-specific programmes where relevant.

Important fields:

- `id`.
- `boardId`.
- `code`, such as `ICSE` or `ISC`.
- `name`.
- `active`.

Initial records:

- CISCE/ICSE for Classes IX and X.
- CISCE/ISC for Classes XI and XII.

CBSE does not require ICSE/ISC-style programme rows in the initial model. `CurriculumTrack.programmeId` can be nullable for CBSE. CBSE Secondary and Senior Secondary are display groupings only and must not create another programme layer in the database.

### ClassLevel

Recommended implementation:

- Enum values: `IX`, `X`, `XI`, `XII`.

### Subject

Important fields:

- `id`.
- `code`, unique, initially `MATHEMATICS`.
- `name`, initially `Mathematics`.
- `active`.

Subject remains a proper entity even while only Mathematics is taught.

### CurriculumTrack

Canonical valid teaching combination.

Important fields:

- `id`.
- `boardId`.
- `programmeId`, nullable.
- `classLevel`.
- `subjectId`.
- `displayName`.
- `active`.

Initial examples:

- CBSE, Class IX, Mathematics.
- CBSE, Class X, Mathematics.
- CBSE, Class XI, Mathematics.
- CBSE, Class XII, Mathematics.
- CISCE, ICSE, Class IX, Mathematics.
- CISCE, ICSE, Class X, Mathematics.
- CISCE, ISC, Class XI, Mathematics.
- CISCE, ISC, Class XII, Mathematics.

Constraints:

- Unique `(boardId, programmeId, classLevel, subjectId)`, accounting for nullable `programmeId`.
- CISCE tracks must have a programme.
- CISCE/ICSE is valid only for IX and X.
- CISCE/ISC is valid only for XI and XII.
- CBSE tracks should not use CISCE programmes.
- CBSE display grouping is presentation metadata only, not a programme relationship.

These constraints may require application validation plus database check constraints or custom migrations.

### Chapter

Important fields:

- `id`.
- `curriculumTrackId`.
- `name`.
- `displayOrder`.
- `active`.

### Topic

Important fields:

- `id`.
- `chapterId`.
- `name`.
- `displayOrder`.
- `active`.

Indexes:

- Chapters by `curriculumTrackId`.
- Topics by `chapterId`.

## Academic Session And Enrolment

### AcademicSession

Represents sessions such as `2026-27`.

Important fields:

- `id`.
- `name`, unique.
- `startsOn`, `endsOn`.
- `isActive`.
- `archivedAt`, nullable.
- Metadata fields.

Constraints:

- Only one active session should be allowed. In PostgreSQL this is best enforced with a partial unique index, which may require a custom migration.

### Enrolment

Session-specific academic membership for a student.

Important fields:

- `id`.
- `studentId`.
- `academicSessionId`.
- `curriculumTrackId`.
- `batchId`, nullable for unassigned students.
- `joiningDate`.
- `status`: active, completed, withdrawn, suspended.
- `archivedAt`, `archivedBy`.
- Metadata fields.

Relationships:

- Many enrolments belong to one student.
- Many enrolments belong to one academic session.
- Many enrolments belong to one curriculum track.
- Many enrolments can belong to one batch.

Constraints:

- Prevent multiple active enrolments for the same student in the same academic session and curriculum track unless explicitly approved later.
- If `batchId` is present, the batch academic session and curriculum track must match the enrolment.
- Student portal initially uses active enrolments only. Historical enrolment views can be added later as read-only.

## Batch And Timetable

### Batch

Academic group for one curriculum track in one academic session.

Important fields:

- `id`.
- `academicSessionId`.
- `curriculumTrackId`.
- `name`.
- `capacity`, nullable.
- `isPublic`.
- `showFeePublicly`, configurable.
- `isActive`.
- `archivedAt`, `archivedBy`.
- Metadata fields.

Constraints:

- Unique batch name per academic session and curriculum track.
- Enrolments assigned to a batch must match academic session and curriculum track.

### BatchSchedule

Schedule rows for batches.

Important fields:

- `id`.
- `batchId`.
- `dayOfWeek`.
- `startTime`.
- `endTime`.
- `roomOrLocation`, nullable.
- `liveClassUrl`, nullable.
- `isActive`.

Constraints:

- `endTime` must be after `startTime`.
- Live class links are restricted data and should not be shown publicly unless explicitly intended.

## Files

### FileAsset

Reusable metadata for stored files.

Important fields:

- `id`.
- `bucket`.
- `path`.
- `originalFilename`.
- `mimeType`.
- `sizeBytes`.
- `visibility`: public, authenticated, restricted.
- `uploadedBy`.
- `createdAt`.
- `retainedUntil`, nullable for temporary files.
- `archivedAt`, nullable.

Notes:

- Use this for materials, homework attachments, test papers, question images, gallery images, teacher photos, import source files, error reports, and public assets.
- Authorization belongs to the owning entity, not only the file record.
- Archived files are retained.
- Temporary import source files are retained for 30 days.

## Academic Content

### StudyMaterial

Important fields:

- `id`.
- `academicSessionId`.
- `curriculumTrackId`.
- `batchId`, nullable.
- `chapterId`, nullable.
- `topicId`, nullable.
- `title`.
- `description`.
- `resourceType`: notes, pdf, formula_sheet, important_questions, sample_paper, previous_year_paper, solution, answer_key, other.
- `fileAssetId`.
- `visibility`: public, curriculum_track, batch.
- `publishedAt`, nullable.
- `archivedAt`, `archivedBy`.
- Metadata fields.

Constraints:

- `chapterId` and `topicId` must belong to the same curriculum track.
- If `batchId` is present, batch curriculum track and academic session must match.

Indexes:

- Academic session, curriculum track, batch, chapter, topic, type, published state, archived state.

### Homework

Important fields:

- `id`.
- `academicSessionId`.
- `curriculumTrackId`.
- `batchId`.
- `chapterId`, nullable.
- `topicId`, nullable.
- `title`.
- `description`.
- `assignedDate`.
- `dueDate`.
- `fileAssetId`, nullable.
- `publishedAt`, nullable.
- `archivedAt`, `archivedBy`.
- Metadata fields.

Future extension:

- Add `HomeworkSubmission` later with `homeworkId` and `enrolmentId`. Do not duplicate `studentId` unless a deliberate denormalized snapshot is required.

### Test

Important fields:

- `id`.
- `academicSessionId`.
- `curriculumTrackId`.
- `batchId`, nullable.
- `chapterId`, nullable.
- `topicId`, nullable.
- `title`.
- `testType`: chapter_test, unit_test, full_syllabus_test.
- `testDate`.
- `durationMinutes`, nullable.
- `maximumMarks`.
- `syllabusDescription`.
- `questionPaperFileId`, nullable.
- `publishedAt`, nullable.
- `archivedAt`, `archivedBy`.
- Metadata fields.

Future extension:

- Add `TestResult` later with `testId` and `enrolmentId`. Avoid redundant `studentId` unless a snapshot is explicitly justified.

### Question

Important fields:

- `id`.
- `curriculumTrackId`.
- `chapterId`.
- `topicId`, nullable.
- `questionText`.
- `questionFormat`: plain_text, markdown_latex.
- `questionType`: short_answer, long_answer, mcq, numerical, proof, assertion_reason, case_study, other.
- `difficulty`: easy, medium, hard.
- `marks`.
- `answerText`, nullable.
- `solutionText`, nullable.
- `imageFileId`, nullable.
- `source`, nullable.
- `academicRelevance`, nullable.
- `archivedAt`, `archivedBy`.
- Metadata fields.

Notes:

- Store source text with Unicode mathematics and LaTeX expressions.
- Do not store only rendered HTML.
- Rendering should happen through a maintained renderer such as KaTeX.

Indexes:

- Curriculum track, chapter, topic, type, difficulty, marks, archived state.

## Fees

Use a normalized model that can represent actual dues and partial payments.

### FeePlan

Important fields:

- `id`.
- `academicSessionId`.
- `curriculumTrackId`, nullable for plans that apply across several tracks.
- `batchId`, nullable for batch-specific plans.
- `name`.
- `description`, nullable.
- `totalAmount`.
- `frequency`: monthly, quarterly, yearly, custom.
- `showPublicly`.
- `active`.
- Metadata fields.

Constraints:

- If `batchId` is present, its academic session and curriculum track must match the plan.
- Public fee visibility is configurable per course or batch through course content, fee plan, or batch settings.

### FeePlanInstallment

Normalizes all plan structures, including custom plans.

Important fields:

- `id`.
- `feePlanId`.
- `label`.
- `dueOffsetDays`, nullable.
- `dueDate`, nullable.
- `amount`.
- `displayOrder`.
- `active`.

Constraints:

- Instalment amounts should sum to the fee plan total unless an approved discount/override flow exists.
- Custom fee plans use instalment rows, not JSON.

### StudentFeeAssignment

Assigns a fee plan to an enrolment.

Important fields:

- `id`.
- `enrolmentId`.
- `feePlanId`.
- `assignedTotalAmount`.
- `startsOn`.
- `endsOn`, nullable.
- `status`: active, completed, cancelled.
- Metadata fields.

Notes:

- Do not store `studentId`; it is available through `enrolmentId`.
- Creating an assignment must not silently create payable dues. Dues are generated through an admin-reviewed preview and confirmation flow.

### StudentFeeDue

Concrete dues generated from an assignment.

Important fields:

- `id`.
- `feeAssignmentId`.
- `feePlanInstallmentId`, nullable for manual adjusted dues.
- `label`.
- `dueDate`.
- `amountDue`.
- `amountWaived`, default 0.
- `status`: pending, partially_paid, paid, waived, cancelled, overdue.
- `createdAt`, `updatedAt`.

Notes:

- Do not store `studentId`; it is available through assignment -> enrolment.
- Pending amount is derived from `amountDue - amountWaived - sum(payment allocations)`.
- Dues should be generated only after admin preview and confirmation.

### Payment

Records money received for one enrolment.

Important fields:

- `id`.
- `enrolmentId`.
- `amountReceived`.
- `paymentDate`.
- `method`: cash, upi, bank_transfer, cheque, other.
- `reference`, nullable.
- `notes`, nullable.
- `recordedBy`.
- `createdAt`, `updatedAt`.

Notes:

- Do not store `studentId`; it is available through `enrolmentId`.
- A payment can be allocated to one or more dues.

### PaymentAllocation

Allocates payment amounts to dues.

Important fields:

- `id`.
- `paymentId`.
- `studentFeeDueId`.
- `amount`.
- `createdAt`.

Constraints:

- Allocation amount must be positive.
- Total allocations for a payment cannot exceed `amountReceived`.
- Total allocations for a due cannot exceed the due's unpaid amount.
- Payment enrolment must match the due's assignment enrolment.

## Announcements

### Announcement

Important fields:

- `id`.
- `academicSessionId`, nullable for public non-session announcements.
- `audience`: public, all_students, curriculum_track, batch.
- `curriculumTrackId`, nullable.
- `batchId`, nullable.
- `title`.
- `content`.
- `priority`.
- `publishedAt`, nullable.
- `expiresAt`, nullable.
- `archivedAt`, `archivedBy`.
- Metadata fields.

Constraints:

- Audience-specific fields must be present only when appropriate.
- Batch audience must imply the batch curriculum track.

## Website Content

Use typed models instead of a generic CMS.

Recommended entities:

- `SiteSettings`: institute name, contact, WhatsApp, address, map, opening hours, SEO defaults.
- `TeacherProfileContent`: public teacher profile fields and photo.
- `HomePageContent`: structured home sections and highlighted content.
- `CourseContent`: one row per curriculum track or approved grouping with description, syllabus overview, teaching approach, and fee display settings.
- `MethodologyStep`: ordered public methodology items.
- `Result`: public achievement rows with board/programme/class/subject display fields, optional photo, consent status, and published state.
- `Testimonial`: public testimonial rows with consent status and published state.
- `GalleryItem`: optional public images with consent status when identifiable people appear.
- `PublicResource`: public downloadable resources scoped to curriculum track where relevant.
- `FAQ`: ordered public questions and answers.

Only flexible visual ordering or repeated simple blocks should use JSON; core records should be relational.

## Imports And Audit

### ImportJob

Important fields:

- `id`.
- `importType`: students, questions.
- `originalFilename`.
- `uploadedBy`.
- `startedAt`.
- `completedAt`.
- `status`: pending, validating, ready, processing, completed, completed_with_errors, failed.
- `totalRows`.
- `successfulRows`.
- `failedRows`.
- `skippedRows`.
- `errorSummary`.
- `sourceFileAssetId`, nullable, retained for 30 days.
- `errorReportFileAssetId`, nullable.

### ImportError

Important fields:

- `id`.
- `importJobId`.
- `rowNumber`.
- `columnName`.
- `severity`: warning, error.
- `message`.
- `expectedValue`, nullable.
- `rawValue`, nullable.

Question import required columns:

- Board.
- Programme, required for CISCE and must be ICSE or ISC.
- Class level.
- Subject.
- Chapter.
- Topic when applicable.
- Question text.
- Question type.
- Difficulty.
- Marks.

The importer must reject ambiguous curriculum rows, for example CISCE without ICSE/ISC or ICSE Class XI.

### AuditLog

Important fields:

- `id`.
- `actorUserId`.
- `action`.
- `entityType`.
- `entityId`, nullable.
- `summary`.
- `metadata`, JSON with no secrets.
- `createdAt`.

Audit important actions:

- Student activation.
- Role changes.
- Fee due, payment, and allocation changes.
- Bulk imports.
- Archive and restore.
- Important content changes.

Never log passwords, tokens, service keys, private signed URLs, or sensitive auth material.

## Archive Strategy

Entities requiring archive/restore:

- Student.
- Batch.
- StudyMaterial.
- Homework.
- Test.
- Question.
- Result where appropriate.
- GalleryItem where appropriate.
- PublicResource where appropriate.

Archive fields:

- `archivedAt`.
- `archivedBy`.

Normal listings filter out archived records by default. Historical relationships and files remain intact.

## Important Constraints To Enforce

- Unique active academic session, likely via custom partial unique index.
- Unique `studentCode`.
- Unique Supabase auth user link in `AppUser`.
- Valid board/programme/class/subject combinations in `CurriculumTrack`.
- At most one active enrolment per student per academic session and curriculum track unless requirements change.
- Enrolment batch must match academic session and curriculum track.
- Material, homework, test, chapter, and topic records must match curriculum track.
- Announcement audience must match target fields.
- Fee plan/batch/curriculum relationships must match.
- Payment allocation enrolment must match due enrolment.
- Payment and due amounts must be positive.
- Test maximum marks must be positive.
- Schedule end time must be after start time.

## Resolved Database Decisions

- `ClassLevel` remains an enum for IX-XII.
- `Subject` is a first-class table.
- CISCE is the board; ICSE and ISC are programmes.
- CBSE Secondary and Senior Secondary are display groupings only, not database programmes.
- Public result rows store public display fields and consent rather than requiring a direct `Student` link.
- Teacher public content can optionally link to a teacher but remains separately publishable content.
- Custom fee plans use normalized `FeePlanInstallment` rows, not JSON.
- Payments and dues avoid redundant student references when linked through enrolment.
- Fee dues are generated through admin-reviewed preview and confirmation, not silently on assignment.
- Student IDs are generated by isolated application logic, initially in a format such as `STU-2026-0001`.

## Future Migration Protocol (Partial Indexes)

Prisma's migration engine cannot internally model custom `WHERE` clause partial unique indexes (e.g., `AcademicSession_isActive_key`, `CurriculumTrack_board_class_subject_null_prog_key`). It views them as database drift and will automatically attempt to inject destructive `DROP INDEX` statements into every new migration.

To guarantee that these critical invariants are never accidentally wiped, this strict protocol **MUST** be followed for all future migrations:

1. **Migration Generation & Development Review:** Never run `prisma migrate dev` interactively to apply changes directly. Always generate migrations in a staged manner using `--create-only`:
   `npx prisma migrate dev --create-only --name <migration_name>`
2. **Mandatory Inspection:** Open the generated `migration.sql` and explicitly search for `DROP INDEX` commands targeting our custom partial indexes.
3. **Explicit Index Stripping:** Manually delete those destructive `DROP INDEX` lines from the SQL file.
4. **Migration Application (Development):** Only after saving the stripped `migration.sql` file, apply the migration to the local development environment using the appropriate Prisma command for the configured database.
5. **Production Deployment:** Use `npx prisma migrate deploy` to safely apply the exact, reviewed SQL in staging or production environments. Do not document or use `prisma migrate dev` as the universal command for applying migrations in every environment.
