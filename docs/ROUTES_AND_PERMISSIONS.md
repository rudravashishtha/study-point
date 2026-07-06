# Routes And Permissions

Phase: 0 research and planning.
Status: Draft for human review.
Last reviewed: 2026-07-07.

## Permission Principles

- All protected operations must enforce permissions on the server.
- UI visibility is convenience, not authorization.
- Never trust client-supplied role, curriculum, or ownership data.
- Validate input with shared schemas before mutations.
- Check archived and published state where relevant.
- Check academic session, curriculum track, batch, and student ownership scope.
- Use URL search parameters for list filters where appropriate.
- Do not use class level alone for authorization or filtering when curriculum scope matters.

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

| Route            | Access | Notes                                                                                                                                                                                                     |
| ---------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`              | Public | Home page with institute identity, teacher intro, methodology highlights, selected results/testimonials, public batch highlights, configurable fee highlights, FAQ highlights, contact, and WhatsApp CTA. |
| `/courses`       | Public | CBSE and CISCE course information grouped by board, programme where relevant, class level, and subject.                                                                                                   |
| `/resources`     | Public | Published public resources only; no email capture.                                                                                                                                                        |
| `/announcements` | Public | Public announcements only.                                                                                                                                                                                |
| `/contact`       | Public | Contact, map, WhatsApp, directions, address, landmark, and opening hours.                                                                                                                                 |

Optional content such as methodology, results, testimonials, gallery, batch timings, fee information, and FAQ can be sections on the home or courses pages. Dedicated routes can be added later only if content volume justifies them.

Public routes must not expose private batch live links, unpublished content, private files, internal IDs where avoidable, or admin-only metadata. Public fee display is configurable per course or batch.

## Auth Routes

| Route              | Access                                         | Notes                                           |
| ------------------ | ---------------------------------------------- | ----------------------------------------------- |
| `/login`           | Anonymous only or redirect authenticated users | Supabase email/password or supported auth flow. |
| `/forgot-password` | Anonymous                                      | Password reset request.                         |
| `/reset-password`  | Token/session dependent                        | Password update flow.                           |
| `/logout`          | Authenticated                                  | Server-side logout.                             |
| `/auth/callback`   | Supabase callback                              | Must validate safe redirect targets.            |

There is no public student registration route. Student account activation uses a secure Supabase invitation flow initiated by admin.

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
| `/admin/batches`                   | `ADMIN`         | Batch list with curriculum/session filters and archive state.                                                       |
| `/admin/batches/new`               | `ADMIN`         | Create batch for one academic session and curriculum track.                                                         |
| `/admin/batches/[batchId]`         | `ADMIN`         | Details, students, schedule, public visibility, fee visibility.                                                     |
| `/admin/timetable`                 | `ADMIN`         | Batch schedule management.                                                                                          |
| `/admin/materials`                 | `ADMIN`         | Study material list filtered by session, curriculum, chapter, topic, publication, archive state.                    |
| `/admin/materials/new`             | `ADMIN`         | Upload/create material.                                                                                             |
| `/admin/homework`                  | `ADMIN`         | Homework list filtered by session, curriculum, batch, chapter, topic.                                               |
| `/admin/homework/new`              | `ADMIN`         | Create homework.                                                                                                    |
| `/admin/tests`                     | `ADMIN`         | Test list filtered by session, curriculum, batch, chapter, topic.                                                   |
| `/admin/tests/new`                 | `ADMIN`         | Create test.                                                                                                        |
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

## Teacher Routes

Teacher portal is deferred. The `TEACHER` role remains in schema and permission helpers for future use, but no teacher-facing routes should be implemented until explicitly approved.

## Student Routes

All student routes require authenticated `STUDENT` role, linked active student profile, and an active enrolment. Historical session views are deferred as read-only later work.

| Route                    | Access  | Scope Checks                                                                                                |
| ------------------------ | ------- | ----------------------------------------------------------------------------------------------------------- |
| `/student`               | Student | Linked student, active account, active enrolment, current academic session.                                 |
| `/student/course`        | Student | Own active enrolment, curriculum track, and batch.                                                          |
| `/student/timetable`     | Student | Own batch schedules only.                                                                                   |
| `/student/materials`     | Student | Published material matching own session and curriculum track; batch-restricted material requires own batch. |
| `/student/homework`      | Student | Published homework for own session, curriculum track, and batch.                                            |
| `/student/tests`         | Student | Published tests for own session, curriculum track, and batch where restricted.                              |
| `/student/fees`          | Student | Own enrolment fee assignment, dues, payments, and allocations only.                                         |
| `/student/announcements` | Student | Public/all/curriculum/batch announcements matching own active enrolment.                                    |

Students cannot edit fee records, materials, homework, tests, timetable, profile role, or enrolment.

## Route Handlers And APIs

Use route handlers for HTTP-oriented operations:

| Route                            | Method | Access             | Purpose                                                                                 |
| -------------------------------- | ------ | ------------------ | --------------------------------------------------------------------------------------- |
| `/api/storage/upload`            | `POST` | Admin              | Validated uploads where route handler is clearer than Server Action.                    |
| `/api/storage/[fileId]/download` | `GET`  | Authorized user    | Verify file ownership, curriculum/session/batch scope, and return signed URL or stream. |
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
- Write audit logs for important actions.

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
