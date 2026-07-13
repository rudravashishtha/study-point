# Routes And Permissions

Phase: 0 research and planning.
Status: Draft for human review.
Last reviewed: 2026-07-13.

## Permission Principles

- All protected operations must enforce permissions on the server.
- UI visibility is convenience, not authorization.
- Never trust client-supplied role, curriculum, or ownership data.
- Validate input with shared schemas before mutations.
- Check archived and published state where relevant.
- Check academic session, curriculum track, batch, and student ownership scope.
- Use URL search parameters for list filters where appropriate.
- Do not use class level alone for authorization or filtering when curriculum scope matters.

### Teacher & Admin Architecture

1. **Admin is global superuser**: The `ADMIN` role retains full operational control across the entire system.
2. **Teacher access is Batch-scoped**: Contextual permissions are derived explicitly from active Batch assignments.
3. **Multiple Teachers may belong to one Batch**: There is no limit to the number of Teachers assigned to a Batch.
4. **One Teacher may have different permissions across Batches**: Permissions are scoped strictly to individual `TeacherAssignment` records.
5. **Batch page is the canonical assignment mutation location**: Assignments and permissions are managed exclusively from the Batch detail UI.
6. **Teacher detail page is read-only for assignments**: Provides global visibility into a Teacher's cross-batch operations without mutation controls.
7. **Permission presets are UI-only**: Presets map to explicit permission arrays and are not stored dynamically.
8. **Stored permissions are explicit**: A `TeacherAssignment` record stores a discrete `PermissionCapability[]`.
9. **Effective permissions are runtime-derived**: Implied permissions (e.g., `BATCH_MANAGE` implying `BATCH_VIEW`) are strictly computed in-memory at evaluation boundaries.
10. **Teacher account provisioning remains separate**: The `TEACHER` auth role enables login capability; authorization is independently defined by assignments.

- **Teachers are Batch-scoped**. The `TEACHER` role alone grants no automatic access to any Batch.
- **Batches may have multiple Teachers** assigned simultaneously.
- **Teachers may have different permissions per Batch**. A Teacher can have `BATCH_MANAGE` in one Batch and only `BATCH_VIEW` in another.
- **TeacherAssignment preserves assignment history**. Re-assigning or changing permissions does not mutate the historical record in a destructive way if archived.
- **Stored permissions are explicit Admin selections**.
- **Effective permissions are centrally derived**. Implied permissions (like `BATCH_MANAGE` → `BATCH_VIEW`) are resolved at runtime and never persisted to the database.
- **Account provisioning is separate** from Teacher profiles and assignments. A Teacher profile can exist and be assigned to Batches before a Supabase authentication account is created.
- **Teacher.active controls profile availability**.
- **TeacherAssignment.archivedAt controls assignment lifecycle**.

## Route Groups

Recommended App Router route groups:

```text
/
/(public)
/(auth)
/admin
/student
/api
```

## Public Routes

Keep public navigation compact. Structured content models can render as sections or anchors without requiring every section to be a top-level route.

| Route                                 | Access | Notes                                                                                                                                                                                                     |
| ------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                   | Public | Home page with institute identity, teacher intro, methodology highlights, selected results/testimonials, public batch highlights, configurable fee highlights, FAQ highlights, contact, and WhatsApp CTA. |
| `/courses`                            | Public | CBSE and CISCE course information grouped by board, programme where relevant, class level, and subject.                                                                                                   |
| `/resources`                          | Public | Published public resources only; no email capture.                                                                                                                                                        |
| `/api/public/materials/[id]/download` | Public | Unauthenticated file download for published `CURRICULUM_TRACK` study materials only. Returns 404 for batch-restricted, unpublished, archived, or missing assets. Never serves private files.              |
| `/announcements`                      | Public | Public announcements only.                                                                                                                                                                                |
| `/contact`                            | Public | Contact, map, WhatsApp, directions, address, landmark, and opening hours.                                                                                                                                 |

Optional content such as methodology, results, testimonials, gallery, batch timings, fee information, and FAQ can be sections on the home or courses pages. Dedicated routes can be added later only if content volume justifies them.

Public routes must not expose private batch live links, unpublished content, private files, internal IDs where avoidable, or admin-only metadata. Public fee display is configurable per course or batch.

## Auth Routes

Implemented across Phase 10A (commit 8e1669d) and Phase 10B (account activation, invitation flow, forgot/reset password, password strength, rate limiting, INVITED gate).

| Route              | Access                                         | Notes                                                                                      | Status          |
| ------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------- |
| `/login`           | Anonymous; authenticated users redirected away | Supabase email/password login entry.                                                       | Implemented 10A |
| `/login/[role]`    | Anonymous; `role` ∈ {student,teacher,admin}    | Themed login; invalid role falls back to default-themed login (no redirect).               | Implemented 10A |
| `/unauthorized`    | Any                                            | Access denied / no-permission status page.                                                 | Implemented 10A |
| `/session-expired` | Any                                            | Session expired / invalid-token status page.                                               | Implemented 10A |
| `/teacher`         | `TEACHER` (`requireRole`)                      | Placeholder "coming soon" page; teacher authentication is fully functional.                | Implemented 10A |
| `/logout`          | Authenticated                                  | Server Action `signOut` (clears cookies, redirects `/login`); not a standalone route.      | Implemented 10A |
| `/forgot-password` | Anonymous                                      | Password reset request; returns a generic response to avoid email enumeration.             | Implemented 10B |
| `/reset-password`  | Invite/recovery session                        | Unified set-password (invite) and reset-password (recovery); reached via `/auth/callback`. | Implemented 10B |
| `/auth/callback`   | Supabase callback                              | PKCE code exchange for invite/recovery (and future OAuth); validates safe `next`.          | Implemented 10B |

There is no public student registration route. Student account activation uses a secure Supabase invitation flow initiated by admin (implemented in Phase 10B).

### Authentication Proxy (`src/proxy.ts`)

Next.js 16 uses `src/proxy.ts` (function exported as `proxy`) as the Middleware/proxy file — **not** `middleware.ts`. It is confirmed executing (production build output shows `ƒ Proxy`).

Responsibilities (edge-safe, no database, no authorization):

- Refresh the Supabase session via `supabase.auth.getUser()` and rotate auth cookies.
- Redirect authenticated users away from `/login*` and `/forgot-password`.
- Coarse role-aware **optimistic routing** only, reading the verified JWT `app_metadata.role` claim:
  - `/admin` → requires `ADMIN`, else `/login` (or `/session-expired` if a stale auth cookie is present).
  - `/student` → requires `STUDENT`.
  - `/teacher` → requires `TEACHER`.
  - Wrong role redirects to the user's own portal root.
- API routes are refreshed only and never redirected.

Authorization stays server-side: every protected page calls `getAppUser` / `requireRole` / `requireAdmin`, and every server action resolves the database `AppUser.role`. The JWT role claim is treated as a routing cache only and is synced best-effort at sign-in; a stale claim can at most mis-route, never escalate privilege.

## Admin Routes

All admin routes require authenticated `ADMIN` role.

| Route                              | Main Permission | Notes                                                                                                               |
| ---------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------- |
| `/admin`                           | `ADMIN`         | Operational overview.                                                                                               |
| `/admin/curriculum`                | `ADMIN`         | Boards, programmes, subjects, curriculum tracks, chapters, topics.                                                  |
| `/admin/academic-sessions`         | `ADMIN`         | List, create, set active, historical sessions.                                                                      |
| `/admin/students`                  | `ADMIN`         | Search/filter by name, code, board, programme, class, subject, batch, session, account status, archive state.       |
| `/admin/students/new`              | `ADMIN`         | Manual student creation.                                                                                            |
| `/admin/students/[studentId]`      | `ADMIN`         | Profile, enrolments, account status, fees, audit.                                                                   |
| `/admin/students/[studentId]/edit` | `ADMIN`         | Edit permanent student fields.                                                                                      |
| `/admin/students/activate`         | `ADMIN`         | Batch account activation through Supabase invitations.                                                              |
| `/admin/enrolments`                | `ADMIN`         | Manage session and curriculum-specific enrolments.                                                                  |
| `/admin/teachers`                  | `ADMIN`         | Teacher profile list, creation, editing, and activation/deactivation.                                               |
| `/admin/teachers/[teacherId]`      | `ADMIN`         | Teacher profile details and read-only cross-batch assignment visibility.                                            |
| `/admin/batches`                   | `ADMIN`         | Batch list with curriculum/session filters and archive state.                                                       |
| `/admin/batches/new`               | `ADMIN`         | Create batch for one academic session and curriculum track.                                                         |
| `/admin/batches/[batchId]`         | `ADMIN`         | Details, students, schedule, teachers, public visibility, fee visibility. Assignment mutations are canonical here.  |
| `/admin/timetable`                 | `ADMIN`         | Batch schedule management.                                                                                          |
| `/admin/materials`                 | `ADMIN`         | Study material list filtered by session, curriculum, chapter, topic, publication, archive state.                    |
| `/admin/materials/new`             | `ADMIN`         | Upload/create material.                                                                                             |
| `/admin/tests`                     | `ADMIN`         | Test list filtered by session, curriculum, batch, chapter, topic.                                                   |
| `/admin/tests/new`                 | `ADMIN`         | Create test.                                                                                                        |
| `/admin/homework`                  | `ADMIN`         | Homework list filtered by session, curriculum, batch, chapter, topic. (Creation and editing handled via Dialogs).   |
| `/admin/questions`                 | `ADMIN`         | Question bank filtered by board, programme, class, subject, chapter, topic, type, difficulty, marks, archive state. |
| `/admin/questions/new`             | `ADMIN`         | Create question.                                                                                                    |
| `/admin/fees`                      | `ADMIN`         | Fee overview and dues filtered by student, session, curriculum, batch, due status.                                  |
| `/admin/fees/plans`                | `ADMIN`         | Fee plans and instalments.                                                                                          |
| `/admin/fees/dues`                 | `ADMIN`         | Student fee due preview, confirmation, and management.                                                              |
| `/admin/fees/payments/new`         | `ADMIN`         | Record payment and allocations.                                                                                     |
| `/admin/announcements`             | `ADMIN`         | Announcement management by public/all/curriculum/batch audience.                                                    |
| `/admin/website`                   | `ADMIN`         | Structured content dashboard.                                                                                       |
| `/admin/website/home`              | `ADMIN`         | Homepage content sections.                                                                                          |
| `/admin/website/teacher`           | `ADMIN`         | Teacher public profile.                                                                                             |
| `/admin/website/courses`           | `ADMIN`         | Curriculum-scoped course content and fee display settings.                                                          |
| `/admin/website/results`           | `ADMIN`         | Results with consent tracking.                                                                                      |
| `/admin/website/testimonials`      | `ADMIN`         | Testimonials with consent tracking.                                                                                 |
| `/admin/website/gallery`           | `ADMIN`         | Gallery with consent tracking when identifiable people appear.                                                      |
| `/admin/website/resources`         | `ADMIN`         | Public resources.                                                                                                   |
| `/admin/website/faq`               | `ADMIN`         | FAQs.                                                                                                               |
| `/admin/website/contact`           | `ADMIN`         | Contact, map, WhatsApp.                                                                                             |
| `/admin/imports`                   | `ADMIN`         | Import history.                                                                                                     |
| `/admin/imports/students`          | `ADMIN`         | Student import workflow.                                                                                            |
| `/admin/imports/questions`         | `ADMIN`         | Question import workflow with mandatory curriculum columns.                                                         |
| `/admin/audit`                     | `ADMIN`         | Audit activity.                                                                                                     |
| `/admin/settings`                  | `ADMIN`         | Application settings.                                                                                               |

Admin routes should preserve filters in URL search parameters for shareable, refresh-safe listing state.

## Teacher Authorization Model (Planned)

Admin

- Institute-wide administrative authority.

Teacher

- No implicit Batch access from role alone.
- Must have an active Teacher profile.
- Must have an assignment to the target Batch.
- Must hold the required permission for the requested operation.

Authorization must be enforced server-side for every protected query and mutation. UI visibility is not an authorization boundary.

The future authorization path should be documented as:
Authenticated User
→ Teacher Profile
→ Teacher-Batch Assignment
→ Required Permission
→ Allow / Reject

### Initial Permission Taxonomy

Batch viewing
Batch management
Student/member viewing
Attendance viewing
Attendance management
Curriculum progress viewing
Curriculum progress management
Assignments viewing
Assignments management
Tests viewing
Tests management
Results viewing
Results management

Rule: `CURRICULUM_PROGRESS_MANAGE ≠ CURRICULUM_STRUCTURE_MANAGE`
Teachers should normally update what has been taught in their assigned Batch. They should not automatically gain permission to rename, reorder, create, or archive the institute's canonical Chapters and Topics.

## Teacher Routes

Teacher portal is deferred. The `TEACHER` role remains in schema and permission helpers for future use, but no teacher-facing routes should be implemented until explicitly approved.

## Student Routes

All student routes require authenticated `STUDENT` role, linked active student profile, and an active enrolment. Historical session views are deferred as read-only later work.

| Route                    | Access  | Scope Checks                                                                                                                   |
| ------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `/student`               | Student | Linked student, active account, active enrolment, current academic session.                                                    |
| `/student/course`        | Student | Own active enrolment, curriculum track, and batch.                                                                             |
| `/student/timetable`     | Student | Own batch schedules only.                                                                                                      |
| `/student/materials`     | Student | Published material matching own session and curriculum track; batch-restricted material requires own batch.                    |
| `/student/homework`      | Student | Published homework for own active enrolment batches. Overdue homework remains visible as overdue. Archived homework is hidden. |
| `/student/tests`         | Student | Published tests for own session, curriculum track, and batch where restricted.                                                 |
| `/student/fees`          | Student | Own enrolment fee assignment, dues, payments, and allocations only.                                                            |
| `/student/announcements` | Student | Public/all/curriculum/batch announcements matching own active enrolment.                                                       |

**Exact Student Query Constraints:**

- Materials are deduplicated naturally via `OR` query logic without joining/`distinct`: `WHERE { OR: [ { visibility: BATCH, batchId: in: eligibleBatchIds }, { visibility: CURRICULUM_TRACK, OR: [eligible session+track pairs] } ] }`.
- **Failure States**:
  - `AppUser.studentId == null` → Redirect to `/unauthorized`.
  - Linked `Student` row missing → Redirect to `/unauthorized`.
  - Zero eligible enrolments (`active`, `archivedAt = null`) → Render EmptyState indicating no active courses.

**Batch Lifecycle Matrix:**

- **Archived Batch**: Admin/Teacher material management is read-only. Students cannot read `BATCH`-scoped materials from it.
- **Inactive but non-archived Batch**: Admin/Teacher management remains allowed. Students may read eligible published `BATCH`-scoped materials.
- **CURRICULUM_TRACK Material**: Unaffected by unrelated Batch lifecycle.

Students cannot edit fee records, materials, homework, tests, timetable, profile role, or enrolment.

## Route Handlers And APIs

Use route handlers for HTTP-oriented operations:

| Route                            | Method | Access             | Purpose                                                                                 |
| -------------------------------- | ------ | ------------------ | --------------------------------------------------------------------------------------- |
| `/api/storage/upload`            | `POST` | Admin              | Validated uploads where route handler is clearer than Server Action.                    |
| `/api/storage/intent`            | `POST` | Authorized user    | Creates upload reservation/intent, returning a signed upload URL.                       |
| `/api/storage/finalize`          | `POST` | Authorized user    | Finalizes intent by verifying existence and `Content-Length` via `HEAD` on signed URL.  |
| `/api/storage/[fileId]/download` | `GET`  | Authorized user    | Verify file ownership, curriculum/session/batch scope, and return signed URL or stream. |
| `/api/homework/[id]/download`    | `GET`  | Authorized user    | Verify Homework Batch access, then return signed URL for the attached asset.            |
| `/api/imports/[type]/template`   | `GET`  | Admin              | Download import template.                                                               |
| `/api/imports/[jobId]/upload`    | `POST` | Admin              | Upload source file with 30-day retention.                                               |
| `/api/imports/[jobId]/validate`  | `POST` | Admin              | Parse and validate without importing.                                                   |
| `/api/imports/[jobId]/confirm`   | `POST` | Admin              | Confirm import.                                                                         |
| `/api/imports/[jobId]/errors`    | `GET`  | Admin              | Download error report.                                                                  |
| `/api/auth/callback`             | `GET`  | Supabase callback  | Handle auth callback if route-based callback is used.                                   |
| `/api/health`                    | `GET`  | Public or internal | Minimal health check without secrets.                                                   |

Do not expose broad CRUD APIs unless the UI needs them. Prefer Server Components and Server Actions for app-native flows.

## Server Actions

Good Server Action candidates:

- Create/edit curriculum records.
- Create/edit academic session.
- Set active academic session.
- Create/edit/archive/restore student.
- Create/edit enrolment.
- Create/edit/archive/restore batch.
- Create/edit schedule rows.
- Publish/unpublish/archive content.
- Create fee plans, instalments, assignments, and dues.
- Preview and confirm generated fee dues.
- Record payments and allocations.
- Create/edit announcements.
- Save structured website content.

Server Actions must:

- Read session server-side.
- Resolve `AppUser`.
- Check permission, ownership, and curriculum scope.
- Validate input with Zod.
- Return safe errors.
- Write audit logs for important actions (e.g. `StudyMaterial` CREATE/UPDATE/PUBLISH/ARCHIVE, `FileAsset` intent/finalized/abandoned).

## Permission Matrix

| Capability                      | Public                | Student | Teacher                    | Admin                              |
| ------------------------------- | --------------------- | ------- | -------------------------- | ---------------------------------- |
| View public website             | Yes                   | Yes     | Yes                        | Yes                                |
| Manage website content          | No                    | No      | No                         | Yes                                |
| View own student dashboard      | No                    | Yes     | No                         | Admin can inspect via admin routes |
| View another student's data     | No                    | No      | No                         | Yes                                |
| Manage curriculum               | No                    | No      | No                         | Yes                                |
| Manage students and enrolments  | No                    | No      | No                         | Yes                                |
| Activate accounts               | No                    | No      | No                         | Yes                                |
| Manage academic sessions        | No                    | No      | No                         | Yes                                |
| Manage batches                  | No                    | No      | No teacher route initially | Yes                                |
| View own timetable              | No                    | Yes     | No teacher route initially | Yes                                |
| Manage study materials          | No                    | No      | No teacher route initially | Yes                                |
| View authorized study materials | Public resources only | Yes     | No teacher route initially | Yes                                |
| Manage homework/tests/questions | No                    | No      | No teacher route initially | Yes                                |
| View own fees                   | No                    | Yes     | No                         | Yes                                |
| Record payments and allocations | No                    | No      | No                         | Yes                                |
| Run imports                     | No                    | No      | No                         | Yes                                |
| View audit log                  | No                    | No      | No                         | Yes                                |
| Impersonate student             | No                    | No      | No                         | No                                 |

## File Access Rules

Public files:

- Public website assets.
- Published public resources.
- Gallery images where consent and publication state allow display.

Restricted files:

- Private study materials.
- Homework attachments.
- Test question papers.
- Question images if not public.
- Import source files and error reports.

Restricted files should be served through a route handler that checks authorization before generating a short-lived signed URL or streaming the file. Archived files are retained. Temporary import source files are retained for 30 days.
Uploads must enforce a strict `intent -> signed URL -> finalization` flow. Byte-sniffing is out of scope; finalization verifies object existence and size using a standard HTTP `HEAD` request on a server-generated signed URL.

## Import Permission Rules

Student imports:

- Admin only.
- Must not activate accounts automatically.
- Must validate curriculum track and batch references where provided.

Question imports:

- Admin only.
- Must require board, programme where required, class level, subject, chapter, and question fields.
- Must reject ambiguous curriculum values.
- Must not infer CISCE programme silently from class.

## Safe Redirect Rules

Auth and callback routes must allow redirects only to same-origin relative paths or an approved application URL. Never redirect to arbitrary user-provided absolute URLs.

## Rate Limiting Candidates

Add rate limiting when implementation reaches these endpoints:

- Login and password reset routes if not sufficiently handled by Supabase protections.
- Public contact or future enquiry endpoints.
- Import upload endpoints.
- File download endpoints if abuse risk appears.

## Resolved Permission Decisions

- Teacher portal is deferred.
- Teacher role remains schema and permission support only.
- Public fees are configurable per course or batch.
- Students get active session first; historical read-only views are later work.
- Admin impersonation is not allowed.
- Free public resources do not capture email.
- Temporary import source files are retained for 30 days.
- Fee dues are generated through admin-reviewed preview and confirmation.
- CBSE Secondary and Senior Secondary are display groupings only, not database programmes.
- Student IDs are application-generated, human-readable identifiers with isolated generation logic.
