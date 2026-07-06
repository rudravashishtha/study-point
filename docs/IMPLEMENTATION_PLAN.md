# Implementation Plan

Phase: 0 research and planning.
Status: Draft for human review.
Last reviewed: 2026-07-07.

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
curl -O https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
mv xlsx-0.20.3.tgz vendor/
npm install xlsx@file:vendor/xlsx-0.20.3.tgz csv-parse
```

Alternative if vendoring is rejected:

```sh
npm install https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz csv-parse
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

- Students.
- Curriculum-scoped enrolments.
- Curriculum-scoped batches.
- Timetable.
- Batch assignment/removal with session and curriculum matching.
- Account activation workflow using Supabase invitation.

Validation gate:

- Integration tests for student/enrolment/batch curriculum invariants.
- Account activation security review.
- Mobile checks for student search, details, and quick actions.

## Phase 5: Academic Content

Scope:

- Study materials with secure storage.
- Homework.
- Tests.
- Question bank.
- LaTeX rendering with source text preserved.
- Curriculum-aware filters for materials, homework, tests, and questions.

Validation gate:

- Authorization tests for material visibility by session, curriculum track, and batch.
- Question validation tests.
- File upload validation review.
- Mobile checks for content management.

## Phase 6: Bulk Imports

Scope:

- Reusable import architecture.
- Spreadsheet parser adapters using reviewed SheetJS distribution approach and `csv-parse`.
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

## Phase 10: PWA And Production Hardening

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
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

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

## Phase 0 Stop

Stop here and wait for human approval before application initialization or Phase 1 implementation.
