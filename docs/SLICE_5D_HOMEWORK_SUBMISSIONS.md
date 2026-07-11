# Slice 5D: Homework Submissions

**STATUS: UNAPPROVED DRAFT PROPOSAL — NOT PART OF APPROVED ROADMAP**

This document is an unapproved implementation proposal. It does not represent planned work.
Homework Submissions remain explicitly deferred per `IMPLEMENTATION_PLAN.md` and out of
scope per `PRODUCT_SCOPE.md`. Do not implement from this document without explicit approval
and corresponding updates to the authoritative planning documents.

**Status:** Draft Proposal (Unapproved)
**Phase:** Proposed — not assigned
**Depends on:** Slice 5B (Homework), Slice 5A (Upload Infrastructure) — if approved

---

## 1. Scope

Add student homework submission capability. Students upload a file as a submission against a published homework. Teachers view submissions per homework and can mark them as returned with optional remarks.

### In Scope

- Database: `HomeworkSubmission` model
- Database: `HOMEWORK_SUBMISSION` value on `FileUploadUsageCategory`
- Service: `submitHomework` (student), `listHomeworkSubmissions` (teacher/admin), `listMySubmissions` (student), `returnSubmission` (teacher/admin)
- Upload: Student-facing submission upload component (reuses intent → signed URL → finalize flow)
- Student UI: Submit button + submission dialog + "submitted" status on homework list
- Teacher UI: View submissions for a homework + return action
- Admin UI: View/return submissions (admin superset)
- Download: Signed URL access for own submission (student) or batch-scoped submissions (teacher/admin)
- Migration: Prisma schema change + data migration
- Tests: Integration tests for service layer, UI tests for components

### Explicitly Deferred

- Grading (marks, grade letter, percentage)
- Teacher feedback beyond `remarks` field
- Resubmission lifecycle (student re-upload after return)
- Submission as text / rich text (file-only initially)
- Late submission flag / policy
- Bulk submission operations
- Notifications (email/WhatsApp) on submission or return
- Homework submission analytics

---

## 2. Schema Changes

### 2.1 New Enum

```prisma
enum HomeworkSubmissionLifecycleState {
  SUBMITTED
  RETURNED
}
```

### 2.2 New Model

```prisma
model HomeworkSubmission {
  id            String                          @id @default(uuid())
  homeworkId    String
  enrolmentId   String
  fileAssetId   String?
  description   String?                         @db.VarChar(2000)
  submittedAt   DateTime                        @default(now())
  lifecycleState HomeworkSubmissionLifecycleState @default(SUBMITTED)
  returnedAt    DateTime?
  remarks       String?                         @db.VarChar(2000)

  homework  Homework  @relation(fields: [homeworkId], references: [id])
  enrolment Enrolment @relation(fields: [enrolmentId], references: [id])
  fileAsset FileAsset? @relation(fields: [fileAssetId], references: [id])

  @@unique([homeworkId, enrolmentId])
  @@index([homeworkId])
  @@index([enrolmentId])
}
```

Rationale for `@@unique([homeworkId, enrolmentId])`:
- One submission per homework per enrolment (student in that batch).
- Covers the "already submitted" guard in the service layer.
- Unique constraint (not partial) is correct: if a submission is returned and the student needs to resubmit, we either:
  - (current scope) No resubmission — teacher returns, lifecycle ends.
  - (future scope) Resubmission — could remove and re-insert, or add a version counter.

### 2.3 Enum Addition

Add to existing `FileUploadUsageCategory`:

```prisma
enum FileUploadUsageCategory {
  STUDY_MATERIAL
  HOMEWORK
  TEST
  HOMEWORK_SUBMISSION  // NEW
}
```

### 2.4 Homework Model Update

Add reverse relation to `Homework`:

```prisma
model Homework {
  // ... existing fields ...
  submissions HomeworkSubmission[]
  // ... rest unchanged ...
}
```

### 2.5 FileAsset Model Update

Add relation for submission file assets:

```prisma
model FileAsset {
  // ... existing fields ...
  homeworkSubmissions HomeworkSubmission[] @relation("FileAssetHomeworkSubmission")
  // ... rest unchanged ...
}
```

### 2.6 Migration Notes

1. `prisma migrate dev --create-only` to capture the changes.
2. Edit generated migration:
   - `ALTER TYPE "FileUploadUsageCategory" ADD VALUE 'HOMEWORK_SUBMISSION'`
   - CREATE UNIQUE INDEX on (homeworkId, enrolmentId) — Prisma's `@@unique` handles this.
3. `prisma migrate dev` to apply.

Prisma enums are mapped to Postgres enums. Adding a value to a Postgres enum that is already in use requires:

```sql
ALTER TYPE "FileUploadUsageCategory" ADD VALUE 'HOMEWORK_SUBMISSION';
```

This is safe: it appends the value, existing rows keep their current value, and the new value is available for inserts.

---

## 3. Auth Boundaries

### 3.1 Student

- Must be authenticated `AppUser` with `STUDENT` role and `studentId`.
- Must have an `ACTIVE` enrolment in the batch that owns the homework.
- Homework must be in `PUBLISHED` state (not DRAFT, not ARCHIVED).
- Student may only submit to homework in batches where they have an active (non-archived) enrolment.
- Student may only view/download their own submissions.
- **No client-supplied enrolmentId**: derive enrolment from the authenticated student's active enrolments.

### 3.2 Teacher

- Must pass `requireTeacherPermission(batchId, HOMEWORK_MANAGE)`.
- Teacher may view all submissions for homework in their assigned batch.
- Teacher may return a submission.

### 3.3 Admin

- Admin superset: may view/return submissions for any homework.
- Admin bypass: no permission check beyond `requireAdmin()`.

### 3.4 Download Access

- **Student**: Signed URL for own submission files only.
- **Teacher**: Signed URL for submissions within their batch.
- **Admin**: Signed URL for any submission.

All download access goes through a route handler that validates the above.

---

## 4. Service Layer

New file: `src/server/services/homework-submissions.ts`

Or add functions to existing `src/server/services/homework.ts` (preferred — co-located with homework domain).

### 4.1 `submitHomework(params)`

```
Input: { homeworkId, fileAssetId?, description? }
Auth: Student with active enrolment in homework's batch
Guards:
  - Homework must be PUBLISHED
  - Homework must not be archived
  - Student must have active enrolment in homework's batch
  - No duplicate submission (unique constraint handles this at DB level)
  - fileAssetId (if provided) must reference an ACTIVE asset with usageCategory = HOMEWORK_SUBMISSION
  - fileAssetId targetBatchId must match homework batchId
Output: ServiceResult<HomeworkSubmission>
```

### 4.2 `listHomeworkSubmissions(homeworkId)`

```
Input: homeworkId
Auth: Teacher with HOMEWORK_MANAGE on homework's batch, or Admin
Output: ServiceResult<{ items: SubmissionWithStudent[] }>
```

### 4.3 `listMySubmissions(appUserId)`

```
Input: appUserId
Auth: Student (derive from appUser)
Output: ServiceResult<{ items: SubmissionWithHomework[] }>
```

### 4.4 `returnSubmission(submissionId, remarks?)`

```
Input: submissionId, remarks?
Auth: Teacher with HOMEWORK_MANAGE on submission's homework batch, or Admin
Guards:
  - Submission must be in SUBMITTED state
  - Cannot return an already-returned submission (consistent with "archived is terminal" pattern)
Output: ServiceResult<HomeworkSubmission>
```

### 4.5 `getSubmissionDownloadUrl(submissionId)`

```
Input: submissionId
Auth: Student (own submission), Teacher (batch), Admin
Output: ServiceResult<{ url: string }>
```

---

## 5. Upload Integration

### 5.1 Upload Intent Route

Add `HOMEWORK_SUBMISSION` handling to `src/app/api/upload/intent/route.ts`:

- `usageCategory` must be `HOMEWORK_SUBMISSION`
- `uploadScope` must be `BATCH`
- `targetBatchId` is required
- Student must have active enrolment in `targetBatchId`
- Student uploads go through the existing upload pattern

### 5.2 Upload Component

New component: `src/components/upload/HomeworkSubmissionUpload.tsx`

Follows same pattern as `HomeworkUpload.tsx` / `TestUpload.tsx` — single file, progress indicator, file validation.

### 5.3 Attachment Compatibility Rule

Similar to homework's rule for teacher uploads:

> Only an `ACTIVE` asset with `usageCategory = HOMEWORK_SUBMISSION` and exact matching `targetBatchId` may be attached to a submission.

---

## 6. Student UI

### 6.1 Existing: `StudentHomeworkList` (`src/features/homework/components/StudentHomeworkList.tsx`)

Currently renders a read-only list of published homework with:
- Title, description, due date
- Download link for teacher attachment
- Overdue indicator

### 6.2 Changes

Add per-homework submission state:

1. **Not submitted yet**: Show "Submit" button (if homework is not overdue and is PUBLISHED).
2. **Submitted**: Show "Submitted on [date]" badge with download link.
3. **Returned**: Show "Returned on [date]" badge with teacher remarks.

### 6.3 Submission Dialog

New dialog: `HomeworkSubmitDialog.tsx`

- File upload area (drag-and-drop or tap to select)
- Optional description text field
- Submit button
- Success/error feedback
- Must handle:
  - Loading state (uploading)
  - Error state (upload failed, duplicate, validation)
  - Success state (submitted, redirect or show status)

### 6.4 Student Dashboard

Add "Pending Submissions" widget showing homework that is PUBLISHED, not overdue, and not yet submitted.

Add "Recent Submissions" widget showing recently submitted homework with status.

---

## 7. Teacher UI

### 7.1 Existing: `TeacherHomeworkList` (`src/features/homework/components/TeacherHomeworkList.tsx`)

Currently shows homework CRUD per batch.

### 7.2 Changes

Add per-homework "Submissions" action:

1. Badge showing submission count.
2. "View Submissions" button opens a submission list dialog or page.

### 7.3 Submissions Dialog

New component: `HomeworkSubmissionsDialog.tsx`

- List of students who submitted:
  - Student name
  - Submitted at
  - File download link
  - Status (SUBMITTED / RETURNED)
  - Return button (with optional remarks field)
- Students assigned to the batch who have NOT submitted:
  - Student name
  - "Not submitted" indicator
  - No action needed (informational)

### 7.4 Return Flow

Click "Return" → modal with:
- Student name + submission info
- Optional remarks textarea (max 2000 chars, same as description)
- Confirm button → marks as RETURNED, sets returnedAt

---

## 8. Admin UI

### 8.1 Admin Homework List

Admin homework list (`src/app/admin/homework/page.tsx`) currently shows all homework.

Add "Submissions" column with count and "View" button per row.

### 8.2 Batch-Scoped View

Admin can view submissions for any homework (admin superset) using the same `HomeworkSubmissionsDialog` component.

---

## 9. Download Route

New: `src/app/api/homework-submissions/[submissionId]/download/route.ts`

Follow the same pattern as `src/app/api/homework/[homeworkId]/download/route.ts` and `src/app/api/tests/[testId]/download/route.ts`.

Pattern:
1. Auth check.
2. Permission check (own submission, batch access, or admin).
3. Load submission + file asset.
4. Call `getDownloadUrl(fileAssetId)`.
5. Return signed URL or redirect.

---

## 10. Migration

### Step 1: Schema Update

```sh
npx prisma migrate dev --name add_homework_submissions --create-only
```

### Step 2: Edit Migration SQL

Add `ALTER TYPE "FileUploadUsageCategory" ADD VALUE 'HOMEWORK_SUBMISSION';` before the CREATE TABLE statement.

### Step 3: Apply

```sh
npx prisma migrate dev
```

### Step 4: Regenerate Client

```sh
npx prisma generate
```

---

## 11. Verification Matrix

### 11.1 Backend Integration Tests

New file: `src/server/services/homework-submissions.integration.test.ts`

| # | Test | Expected |
|---|------|----------|
| 1 | Student submits to published homework | Success, record created |
| 2 | Student submits to DRAFT homework | Rejected |
| 3 | Student submits to ARCHIVED homework | Rejected |
| 4 | Student not enrolled in batch | Rejected (UNAUTHORIZED) |
| 5 | Duplicate submission by same student for same homework | Rejected (unique constraint) |
| 6 | Student submits with file asset | Success, fileAssetId stored |
| 7 | Student submits with invalid file asset (wrong usageCategory) | Rejected |
| 8 | Student submits with invalid file asset (wrong targetBatch) | Rejected |
| 9 | Student submits with ABANDONED file asset | Rejected |
| 10 | Teacher lists submissions for their batch | Returns all submissions |
| 11 | Teacher without HOMEWORK_MANAGE lists submissions | Rejected (FORBIDDEN) |
| 12 | Admin lists submissions for any homework | Returns all submissions |
| 13 | Student lists own submissions | Returns only own submissions |
| 14 | Teacher returns a submission | lifecycleState → RETURNED, returnedAt set |
| 15 | Teacher returns already-returned submission | Rejected (ALREADY_RETURNED) |
| 16 | Student downloads own submission file | Signed URL returned |
| 17 | Student downloads another student's submission | Rejected |
| 18 | Teacher downloads submission in their batch | Signed URL |
| 19 | Teacher downloads submission in another batch | Rejected |
| 20 | Student submits to overdue homework | Allowed (scope decision: no late flag) |
| 21 | Auth: unauthenticated user | Rejected (redirect) |
| 22 | Auth: TEACHER role with student path | Rejected |

### 11.2 UI Tests

New file: `src/features/homework/components/HomeworkSubmission.test.tsx`

| # | Test | Expected |
|---|------|----------|
| 1 | Student sees "Submit" button for unsubmitted published homework | Button rendered |
| 2 | Student sees "Submitted" badge after successful submission | Badge with date |
| 3 | Student does not see submit button for DRAFT homework | No button |
| 4 | Student does not see submit button for ARCHIVED homework | No button |
| 5 | Student does not see submit button for homework in unenrolled batch | No button |
| 6 | Submission dialog shows upload area and submit button | Dialog rendered |
| 7 | Submission dialog shows validation errors | Error displayed |
| 8 | Submission dialog preserves values after validation failure | Values preserved |
| 9 | Teacher sees "View Submissions" for homework in their batch | Button rendered |
| 10 | Teacher sees submission list with student name + file | List rendered |
| 11 | Teacher sees "Not submitted" students in batch | Students listed |
| 12 | Teacher return flow: remarks field + confirm | Submission returned |
| 13 | Empty state: no submissions for a homework | Empty state rendered |
| 14 | Loading state during file upload | Loading indicator |
| 15 | Error state: upload fails | Error message displayed |
| 16 | No identity/authorization claims in client-side HTML | No hidden fields |

### 11.3 Validation Gate

- `npm run lint` — 0 errors
- `npm run typecheck` — 0 errors
- `npm run build` — 0 errors
- Integration tests pass
- UI tests pass
- Mobile viewport check at 390px:
  - Submission dialog fits without overflow
  - Teacher submission list readable on mobile
  - Download links thumb-accessible

---

## 12. File Changes Summary

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add `HomeworkSubmissionLifecycleState` enum, `HomeworkSubmission` model, `HOMEWORK_SUBMISSION` to `FileUploadUsageCategory`, relations on `Homework` and `FileAsset` |
| `prisma/migrations/...add_homework_submissions/` | New migration |
| `src/server/services/homework.ts` | Add `submitHomework`, `listHomeworkSubmissions`, `listMySubmissions`, `returnSubmission`, `getSubmissionDownloadUrl` (or new file) |
| `src/server/services/homework-submissions.integration.test.ts` | New: 22+ integration tests |
| `src/app/api/upload/intent/route.ts` | Add `HOMEWORK_SUBMISSION` case |
| `src/components/upload/HomeworkSubmissionUpload.tsx` | New: submission upload component |
| `src/features/homework/components/StudentHomeworkList.tsx` | Add submission state, "Submit" button, "Submitted" badge |
| `src/features/homework/components/HomeworkSubmitDialog.tsx` | New: submission dialog |
| `src/features/homework/components/TeacherHomeworkList.tsx` | Add "Submissions" column/action |
| `src/features/homework/components/HomeworkSubmissionsDialog.tsx` | New: teacher/admin submission list dialog |
| `src/features/homework/components/HomeworkSubmission.test.tsx` | New: 16+ UI tests |
| `src/app/api/homework-submissions/[submissionId]/download/route.ts` | New: download route |
| `src/app/student/homework/page.tsx` | Minor: pass enrolment info |
| `src/app/teacher/batches/[batchId]/page.tsx` | Minor: pass homework data with submission context |
| `src/app/admin/homework/page.tsx` | Minor: add submissions column |

---

## 13. Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Adding enum value to in-use Postgres enum | Safe with `ALTER TYPE ... ADD VALUE` (append-only, no table rewrite) |
| Student uploads large files causing storage cost | FileAsset already has `sizeBytes`; enforce max size in upload validation (e.g. 10MB) |
| Student submits multiple files per homework | Single file per submission in v1; unique constraint prevents duplicate rows; `fileAssetId` is nullable (student could submit without file, though unlikely) |
| Teacher returns submission, student expects resubmission | Explicitly deferred; lifecycle ends at RETURNED for v1 |
| Submission file access leaks between students | Download route enforces ownership/batch-scope; signed URLs are time-limited |
| Migration order: enum value must exist before table references it | `ALTER TYPE` before `CREATE TABLE` in migration SQL |
| Prisma enum → Postgres enum mismatch | Verify migration SQL; `prisma migrate dev` handles ENUM creation but not `ALTER TYPE ... ADD VALUE` for existing enums automatically |

---

## 14. Implementation Order

1. Schema changes (enum + model + migration)
2. Update upload intent route for `HOMEWORK_SUBMISSION`
3. Homework submission upload component
4. Service functions
5. Integration tests for service
6. Download route
7. Student UI (submit dialog + status display)
8. Teacher UI (submissions list + return action)
9. Admin UI (submissions view)
10. UI tests
11. Validation gate (lint, typecheck, build, tests, mobile review)
