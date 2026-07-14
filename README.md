# Study Point Platform

Production-grade platform for a small mathematics coaching institute teaching CBSE and CISCE Mathematics for Classes IX, X, XI, and XII.

Built with Next.js 16, TypeScript, Prisma, Supabase, Tailwind CSS, and shadcn/ui.

## Documentation

- **[Architecture](./docs/ARCHITECTURE.md)** — System design, component decisions, security model.
- **[Database Design](./docs/DATABASE_DESIGN.md)** — Schema, relationships, indexes, enums.
- **[Implementation Plan](./docs/IMPLEMENTATION_PLAN.md)** — Current phase, completed work, next steps.
- **[Routes and Permissions](./docs/ROUTES_AND_PERMISSIONS.md)** — Route structure, role-based access control.
- **[Deployment Guide](./docs/DEPLOYMENT.md)** — Full deployment, CI/CD, backup/restore, rollback, smoke tests.

## Prerequisites

- Node.js 22
- npm 10+

## Installation

```sh
npm install
```

## Environment Setup

Copy `.env.example` to `.env` or `.env.local`:

```sh
cp .env.example .env
```

All required variables are documented in `.env.example`. The application will fail to start if any required variable is missing.

## Supabase Setup

1. Create a Supabase project.
2. Obtain the Project URL (`NEXT_PUBLIC_SUPABASE_URL`) and keys.
3. Update `.env` with your Supabase credentials.
4. Run database migrations (see below).

## Database Migration

```sh
npx prisma migrate dev        # Local development
npx prisma migrate deploy     # Production
```

**Do not use `prisma db push` for schema changes.** Always use migrations.

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md#database-migrations) for details on custom indexes.

## Initial Admin Creation

```sh
npx tsx scripts/bootstrap-admin.ts <supabase-auth-user-id>
```

## Running Locally

```sh
npm run dev
```

The app runs at `http://localhost:3000` by default.

## Production Build

```sh
npm ci
npm run build
npm start
```

## Quality Checks

```sh
npm run lint        # ESLint
npm run typecheck   # TypeScript
npm run test        # Vitest
npm run build       # Next.js production build
```

## Key Features

- **Public Website**: Home, courses, methodology, resources, contact, announcements, FAQ.
- **Student Portal**: Dashboard, timetable, study materials, homework, tests, fees, announcements.
- **Admin Dashboard**: Students, batches, enrolment, timetable, materials, homework, tests, question bank, fees, imports, announcements, website content.
- **PWA**: Installable, offline fallback, runtime caching.
- **Monitoring**: Sentry error tracking with performance monitoring.
- **Security**: CSP, HSTS, strict env validation, cookie-based auth, Origin validation on mutations.

## Deployment

See the full [Deployment Guide](./docs/DEPLOYMENT.md) for:

- CI/CD pipeline setup
- Health checks and monitoring
- Backup and restore procedures
- Release process and versioning
- Rollback procedures
- Post-deployment smoke tests
