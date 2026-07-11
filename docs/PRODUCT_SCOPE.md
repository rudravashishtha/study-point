# Product Scope

Phase: 0 research and planning.
Status: Draft for human review.
Last reviewed: 2026-07-11.

## Product Goal

Build one production-grade digital platform for a small mathematics coaching institute serving Classes IX, X, XI, and XII for both CBSE and CISCE curricula.

For CISCE, Classes IX and X belong to the ICSE programme, and Classes XI and XII belong to the ISC programme. CBSE and CISCE are not interchangeable curriculum labels and must be represented in the product, data model, filters, imports, and permissions.

The product includes a public website, student portal, admin dashboard, academic operations, study content, question bank, fee tracking, imports, structured website content management, and PWA support. The primary administrator may frequently work from a phone, so mobile usability is a core requirement.

## Curriculum Scope

The application must model curriculum with this hierarchy:

```text
Board -> Programme where relevant -> Class level -> Subject -> Chapter -> Topic
```

Initial values:

- Board: CBSE.
- Board: CISCE.
- CISCE programmes: ICSE for Classes IX and X; ISC for Classes XI and XII.
- Class levels: IX, X, XI, XII.
- Subject: Mathematics.

Subject must remain a proper entity even though the institute currently teaches only Mathematics. This keeps chapters, topics, question bank records, materials, tests, batches, fees, and public course content scoped cleanly and leaves room for future subjects without rebuilding the academic model.

CBSE, ICSE, and ISC must not be modelled as three unrelated boards. ICSE and ISC are programmes under the CISCE board.

## Primary User Groups

### Public visitors

Students and parents evaluating admission should be able to understand the institute, teacher, CBSE/CISCE course offerings, methodology, results, configurable fee information, batch timings, resources, and contact options.

### Admin

The admin manages academic sessions, curriculum-scoped students and enrolments, batches, timetables, study content, homework, tests, question bank, fees, announcements, public website content, imports, account activation, archive/restore, audit activity, and settings.

### Teacher

The system supports separate Teacher accounts with access controlled per Batch and per capability. Teachers will have access to operational workflows for their assigned batches, including Attendance, Curriculum Progress, Assignments, Tests, and Results.

### Student

Students access only authorized data related to their active enrolment first, including dashboard, batch, timetable, study materials, homework, tests, fees, announcements, and live class links. Historical sessions can be added later as read-only student views. There is no parent portal.

## In Scope

- Public website with structured content, not a generic page builder.
- Student portal with current academic information and fee visibility.
- Admin dashboard optimized for phone and desktop.
- Student records separate from authentication accounts.
- Academic sessions and historical enrolments.
- Curriculum hierarchy for board, programme, class level, subject, chapter, and topic.
- Batches, schedules, capacity, active state, public visibility, and archive/restore.
- Study materials, homework, tests, question bank, and secure file handling with curriculum scope.
- Reusable bulk import workflow for students and questions.
- Normalized fee plans, instalments, dues, payments, allocations, pending fee calculation, and printable receipts.
- Public and student announcements.
- Structured website content management.
- PWA installability with conservative caching.
- Audit log for important administrative actions.

## Out of Scope Initially

- Parent portal.
- Native mobile app.
- Custom video conferencing.
- Full accounting software.
- Full CRM or enquiry pipeline.
- Free resource email capture.
- Individual chat or messaging.
- Online payment gateway.
- Automatic WhatsApp or SMS reminders.
- Complex analytics or AI reports.
- Full online examination platform.
- Generic CMS or page builder.
- Multi-branch management.
- Admin impersonation.
- One-click import rollback.
- Student homework submissions, though the model should leave room for them.

## Public Website Content

The public website should be smaller than the full content model. Structured content can power sections on a few routes instead of forcing every content area into a separate top-level page.

Recommended public route structure:

- `/`: Home, institute identity, teacher introduction, methodology highlights, selected results/testimonials, current batches, fee highlights where enabled, FAQ highlights, contact and WhatsApp CTA.
- `/courses`: CBSE and CISCE course information for Classes IX-XII, grouped by board/programme/class/subject.
- `/resources`: Published public resources.
- `/announcements`: Public announcements.
- `/contact`: Contact, map, directions, WhatsApp, address, landmark, and opening hours.

Optional content such as gallery, detailed results, testimonials, methodology, fee information, and FAQ can be rendered as sections or anchors from structured models. Dedicated routes can be added later only if content volume justifies them.

Sections with no published content, such as gallery or results, should be hidden gracefully.

## Admin Feature Scope

Every meaningful admin listing needs server-side search/filtering and URL search parameters where appropriate. Admin tables must have mobile alternatives such as stacked cards, compact summaries, and thumb-accessible actions.

Important admin modules:

- Overview.
- Curriculum.
- Students.
- Enrolments.
- Batches.
- Academic sessions.
- Timetable.
- Study materials.
- Homework.
- Tests.
- Question bank.
- Fees.
- Announcements.
- Website content.
- Gallery.
- Imports.
- Audit activity.
- Settings.

Student, batch, material, homework, test, question, fee, announcement, and import workflows must filter by curriculum scope: board, programme where relevant, class level, subject, chapter, and topic as applicable.

## Student Portal Scope

The student portal should stay focused and not overload the dashboard. It should show the next class, relevant announcements, current homework, upcoming tests, recent materials, and fee status summary.

Students can view only data authorized by their active enrolment, batch, academic session, curriculum track, publication state, and file visibility.

## Bulk Import Scope

Initial import types:

- Students.
- Question bank.

Workflow:

1. Download template.
2. Upload `.xlsx` or `.csv`.
3. Validate file type, size, and required columns.
4. Parse without writing to the database.
5. Map columns if practical; exact templates must work reliably.
6. Validate every row with row and column-level errors.
7. Preview valid, invalid, and warning rows.
8. Confirm explicitly before writing.
9. Show results and allow error report download.

Question bank imports must require unambiguous board/curriculum information. At minimum, question import rows must include board, programme where required, class level, subject, chapter, and question fields. A CISCE row must specify ICSE or ISC; a row must never rely on class alone to infer scope silently.

Student imports must not automatically activate authentication accounts.

Temporary import source files are retained for 30 days. Error reports can be retained with import history according to the storage retention policy.

## Confirmed Product Decisions

- Academic session is mandatory for session-scoped records.
- Permanent student identity is separate from enrolment.
- Enrolment and batch must use curriculum scope, not class level alone.
- Archived records are not deleted and remain available through filters.
- Archived files are retained.
- Public resources require no email capture.
- Public fees are configurable per course or batch.
- Public result, identifiable testimonial, and identifiable gallery content must track consent.
- Private student resources must use protected access.
- Admin-created/imported student records can exist without auth accounts.
- Student and Teacher account activation uses a secure Supabase invitation flow.
- Student IDs are application-generated, human-readable identifiers. Use a sensible initial format such as `STU-2026-0001`, while keeping generation logic isolated so the format can be changed before real production data is imported.
- Teacher authorization is contextual per Batch through explicit assignment and permission grants.
- Student historical sessions are active-session first, historical read-only later.
- Admin impersonation is not included.
- Custom fee plans use normalized instalments, not JSON.
- Fee dues are generated through an admin-reviewed preview and confirmation flow, not silently immediately after fee-plan assignment.
- CBSE Secondary and Senior Secondary are display groupings only and must not create another programme layer in the database.
- Git initialization happens at Phase 1 start.

## Remaining Ambiguities To Confirm

- Institute branding: final name, logo, colors, teacher name, contact number, address, map URL, WhatsApp message, and photographs.
- Whether legacy student identifiers must be preserved during future import.

## Risks

- Curriculum scoping must be implemented consistently; class-only filters would accidentally mix CBSE and CISCE students/content.
- Imports can corrupt curriculum data unless board/programme/class/subject columns are mandatory and validated against canonical records.
- Fee partial payments require a normalized due/allocation model; shortcuts will create unreliable pending balances.
- Student ID generation must be isolated to avoid coupling production identifiers to an early format.
- Student file authorization must be enforced server-side; hiding links in the UI is insufficient.
- Supabase Auth identities and application users must stay synchronized without duplicating domain data.
- Mobile admin workflows will fail if desktop tables become the only listing interface.

## Phase 0 Stop Point

No application scaffold, database schema file, package installation, Supabase setup, Git initialization, or Phase 1 implementation should begin until these revised planning documents are reviewed and approved.
