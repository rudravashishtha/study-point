# Implementation Plan

Phase: 0 research and planning.
Status: Draft for human review.
Last reviewed: 2026-07-13.

## Phase 0 Findings

Repository inspection:

- Repository contained only `AGENTS.md` before Phase 0 docs.
- No `docs/` directory existed before Phase 0.
- Git is not initialized.
- Node.js `v22.23.0` is available.
- npm `10.9.8` is available.

Confirmed product decisions now reflected in all Phase 0 docs:

- The institute teaches Mathematics for CBSE and CISCE across Classes IX-XII.
- CISCE is the board; ICSE and ISC are programmes.
- Subject remains a proper entity.
- Teacher portal is deferred; teacher role remains schema/permission support only.
- Public fees are configurable per course or batch.
- Student activation uses Supabase invitation.
- Student historical sessions are active-session first, historical read-only later.
- Admin impersonation is not included.
- Public result and identifiable testimonial/gallery consent is tracked.
- Free resource email capture is not included.
- Archived files are retained.
- Temporary import files are retained for 30 days.
- Custom fee plans use normalized instalments, not JSON.
- Fee dues are generated through admin-reviewed preview and confirmation, not silently after assignment.
- CBSE Secondary and Senior Secondary are display groupings only and do not create another database programme layer.
- Student IDs are application-generated, human-readable identifiers, initially in a format such as `STU-2026-0001`, with isolated generation logic.
- Git initialization happens at Phase 1 start.

Important instruction tension:

- `AGENTS.md` says to initialize Git if the folder is not a repository.
- The empty-repository first task says execute Phase 0, create planning docs, and stop for review.
- This Phase 0 did not initialize Git to avoid expanding beyond the explicit "Phase 0 only" request. Git should be initialized at the start of approved Phase 1.

## Phase 0 Deliverables

- `docs/PRODUCT_SCOPE.md`.
- `docs/ARCHITECTURE.md`.
- `docs/DATABASE_DESIGN.md`.
- `docs/ROUTES_AND_PERMISSIONS.md`.
- `docs/IMPLEMENTATION_PLAN.md`.

No application code, package installation, database schema file, Supabase setup, Git initialization, or app scaffold should be created in Phase 0.

## Recommended Phase 1 Start

After approval:

1. Initialize Git if still missing.
2. Create `.gitignore`.
3. Scaffold the Next.js app.
4. Add foundation dependencies in focused groups.
5. Configure TypeScript strictness, linting, formatting, environment validation, base layouts, and error handling foundation.
6. Add `.env.example`.
7. Run validation gate.

Recommended initialization command:

```sh
npm create next-app@latest . -- --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Recommended foundation dependency install:

```sh
npm install @supabase/ssr @supabase/supabase-js @prisma/client zod react-hook-form @hookform/resolvers @tanstack/react-table lucide-react recharts serwist @serwist/next katex react-katex date-fns
```

Phase 1 narrowed this list to dependencies actually used by the foundation. Supabase, Prisma, forms, tables, charts, PWA, and LaTeX packages were deferred to later phases.

Recommended dev dependency install:

```sh
npm install -D prisma vitest @playwright/test prettier
```

Later dependency additions:

```sh
npm install -D tsx @types/katex
```

Use `tsx` when seed scripts or standalone TypeScript utilities are introduced. Use `@types/katex` when LaTeX rendering is implemented.

Run shadcn setup after scaffolding:

```sh
npx shadcn@latest init
```

Defer Sentry until core functionality is stable:

```sh
npm install @sentry/nextjs
```

## Spreadsheet Dependency Strategy

Do not install the public npm registry `xlsx@0.18.5` without a fresh review. Official SheetJS NodeJS installation guidance currently states that the public npm registry version is out of date and documents installation from the SheetJS CDN tarball. It also recommends vendoring for stability.

Preferred Phase 6 approach:

```sh
mkdir -p vendor
curl -L -o vendor/xlsx-0.20.3.tgz https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
npm install xlsx@file:vendor/xlsx-0.20.3.tgz
```

Alternative if vendoring is rejected:

```sh
npm install https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
```

Keep spreadsheet parsing isolated behind import parser adapters. Do not let SheetJS row structures leak into domain services.

## General Dependency Strategy

- Use current stable versions from authoritative distribution channels at initialization time.
- Commit `package-lock.json` after installation.
- Avoid manually pinning stale versions from planning docs if a newer compatible patch/minor exists at Phase 1 approval time.
- Re-check official docs before implementing fast-moving areas: Next.js config, Supabase SSR auth, Prisma 7 setup, shadcn initialization, Serwist PWA setup, SheetJS install guidance, and Sentry setup.

## Phase 1: Foundation

Scope:

- Git initialization and `.gitignore`.
- Next.js 16 App Router scaffold.
- TypeScript strict mode.
- Tailwind CSS and shadcn/ui base setup.
- Lucide icon setup through component usage.
- Basic project structure including `features/curriculum`.
- Environment validation foundation.
- Base public/admin/student layouts as shells only.
- Error, not-found, loading, and empty-state patterns.
- README starter with local development placeholders.

Validation gate:

- Lint.
- Type check.
- Production build.
- Review mobile shell behavior.
- Update docs with actual scaffold decisions.

Do not implement data/auth features in Phase 1 beyond environment placeholders.

Actual Phase 1 implementation decisions:

- Git was initialized at Phase 1 start.
- The app was scaffolded with the official Next.js 16 App Router, TypeScript, Tailwind CSS, ESLint, and `src/` directory template.
- shadcn/ui was initialized with the current CLI defaults.
- Installed only Phase 1 runtime dependencies: Next.js, React, React DOM, shadcn-generated UI dependencies, Lucide icons, and Zod.
- Installed only Phase 1 dev tooling: TypeScript, ESLint, Tailwind/PostCSS tooling, type packages, and Prettier.
- Prisma, Supabase packages, React Hook Form, TanStack Table, Recharts, SheetJS, Serwist, KaTeX, Sentry, Vitest, and Playwright remain deferred.
- Public, admin, and student route shells were created without authentication, database models, or business features.
- Mobile viewport review passed for `/`, `/admin`, and `/student` at 390px width with no horizontal overflow.
- Phase 1 validation passed: lint, typecheck, formatting check, and production build.
- `npm audit --omit=dev` reports two moderate vulnerabilities from Next.js' transitive PostCSS dependency. The suggested `npm audit fix --force` would install a breaking Next.js downgrade, so this should be revisited through a safe Next.js patch/upgrade rather than force-applied.

## Phase 2: Data, Curriculum, And Authentication

Scope:

- Prisma setup and initial schema.
- Curriculum models: board, programme, subject, curriculum track, chapter, topic.
- Academic sessions.
- Supabase project integration docs.
- Supabase SSR clients.
- Cookie-based server session validation.
- `AppUser`, roles, student/teacher profile links.
- Permission helper foundation with curriculum scope.
- Audit log foundation.
- Initial admin creation process.

Validation gate:

- Lint, type check, tests for permission helpers and curriculum invariants, production build.
- Review security boundaries and environment variables.

## Phase 3: Admin Foundation

Scope:

- Admin shell and responsive navigation.
- Admin dashboard overview.
- Curriculum filter components.
- Search/filter URL parameter pattern.
- Mobile list/card pattern for data tables.
- Archive/restore interaction pattern.
- Shared form, confirmation, toast, and empty/error states.

Validation gate:

- Mobile viewport checks for admin navigation and lists.
- Lint, type check, relevant tests, production build.

## Phase 4: Core Institute Management

Scope:

- Slice 4A: Batch & Enrolment Backend
- Slice 4B: Student Domain & Admin UI
- Slice 4C: Batch, Schedule & Membership Admin UI
- Slice 4D: Teacher Domain, Batch Assignments & Permissions
- Slice 4E: Student & Teacher Account Provisioning

Validation gate:

- Integration tests for student/enrolment/batch curriculum invariants.
- Account activation security review.
- Teacher authorization model and per-batch permission enforcement review.
- Mobile checks for student search, details, and quick actions.

## Phase 5: Academic Content & Operations

Scope:

- Slice 5A (Completed): File Storage & Study Materials
  - Storage bucket operational setup and intent -> signed URL -> finalization flow.
  - StudyMaterial and FileAsset schema with strict discriminator scoping (BATCH vs CURRICULUM_TRACK).
  - Deterministic cleanup and orphan tracking.
  - Strict Student identity and enrolment deduplication queries.
  - Deferred Teacher photo updates.
- Attendance (Deferred)
- Batch Curriculum Progress (Deferred)
- Slice 5B (Completed): Assignments / Homework
  - Strictly Batch-scoped Homework assignments.
  - Server-side derivation of session and track from authoritative Batch.
  - Schema additions for `Homework` and `HomeworkLifecycleState`.
  - Reusing existing `FileAsset` upload mechanics with strict usage category binding (`HOMEWORK`) and targetBatch matching.
  - Required title (3-100 chars) and optional description (max 2000 chars) and attachment.
  - Lifecycle: `DRAFT`, `PUBLISHED`, `ARCHIVED` (terminal).
  - Admin/Teacher (Batch-scoped) CRUD via Dialogs.
  - Student read-only UI for published assignments across active enrolments.
  - Overdue assignments remain visible and marked as overdue.
- Slice 5C (Completed): Test Management
  - Batch-scoped test scheduling and publication.
  - Schema: Test model, TestType enum, TestLifecycleState enum.
  - Reuses FileAsset upload mechanics with strict usage category binding (TEST) and targetBatch matching.
  - Lifecycle: DRAFT, PUBLISHED, ARCHIVED (terminal).
  - Admin/Teacher (Batch-scoped) CRUD via Dialogs.
  - Student read-only UI for published tests across active enrolments.
  - Question paper download via authorized route handler.
- Submissions, grading, and reminders are explicitly deferred.
- Results (Deferred)
- Teacher-facing operational workflows (Deferred)
- Question bank (Deferred)
- LaTeX rendering with source text preserved (Deferred)

Validation gate:

- Authorization tests for material visibility by session, curriculum track, and batch.
- Teacher contextual permission tests (manage vs. view).
- File upload validation review.
- Mobile checks for content management.

### Next Planned Slice

The next phase defined in the roadmap is **Phase 6: Bulk Imports**. Deferred Phase 5 items (Attendance, Batch Curriculum Progress, Submissions/Grading/Reminders, Results, Teacher-facing operational workflows, Question bank, and LaTeX rendering) remain deferred until after Phase 6 and subsequent phases.

## Phase 6: Bulk Imports

Scope:

- Reusable import architecture.
- Spreadsheet parser adapters using reviewed SheetJS distribution approach (vendored CDN tarball).
- Student template/import.
- Question template/import with mandatory unambiguous curriculum columns.
- Validation, preview, confirmation, import history.
- Error report download.
- 30-day source file retention.

Validation gate:

- Unit tests for parser normalization and row validation.
- Tests that question imports reject ambiguous board/programme/class/subject values.
- Integration tests for confirmed imports and transaction behavior.
- Large-file and mobile preview review.

#### Phase 6B — Question Import

Scope: Question template, upload, validation, preview, confirmation, import history.

Accepted trade-offs:

- **Preview: error-rows only.** The preview table displays only rows with validation errors, matching Phase 6A student import behavior. Displaying all rows with inline status indicators is intentionally deferred.
- **Duplicate detection: none.** No uniqueness constraint on `questionText`, consistent with every content entity in the repository.
- **`imageFileId`: bare `String?`.** No FileAsset relation. FK enforcement deferred, matching `Teacher.photoFileId` convention.
- **No standalone `archivedAt` index.** Consistent with all 17 existing archived entities. At expected table sizes, PostgreSQL sequential scans for archive filtering are acceptable.
- **Import history navigation** will be fixed to dispatch by `ImportType` rather than hardcoding `/admin/imports/students`.

## Phase 7: Fees And Announcements

Scope:

- Fee plans.
- Fee plan instalments.
- Student fee assignments.
- Student fee dues.
- Payments.
- Payment allocations.
- Pending fee calculation.
- Printable receipts.
- Announcements for public/all/curriculum/batch audiences.

Validation gate:

- Unit tests for due generation, partial payments, allocations, and pending balance calculations.
- Authorization tests for student fee visibility by enrolment.
- Mobile payment recording flow review.

## Phase 8: Student Portal

Scope:

- Student dashboard.
- My course and batch.
- Timetable.
- Study materials.
- Homework.
- Tests.
- Fees.
- Announcements.
- Live class link display only for authorized students.

Validation gate:

- E2E for student login and authorized material access.
- Mobile viewport checks.
- PWA caching review before enabling private routes.

## Phase 9: Public Website

Scope:

- Compact public route structure: Home, Courses, Resources, Announcements, Contact.
- Structured home sections for teacher profile, methodology, selected results/testimonials, FAQ highlights, contact, and WhatsApp.
- Courses grouped by board, programme, class level, and subject.
- Public resources without email capture.
- Public fee display configurable per course or batch.
- Consent-aware results, testimonials, and gallery content.
- Structured admin content publishing.

Validation gate:

- Accessibility review.
- Mobile checks.
- Public empty/published states.
- SEO basics.

### Phase 9A — Public Website Slices

Delivered incrementally to keep each public surface reviewable:

- 9A.1 (SiteSettings foundation): Structured site settings model and admin editing.
- 9A.2 (Public Layout & Footer): Public shell, navigation, header/footer.
- 9A.3 (Public Home page): Hero, teacher intro, methodology highlights, results/testimonials, FAQ, contact, WhatsApp CTA.
- 9A.4 (Public Courses page): Courses grouped by board, programme, class level, subject.
- 9A.5 (Public Resources page): Free study resources, grouped by resource type, with guarded public download for published `CURRICULUM_TRACK` materials. No email capture. Admin-side resource authoring reuses the StudyMaterial model (`CURRICULUM_TRACK` visibility); a dedicated `/admin/website/resources` management UI remains a follow-up.

## Phase 10: Authentication & Account Experience

Scheduled after completion of the Public Website (Phase 9). This phase delivers premium, role-specific authentication and account experiences on top of the existing authentication and permission architecture (Supabase Auth SSR, `AppUser`/role model, permission helpers, and audit log established in Phase 2).

Scope:

- Beautiful, role-specific login pages for:
  - Student
  - Teacher
  - Admin
  - Super Admin (if applicable)
- First-time account activation (Supabase invitation / provisioning flow wired to the existing student/teacher/admin provisioning from Phase 4).
- Forgot password flow.
- Reset password flow.
- Session expiry handling (graceful re-authentication without data loss where feasible).
- Logout flow (server-side session/cookie cleanup).
- Unauthorized / Access Denied pages (role- and ownership-aware).
- Role-aware post-login redirects to the correct portal surface.
- Mobile-first responsive authentication UI.
- Accessibility for all auth surfaces (labels, focus states, error messaging, reduced motion).
- Integration with the existing authentication and permission architecture (no parallel auth system; reuse Supabase SSR clients, permission helpers, and audit logging).

Non-goals for this phase:

- New authorization models or permission primitives (reuse Phase 2 foundations).
- Parent portal or additional roles beyond those already defined.

Validation gate:

- E2E for role-specific login, first-time activation, forgot/reset password, session expiry, and logout.
- Authorization tests confirming role-aware redirects and Access Denied behavior.
- Mobile viewport checks for every auth surface.
- Accessibility review for auth forms and error states.
- Lint, type check, unit/integration tests, production build.

### Phase 10A — Authentication Foundation (Complete)

Commit `8e1669d` (pushed to `origin/main`). Builds on the existing Phase 2 auth/permission architecture (`AppUser`/role model, `permissions.ts` helpers, Supabase SSR). No schema changes.

Delivered:

- `src/proxy.ts` (Next.js 16 proxy, **not** `middleware.ts`): session refresh via `supabase.auth.getUser()` and coarse role-aware **optimistic routing** only. No Prisma, no `getAppUser`, no DB queries, no ownership checks.
- Shared auth layout (`app/(auth)/layout.tsx`) with per-role theming.
- Themed login: `/login` and `/login/[role]` for `student`/`teacher`/`admin` (invalid role falls back to default theme).
- Server-side `signIn` and `signOut` actions (`src/features/auth/actions.ts`).
- Status/placeholder pages: `/unauthorized`, `/session-expired`, `/teacher` (placeholder; uses `requireRole`).
- Logout wired into `AdminShell` and `StudentShell`.

Architecture rule: the JWT `app_metadata.role` claim is a routing cache only, synced best-effort at sign-in. Database `AppUser.role` via `getAppUser` / `requireRole` / `requireAdmin` is the single authorization source of truth. A stale JWT claim can mis-route at most, never escalate privilege.

Validation gate (all green): prettier, eslint (0/0), `next build` (`ƒ Proxy`), `npm test` (327 passed / 155 skipped), `next start` smoke.

### Phase 10B — Account Experience (Complete)

Deferred from 10A; builds on the 10A foundation:

- Account activation (Supabase invitation wired to Phase 4 provisioning).
- Invitation flow, including `/auth/callback`.
- Forgot password (Supabase built-in email reset).
- Reset password (`/reset-password`; distinguishes invite vs reset context from session/token state).
- Password strength meter (activation/reset UI).
- Rate limiting on login, forgot-password, and activation (Supabase email limits + lightweight route-level limiter; no Redis initially).
- Authorization hardening of existing `/admin/*` and `/student/*` pages (permission helpers already exist; ensure every server action and page enforces server-side checks).

Validation gate (planned): E2E for role-specific login, first-time activation, forgot/reset password, session expiry, and logout; authorization tests for role-aware redirects and Access Denied; mobile viewport and accessibility checks for every auth surface; lint, type check, unit/integration tests, production build.

## Phase 11: PWA And Production Hardening

Scope:

- Serwist PWA setup.
- Manifest and icons.
- Offline fallback.
- Conservative caching.
- Accessibility review.
- Security review.
- Performance review.
- Error handling review.
- Broader test suite.
- Sentry setup.
- Production build and deployment docs.

Validation gate:

- Lint.
- Type check.
- Unit, integration, and E2E tests.
- Production build.
- Mobile review.
- Security review.
- Documentation update.

## Required Final README Topics

The final README must include:

1. Prerequisites.
2. Installation.
3. Environment setup.
4. Supabase setup.
5. Database migration.
6. Seed process.
7. Running locally.
8. Running tests.
9. Production build.
10. Deployment.
11. Initial admin creation.
12. Storage setup.

## Required Environment Variables

Create `.env.example` in Phase 1 or Phase 2 with clear categories.

Likely public:

- `NEXT_PUBLIC_APP_URL`.
- `NEXT_PUBLIC_SUPABASE_URL`.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Server-only:

- `DATABASE_URL`.
- `DIRECT_URL` if Prisma/Supabase pooling setup requires it.
- `SUPABASE_SERVICE_ROLE_KEY`, only if Supabase invitation or privileged storage operations require it.
- `SENTRY_AUTH_TOKEN`, once Sentry release integration is enabled.

Optional:

- `NEXT_PUBLIC_SENTRY_DSN` or server Sentry DSN depending final setup.

Never commit `.env` or real secrets.

## Testing Strategy

Unit tests:

- Curriculum validation.
- Student ID generation.
- Fee due generation, payment allocation, and pending balance calculation.
- Import validation.
- Permission helpers.
- Data transformation.

Integration tests:

- Server actions and route handlers for important mutations.
- Auth and permission boundaries where feasible.
- Enrolment/batch curriculum matching.
- Import confirmation transactions.

E2E tests:

- Admin login.
- Create academic session.
- Confirm curriculum tracks.
- Create batch.
- Create student.
- Assign student to curriculum-scoped batch.
- Import students.
- Import question bank with board/programme/class/subject.
- Activate student account.
- Upload study material.
- Student login.
- Student views authorized material.
- Record fee due/payment/allocation.
- Student views fee status.
- Archive and restore a record.

## Review Checklist Before Approving Phase 1

- Confirm institute branding/contact details are available or can be placeholder content.
- Confirm Git should be initialized at Phase 1 start.

## Progress History

- Phase 1: Completed.
- Phase 2: Completed.
- Phase 3: Completed.
- Phase 4: Completed.
  - Slice 4A (Admin Domain Foundation): Completed.
  - Slice 4B (Admin Session Management): Completed.
  - Slice 4C (Admin Batch Foundation): Completed.
  - Slice 4D (Teacher Management & Assignments): Completed.
  - Slice 4E (Student Provisioning): Completed.
- Phase 5: Completed.
  - Slice 5A (File Storage & Study Materials): Completed.
  - Slice 5B (Assignments / Homework): Completed.
  - Slice 5C (Test Management): Completed.
- Phase 6: Completed (Bulk Imports — student and question import, validation, preview, confirmation, import history).
- Phase 7: Completed (Fees and Announcements).
- Phase 8: Completed (Student Portal).
  - `f7dbb38 feat: Phase 8 — Student Portal enhancements`.
- Phase 9: Completed (Public Website), delivered as 8 compressed slices 9A.1–9A.8 covering SiteSettings, public layout, home, courses, resources, contact, admissions, and SEO polish.
  - 9A.1 (SiteSettings foundation): Completed — `060825d`.
  - 9A.2 (Public Layout & Footer): Completed — `b1bee68`.
  - 9A.3 (Public Home page): Completed — `0961926`.
  - 9A.4 (Public Courses page): Completed — `f495a9b`.
  - 9A.5 (Public Resources page): Completed and pushed — `11d3273`.
  - 9A.6 (Public Contact page): Completed and pushed — `b300c72`.
  - 9A.7 (Public Admissions page + About/Privacy/Terms nav fixes): Completed and pushed — `ac12010`.
  - 9A.8 (SEO & Public Website Polish): Completed.

- Phase 10: Completed (Authentication & Account Experience).
  - Phase 10A (Authentication Foundation): Completed — `8e1669d`. Next.js 16 `proxy.ts` session refresh, themed login, server-side auth actions, unauthorized/session-expired pages.
  - Phase 10B (Account Experience): Completed — account activation, invitation flow, forgot/reset password, password strength, rate limiting, authorization hardening.

- Phase 11: Completed (PWA and Production Hardening).
  - Phase 11A (PWA): Serwist service worker, offline fallback, manifest, icons.
  - Phase 11B: Production hardening including security (CSP, headers, HSTS, env validation), monitoring (Sentry), deployment (docs, CI/CD), accessibility (skip-to-content, ARIA, reduced motion, axe-core), design refinement (consistent border radius, color tokens, shell issues), and rendering/performance optimization (dynamic imports, ISR tuning, cache invalidation, react.cache deduplication, bundle size reduction).
  - Phase 11 sub-phases: 11A.1–2 (PWA), 11A.5–6 (Design), 11B.1 (Security), 11B.2 (Monitoring), 11B.3 (Deployment), 11B.4 (Accessibility), 11B.5 (Rendering/Performance), 11B.5.5 (Production Metrics).

- UX Polish (Phases 1-5): Completed.
  - Phase 1: Action button spinners — added Loader2 spinners and disabled state to StudentList, TeacherRowActions, AssignTeacherDialog, EditAssignmentDialog; disabled BatchFormDialog Cancel during submission.
  - Phase 2: Navigation loading indicators — added useTransition-based pending states with animate-pulse icons to admin and student navigation (mirroring teacher nav pattern).
  - Phase 3: Skeleton loaders — replaced PageSkeleton with DataListSkeleton in 10 list pages; created 14 new loading.tsx files for student sub-routes and missing admin pages.
  - Phase 4: Loading toasts for bulk operations — added toast.loading() indicators to StudentActivationQueue, TeacherActivationQueue, StudentImportWizard, QuestionImportWizard.
  - Phase 5: Toast format standardization — AST-based ts-morph codemod converted 105 simple toasts to title+description format across 48 files; manually fixed 8 OPTIONS toasts with { id: toastId }.

## Phase 0 Stop

Stop here and wait for human approval before application initialization or Phase 1 implementation.

---

## Status Block

```text
Phase: 12 (Release Readiness)
Status: Phase 12.1 (Production Validation) complete; UX Polish (Phases 1-5) complete
Working tree: Clean

Completed (UX Polish — Phases 1-5):
- Phase 1: Action button spinners (StudentList, TeacherRowActions, AssignTeacherDialog, EditAssignmentDialog, BatchFormDialog)
- Phase 2: Navigation loading indicators (admin-navigation, student-navigation via useTransition)
- Phase 3: Skeleton loaders (10 DataListSkeleton swaps + 14 new loading.tsx files)
- Phase 4: Loading toasts (StudentActivationQueue, TeacherActivationQueue, StudentImportWizard, QuestionImportWizard)
- Phase 5: Toast format standardization (105 SIMPLE → TITLE_DESC via ts-morph codemod + 8 OPTIONS manual fixes)

Completed (Phase 12.1 — Production Validation):
- Production build verifies: 59 routes, all correctly classified (ISR public pages, dynamic authenticated pages)
- Lighthouse: A11y 98-100, SEO 100, BP 100, Perf 85-91 across 8 key pages
- Security headers: CSP, HSTS, XFO, XCTO, Referrer-Policy, Permissions-Policy all present and correct
- PWA: Manifest, icons, service worker (104 precache entries), offline page verified
- Health endpoint: {"status":"ok","db":"connected"}
- Sentry: 5 config files (server, edge, client, instrumentation, next.config)
- Dependency audit: 2 moderate advisories (dev-only / transitive, no production risk)
- Release Readiness Report: docs/RELEASE_READINESS.md

Completed (Phase 11 — PWA and Production Hardening):
- 11A (PWA): Serwist SW, offline fallback, manifest, icons
- 11A.5-6 (Design Audit): Consistent border radius, color tokens, shell issues resolved
- 11B.1 (Security): CSP, HSTS, env validation, health endpoint, upload origin validation
- 11B.2 (Monitoring): @sentry/nextjs v10, server/edge/client configs, instrumentation
- 11B.3 (Deployment): README.md, docs/DEPLOYMENT.md, CI/CD, .env.example
- 11B.4 (Accessibility): Skip-to-content, ARIA, reduced motion, dialog cleanup, axe-core
- 11B.5 (Rendering/Performance): Dynamic imports (-13KB largest chunk), ISR tuning, revalidatePath on admin mutations, react.cache deduplication, searchParams Promise fix, missing requireAdmin() fix

Known non-blocking issues:
- LCP 3.4-4.4s (font loading; migrate to next/font post-release)
- 2 moderate dependency advisories (no production impact)

Next planned phase:
Phase 12.2-12.6 — Manual browser validation, critical user journeys, production deployment, release candidate

Outstanding blockers:
- None
```
