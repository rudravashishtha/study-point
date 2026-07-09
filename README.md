# Study Point Platform

Production-grade platform for a small mathematics coaching institute teaching CBSE and CISCE Mathematics for Classes IX, X, XI, and XII.

This repository is being built in explicit phases. Phase 2 introduces the core data foundation, curriculum models, Supabase authentication integration, and application authorization.

## Prerequisites

- Node.js 22.
- npm.

Verified during Phase 1:

- Node.js `v22.23.0`.
- npm `10.9.8`.

## Installation

```sh
npm install
```

## Environment Setup

Copy `.env.example` to `.env` or `.env.local` for local development.

Phase 2 requires Supabase and database connection variables. Refer to `.env.example` for the required keys. Make sure to keep `SUPABASE_SECRET_KEY` server-only and do not expose it to the browser.

## Supabase Setup

1. Create a new Supabase project.
2. Obtain the Project URL (`NEXT_PUBLIC_SUPABASE_URL`).
3. Obtain the Publishable Key (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) and Secret Key (`SUPABASE_SECRET_KEY`).
4. Update `.env`.

## Database Setup and Migration

This project uses Prisma and requires a custom PostgreSQL migration to enforce critical partial unique indexes (e.g., exactly one active AcademicSession, and CurriculumTrack uniqueness for nullable programmeId).

**Do not use `prisma db push` for database setup or deployment.**

To generate the initial migration when a development database is available:

1. Ensure your `DATABASE_URL` is configured in `.env`.
2. Generate the migration structure without applying it:
   ```sh
   npx prisma migrate dev --create-only
   ```
3. Locate the newly created `migration.sql` file in the `prisma/migrations/` directory.
4. Open `prisma/partial_indexes.sql` and copy its entire contents.
5. Append the copied SQL to the end of the generated `migration.sql` file.
6. Apply the complete migration to your development database:
   ```sh
   npx prisma migrate dev
   ```

For production deployments, simply run:

```sh
npx prisma migrate deploy
```

## Initial Admin Creation

Admin creation relies on a server-only script rather than a public endpoint.

1. Sign up or invite the initial user via your Supabase Dashboard.
2. Obtain that user's Supabase Auth User ID (UUID).
3. Run the bootstrap script locally (with `.env` populated):
   ```sh
   npx tsx scripts/bootstrap-admin.ts <supabase-auth-user-id>
   ```
   This will create the `AppUser` record with the `ADMIN` role. No passwords are handled or stored by the application directly.

## Running Locally

```sh
npm run dev
```

The app runs at `http://localhost:3000` by default.

## Running Tests

Phase 2 introduces automated tests for curriculum invariants and permission helpers using Vitest.

```sh
npx vitest run
```

## Validation

```sh
npm run lint
npm run typecheck
npm run build
```

## Current Routes

- `/`: public website shell.
- `/courses`: public courses shell.
- `/resources`: public resources shell.
- `/announcements`: public announcements shell.
- `/contact`: public contact shell.
- `/admin`: admin dashboard shell.
- `/student`: student portal shell.

These routes are visual and structural foundations only. They do not enforce authentication or load business data yet.

## Seed Process

Deferred until data models and import mechanisms exist. Do not seed fake production users automatically.

## Production Build

```sh
npm run build
```

## Deployment

Deployment documentation will be completed after authentication, database, environment, storage, and PWA decisions are fully finalized in later phases.

## Storage Setup

Deferred to later phases. Storage planning is documented in `docs/ARCHITECTURE.md` and `docs/DATABASE_DESIGN.md`.
