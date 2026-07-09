# Architecture

Phase: 0 research and planning.
Status: Draft for human review.
Last reviewed: 2026-07-07.

## Source Notes

Official documentation checked during Phase 0:

- Next.js installation and App Router docs: https://nextjs.org/docs/app/getting-started/installation
- Supabase SSR guide for Next.js: https://supabase.com/docs/guides/auth/server-side/nextjs
- Supabase JavaScript admin auth reference: https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail
- Prisma PostgreSQL setup docs: https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch/relational-databases-typescript-postgresql
- Tailwind CSS Next.js docs: https://tailwindcss.com/docs/installation/framework-guides/nextjs
- shadcn/ui Next.js docs: https://ui.shadcn.com/docs/installation/next
- TanStack Table docs: https://tanstack.com/table/latest/docs/installation
- React Hook Form resolvers docs: https://github.com/react-hook-form/resolvers
- Serwist docs: https://serwist.pages.dev/
- Sentry Next.js docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- SheetJS NodeJS installation docs: https://docs.sheetjs.com/docs/getting-started/installation/nodejs/

Package versions were checked through read-only `npm view` queries on 2026-07-07 where npm is the authoritative distribution channel. SheetJS is an exception; official SheetJS docs say the public npm registry `xlsx` package is out of date and the SheetJS CDN tarball is the authoritative source.

## Application Shape

Build one full-stack Next.js application using:

- Next.js App Router.
- React.
- TypeScript strict mode.
- Server Components by default.
- Client Components only for browser-only interactivity.
- Server Actions for suitable authenticated mutations.
- Route Handlers for uploads, imports, webhooks, file download authorization, public endpoints, and APIs where an HTTP boundary is clearer.
- Prisma for normal application database access.
- Supabase Auth for identity.
- Cloudflare R2 for file storage (via provider-neutral abstraction).

Do not create a separate backend, separate frontend, microservices, native app, generic CMS, or page builder.

## Curriculum Architecture

Use a canonical curriculum hierarchy:

```text
Board -> Programme where relevant -> ClassLevel -> Subject -> Chapter -> Topic
```

Initial board/programme model:

- `CBSE` is a board.
- `CISCE` is a board.
- `ICSE` is a CISCE programme for Classes IX and X.
- `ISC` is a CISCE programme for Classes XI and XII.

Do not model CBSE, ICSE, and ISC as peer boards. CISCE is the board; ICSE and ISC are programmes under it.
CBSE Secondary and Senior Secondary are display groupings only. They must not create another programme layer in the database.

Use a `CurriculumTrack` or equivalent canonical record for each valid board/programme/class/subject combination. Enrolments, batches, materials, homework, tests, questions, course content, fee plans, filters, imports, and permission checks should reference this track instead of repeating loosely related curriculum fields.

This prevents accidental mixing such as assigning a CISCE/ICSE Class X student to a CBSE Class X batch.

## Recommended Runtime And Versions

Local environment verified:

- Node.js: `v22.23.0`.
- npm: `10.9.8`.
- Git: not initialized at Phase 0 inspection.

Current package baseline checked on 2026-07-07:

| Package                 |                                                                       Version or source |
| ----------------------- | --------------------------------------------------------------------------------------: |
| `next`                  |                                                                               `16.2.10` |
| `react`                 |                                                                                `19.2.7` |
| `react-dom`             |                                                                                `19.2.7` |
| `typescript`            |                                                                                 `6.0.3` |
| `tailwindcss`           |                                                                                 `4.3.2` |
| `@tailwindcss/postcss`  |                                                                                 `4.3.2` |
| `@supabase/ssr`         |                                                                                `0.12.0` |
| `@supabase/supabase-js` |                                                                               `2.110.0` |
| `prisma`                |                                                                                 `7.8.0` |
| `@prisma/client`        |                                                                                 `7.8.0` |
| `zod`                   |                                                                                 `4.4.3` |
| `react-hook-form`       |                                                                                `7.81.0` |
| `@hookform/resolvers`   |                                                                                 `5.4.0` |
| `@tanstack/react-table` |                                                                                `8.21.3` |
| `lucide-react`          |                                                                                `1.23.0` |
| `recharts`              |                                                                                 `3.9.2` |
| SheetJS `xlsx`          | Official CDN tarball `0.20.3`; do not install npm registry `xlsx@0.18.5` without review |
| `csv-parse`             |                                                                                 `7.0.1` |
| `serwist`               |                                                                                `9.5.11` |
| `@serwist/next`         |                                                                                `9.5.11` |
| `katex`                 |                                                                                `0.17.0` |
| `react-katex`           |                                                                                 `3.1.0` |
| `@sentry/nextjs`        |                                                                               `10.63.0` |
| `vitest`                |                                                                                `4.1.10` |
| `@playwright/test`      |                                                                                `1.61.1` |
| `eslint`                |                                                                                `10.6.0` |
| `eslint-config-next`    |                                                                               `16.2.10` |
| `prettier`              |                                                                                 `3.9.4` |
| `date-fns`              |                                                                                 `4.4.0` |
| `@types/katex`          |                                                                                `0.16.8` |
| `tsx`                   |                                                                                `4.23.0` |

Phase 1 actual scaffold installed `react` and `react-dom` at `19.2.4` and `typescript` at `5.9.3` through the official `create-next-app` lockfile. This is acceptable for Phase 1 because it is the mutually compatible set selected by the current Next.js scaffold. Re-check before upgrading React or TypeScript independently.

## Exact Phase 1 Initialization Recommendation

After approval, initialize Git first, then initialize with the current Next.js generator and npm:

```sh
npm create next-app@latest . -- --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Install only foundation/runtime dependencies needed before imports:

```sh
npm install @supabase/ssr @supabase/supabase-js @prisma/client zod react-hook-form @hookform/resolvers @tanstack/react-table lucide-react recharts serwist @serwist/next katex react-katex date-fns
```

Install development dependencies:

```sh
npm install -D prisma vitest @playwright/test prettier
```

Add `csv-parse` when CSV import work begins.

For SheetJS, do not install the outdated public npm registry `xlsx@0.18.5` without a fresh review. Official SheetJS docs currently recommend installing the current tarball from the SheetJS CDN, and also recommend vendoring for stability. Preferred project approach when Phase 6 begins:

```sh
mkdir -p vendor
curl -O https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
mv xlsx-0.20.3.tgz vendor/
npm install xlsx@file:vendor/xlsx-0.20.3.tgz csv-parse
```

If vendoring is rejected, install the official CDN tarball directly:

```sh
npm install https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz csv-parse
```

Add `tsx` when seed scripts or standalone TypeScript utilities are introduced. Add `@types/katex` when KaTeX rendering is implemented and TypeScript needs package declarations.

Run shadcn setup only after the Next.js app exists:

```sh
npx shadcn@latest init
```

Phase 1 used the current shadcn CLI defaults, which created `components.json`, `src/components/ui/button.tsx`, `src/lib/utils.ts`, and updated Tailwind CSS imports. The installed shadcn v4 package remains a runtime dependency because the generated CSS imports `shadcn/tailwind.css`.

Sentry should be installed after core functionality is stable, not during the foundation phase:

```sh
npm install @sentry/nextjs
```

## Suggested Source Layout

Use feature-oriented organization with shared infrastructure boundaries:

```text
src/
  app/
    (public)/
    (auth)/
    admin/
    student/
    api/
  components/
    ui/
    layout/
    data-display/
    forms/
  features/
    curriculum/
    academic-sessions/
    students/
    enrolments/
    batches/
    timetable/
    materials/
    homework/
    tests/
    questions/
    imports/
    fees/
    announcements/
    website-content/
    audit/
  lib/
    auth/
    db/
    env/
    permissions/
    storage/
    validation/
    errors/
  server/
    actions/
    queries/
  styles/
```

Keep database queries in server-side feature modules or services. Avoid scattering Prisma calls directly across UI components.

## Authentication Architecture

Supabase Auth is the identity provider. The application database stores an `AppUser` record that maps to the Supabase auth user ID and contains application role and profile links.

Keep separate:

- Supabase authentication identity.
- Application user.
- Role.
- Student profile.
- Teacher profile.
- Academic enrolment.

Use cookie-based Supabase SSR clients for session-aware server rendering and route protection. Server-side authorization must use trusted session data and application database role records, never client-supplied roles.

Student account activation uses a secure Supabase invitation flow:

1. Admin creates or imports a student profile without auth.
2. Admin reviews the student.
3. Admin activates selected students.
4. A server-only operation sends Supabase invitations.
5. The system creates or links the `AppUser` record only for the correct student.
6. Audit events record success and failures without secrets.

The service-role key, if needed for auth admin invitation, must be server-only and never available to the browser.

## Authorization Architecture

Use centralized permission helpers in `src/lib/permissions`.

Authorization must happen on the server for:

- Protected route access.
- Server Actions.
- Route Handlers.
- File download/signing endpoints.
- Import processing.
- Admin mutations.

RBAC covers broad access:

- `ADMIN`.
- `TEACHER`.
- `STUDENT`.

Admin is the superuser.
Teachers are Batch-scoped, meaning the `TEACHER` role does not grant global permissions. Access to any Batch requires an explicit `TeacherAssignment` for that Teacher and Batch. Stored permissions are explicit Admin selections, and effective permissions are centrally derived at runtime. Account provisioning is separate from Teacher profiles and assignments.

Ownership and scope checks cover data access:

- Student can access only records connected to their active enrolment at first.
- Historical student sessions can be added later as read-only views.
- Batch-restricted material, homework, tests, timetable, and announcements require enrolment in that batch.
- Curriculum-restricted records require the student's enrolment `CurriculumTrack`.
- Academic-session scoped records must be filtered by selected session.
- Public website content must be explicitly published before public rendering.
- Admin impersonation is not supported.

## Data Access

Use Prisma for ordinary application queries and mutations. Do not use Supabase database client APIs for normal business queries.

Use Supabase client APIs for:

- Authentication session management.
- Auth admin invitation when server-side credentials are required.

Use the provider-neutral storage abstraction (Cloudflare R2) for:

- Storage uploads, downloads, and signed URLs.

Use transactions for:

- Confirmed imports.
- Student activation steps that update multiple application records.
- Fee due confirmation, payment recording, and payment allocation.
- Archive/restore actions with audit logging.

## File Storage Architecture

**Approved Future Architecture Decision (R2 & Provider Neutrality):**

- **Cloudflare R2** will be the initial object-storage provider for notes, sample papers, worksheets, answer keys, and other large academic files.
- PostgreSQL will store file metadata and curriculum relationships only, not file binary data.
- The storage architecture must remain **provider-neutral**.
- Future application code must use a **storage abstraction** rather than importing R2-specific logic throughout the codebase.
- Database records should store **stable object keys** and provider-neutral metadata, not permanent provider-specific public URLs.
- Files should use **private object storage**.
- Student downloads should use authorization checks followed by **short-lived signed URLs**.
- Large uploads should transfer **directly between the browser and object storage** using presigned upload URLs rather than passing file bodies through the Next.js server.
- The design must allow future migration to another S3-compatible provider without redesigning the application domain.

Use intentional bucket separation:

- Public website assets.
- Public study resources.
- Private study materials.
- Homework attachments.
- Test papers.
- Question images.
- Gallery images.
- Temporary import source files and error reports.

Storage paths should be generated, stable, and non-guessable:

```text
{bucket}/{entityType}/{academicSessionId}/{curriculumTrackId}/{entityId}/{fileId}-{safeSlug}.{ext}
```

Do not trust original filenames as storage identifiers. Store metadata such as original filename, MIME type, size, bucket, path, visibility, uploadedBy, createdAt, retainedUntil, and archivedAt where relevant.

Archived files are retained. Temporary import source files are retained for 30 days.

## UI Architecture

Use Tailwind CSS, shadcn/ui, and Lucide icons. Build a coherent design system for public, admin, and student surfaces.

Public website:

- Trustworthy, academic, warm, local, and personal.
- Small public navigation: Home, Courses, Resources, Announcements, Contact.
- Structured sections can appear on the home or courses pages instead of every content model requiring a top-level route.
- Avoid generic SaaS patterns, fake statistics, excessive gradients, glassmorphism, and stock-photo-heavy design.

Admin dashboard:

- Calm, efficient, mobile-first, dense enough to be useful.
- Tables must have mobile card/list alternatives.
- Filters should use URL search parameters.
- Curriculum filters should use board, programme, class level, subject, chapter, and topic where applicable.

Student portal:

- Simple, focused, encouraging, and easy to scan.

## Import Architecture

Build a reusable import engine with specific adapters for students and question bank.

Core layers:

- Template definitions.
- File validation.
- Parser adapters for `.xlsx` and `.csv`.
- Column mapping.
- Row normalization.
- Zod validation.
- Cross-record validation against canonical curriculum records and database references.
- Preview model.
- Confirmed write service.
- Error report generation.
- Import job and import error persistence.

Question import templates must require board, programme where required, class level, subject, chapter, and question fields. CISCE rows must specify ICSE or ISC. The importer must reject ambiguous rows rather than infer silently from class level alone.

Parsing must not write to the database. Confirmation must be explicit.

## PWA Architecture

Use Serwist only after the app shell and route boundaries are stable. The service worker must avoid caching private student data carelessly.

Recommended initial caching:

- Static app assets.
- Public website pages where safe.
- Offline fallback page.

Avoid initially:

- Offline mutation queues.
- Long-lived caching of authenticated API responses.
- Private file caching.

## Security Boundaries

Server-only:

- Database URLs.
- Supabase service-role key.
- Storage privileged operations.
- Auth admin invitation operations.
- Sentry auth token if used for releases.

Browser-safe:

- Supabase URL.
- Supabase anon publishable key.
- Public application URL.

Every protected operation must validate:

- Authenticated session.
- Application user exists and is active.
- Role.
- Ownership, batch, and curriculum scope.
- Input schema.
- Archive/published state as applicable.

## Architectural Risks

- Class-only modelling would mix CBSE and CISCE students/content. `CurriculumTrack` must become the shared contract.
- Supabase Auth and Prisma data can drift if invitation/linking is not handled carefully.
- Private storage access can accidentally become public if bucket defaults are not documented and tested.
- Mobile admin UX will degrade if TanStack Table is used without mobile-specific display patterns.
- PWA caching can leak private data if broad runtime caching is enabled.
- Question content rendering can become unsafe if LaTeX/HTML boundaries are not controlled.
- Import preview state can become large; keep parsed rows server-owned or persisted per job rather than putting huge datasets in browser state.
- Fee balances will be wrong if partial payments are not allocated against explicit dues.
- Student identifier generation should stay isolated so the initial `STU-2026-0001` style can change before production imports if needed.

## Phase 0 Decision

The architecture is ready for review, but Phase 1 must not begin until the product, database, route, and implementation plans are approved.
