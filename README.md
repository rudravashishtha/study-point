# 1plus1 Mathematics Platform

Production-grade platform for a small mathematics coaching institute teaching CBSE and CISCE Mathematics for Classes IX, X, XI, and XII.

This repository is being built in explicit phases. Phase 1 contains only the application foundation: Next.js scaffold, UI foundation, environment validation, route shells, and documentation. Authentication, database models, business workflows, imports, fees, and student data are intentionally deferred.

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

Copy `.env.example` to `.env.local` for local development and fill values as phases require them.

Phase 1 does not require live Supabase, database, or Sentry values.

## Running Locally

```sh
npm run dev
```

The app runs at `http://localhost:3000` by default.

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

## Supabase Setup

Deferred to Phase 2. Supabase Auth, SSR clients, storage, and database connection variables are documented in `.env.example` but are not wired in Phase 1.

## Database Migration

Deferred to Phase 2. Prisma is not installed in Phase 1.

## Seed Process

Deferred until data models exist. Do not seed fake production users automatically.

## Running Tests

Automated tests are deferred until domain logic exists. Phase 1 validation uses linting, type checking, production build, and mobile shell review.

## Production Build

```sh
npm run build
```

## Deployment

Deployment documentation will be completed after authentication, database, environment, storage, and PWA decisions are implemented.

## Initial Admin Creation

Deferred to Phase 2 with Supabase Auth and application roles.

## Storage Setup

Deferred to later phases. Storage planning is documented in `docs/ARCHITECTURE.md` and `docs/DATABASE_DESIGN.md`.
