# Deployment Guide

## Architecture Overview

- **Hosting**: Node.js server (self-hosted or VPS). Next.js 16 App Router with static/dynamic hybrid rendering.
- **Database**: PostgreSQL hosted on Supabase.
- **Storage**: Supabase Storage for file uploads (study materials, homework, question images).
- **Auth**: Supabase Auth with cookie-based SSR sessions.
- **Monitoring**: Sentry for error tracking and performance monitoring.
- **PWA**: Service worker via Serwist for offline support and installability.

---

## Prerequisites

- Node.js 22
- npm 10+
- A Supabase project (database + auth + storage)
- A Sentry project (optional, for error monitoring)
- PostgreSQL database (Supabase provides this)

---

## Environment Variables

See `.env.example` for the complete list. Core variables:

| Variable                               | Required | Description                                           |
| -------------------------------------- | -------- | ----------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                  | Yes      | Canonical application URL                             |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | Supabase project URL                                  |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | Supabase anonymous/publishable key                    |
| `SUPABASE_SECRET_KEY`                  | Yes      | Supabase service-role key (server-only, never expose) |
| `DATABASE_URL`                         | Yes      | PostgreSQL connection string (Prisma)                 |
| `DIRECT_URL`                           | Yes      | Direct PostgreSQL connection for migrations           |
| `NEXT_PUBLIC_SENTRY_DSN`               | No       | Sentry DSN for error tracking                         |
| `SENTRY_AUTH_TOKEN`                    | No       | Sentry auth token for source map upload               |
| `SENTRY_ORG`                           | No       | Sentry organization slug                              |
| `SENTRY_PROJECT`                       | No       | Sentry project slug                                   |

---

## Database Migrations

```sh
# Apply pending migrations to production
npx prisma migrate deploy

# Verify migration status
npx prisma migrate status
```

**Do not use `prisma db push` in production.** Always use `prisma migrate deploy`.

### Custom Indexes

Some critical indexes (partial unique indexes, composite indexes) are defined in `prisma/partial_indexes.sql`. These are included in the initial migration. If you regenerate migrations, re-append the contents of `partial_indexes.sql`.

---

## Storage Setup (Supabase)

1. In your Supabase dashboard, create the following storage buckets:

   | Bucket            | Visibility | Purpose                                       |
   | ----------------- | ---------- | --------------------------------------------- |
   | `study-materials` | Public     | Public study resources                        |
   | `private-files`   | Private    | Homework, test papers, student-uploaded files |
   | `question-images` | Private    | Question bank images                          |
   | `public-assets`   | Public     | Website images, gallery                       |

2. Configure CORS in Supabase Storage settings to allow your production domain.

3. Set up RLS policies on the `private-files` and `question-images` buckets to restrict access to authorised users.

---

## Initial Admin Setup

```sh
# 1. Create the initial user via Supabase Auth dashboard (email/password).
# 2. Get the Supabase Auth User ID from the dashboard.
# 3. Run:
npx tsx scripts/bootstrap-admin.ts <supabase-auth-user-id>
```

This creates an `AppUser` record with the `ADMIN` role. Additional admins and teachers can be created from the admin dashboard.

---

## Build and Deploy

### Production Build

```sh
npm ci
npm run build
```

The build output is in `.next/`. Start with:

```sh
npm start
```

### Health Check

After deployment, verify the application is running:

```sh
curl https://your-domain.com/api/health
# Expected: {"status":"ok","db":"connected"}
```

---

## CI/CD Pipeline

The CI pipeline (`.github/workflows/ci.yml`) runs on every push to `main` and every PR:

1. **Lint** — ESLint
2. **TypeScript check** — `tsc --noEmit`
3. **Tests** — `vitest run`
4. **Build** — `next build`

All steps must pass before deployment.

### Required GitHub Secrets

| Secret                                 | Description                  |
| -------------------------------------- | ---------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase project URL         |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key     |
| `SUPABASE_SECRET_KEY`                  | Supabase service-role key    |
| `DATABASE_URL`                         | PostgreSQL connection string |
| `DIRECT_URL`                           | Direct PostgreSQL connection |

---

## Backup and Restore

### Database

Supabase provides automated daily backups. For additional safety:

```sh
# Manual backup via pg_dump
pg_dump --no-owner --no-acl \
  "$DATABASE_URL" > backup-$(date +%Y%m%d-%H%M%S).sql

# Restore (creates tables, does not drop existing data)
psql "$DATABASE_URL" < backup-file.sql
```

### Storage

Supabase Storage can be backed up via the Supabase dashboard or CLI:

```sh
supabase storage download <bucket-name> --output ./backups/storage/
```

### Environment Variables

Keep a secure copy of all environment variables (e.g., in a password manager or vault). Do not commit `.env` files.

---

## Release Process

1. Create a branch from `main` for the release.
2. Run the CI pipeline locally: `npm run lint && npm run typecheck && npm run test && npm run build`.
3. Push and verify CI passes on GitHub.
4. Merge to `main`.
5. Deploy the build to production.
6. Verify health: `curl https://your-domain.com/api/health`.
7. Run smoke tests (see below).

### Versioning

Use semantic versioning (`v1.0.0`, `v1.1.0`, etc.) for releases. Tag releases in Git:

```sh
git tag v1.0.0
git push origin v1.0.0
```

---

## Rollback Procedure

1. Identify the previous known-good build.
2. Revert to the previous version:
   ```sh
   git revert HEAD
   git push origin main
   ```
3. Or redeploy the previous build from CI artifacts.
4. Verify health after rollback.
5. Investigate the cause of the failure before re-deploying.

### Database Rollback

**`prisma migrate down` is not available in Prisma 7.x.** Use one of these approaches instead.

#### Option 1: Create a reversal migration (recommended for successful migrations)

Revert `schema.prisma` to the state before the problematic migration, then create and deploy a new migration:

```sh
# 1. Revert schema.prisma in git
git checkout HEAD~1 -- prisma/schema.prisma

# 2. Create a new reversal migration
npx prisma migrate dev --create-only --name rollback_<description>

# 3. Review the generated SQL in prisma/migrations/<timestamp>_rollback_<description>/migration.sql

# 4. Deploy to production
npx prisma migrate deploy
```

#### Option 2: Recovery from a failed migration

For a migration that failed partway, generate and apply a down migration:

```sh
# 1. Generate the reversal SQL
npx prisma migrate diff \
  --from-schema prisma/schema.prisma \
  --to-migrations prisma/migrations \
  --script > down.sql

# 2. Apply it (after configuring production DB URL in prisma.config.ts)
npx prisma db execute --file down.sql

# 3. Mark the migration as rolled back
npx prisma migrate resolve --rolled-back <migration-name>
```

#### Option 3: Hotfix (manual revert)

For quick manual reverts on production:

1. Manually revert the schema changes via SQL.
2. Mark the migration as rolled back:
   ```sh
   npx prisma migrate resolve --rolled-back <migration-name>
   ```

---

## Staging Environment

Deploy to a staging environment before every production release.

### Staging Checklist

- [ ] Deploy build to staging server
- [ ] Run `npx prisma migrate deploy` against staging database
- [ ] Seed staging data (`npx prisma db seed` if applicable)
- [ ] Verify `/api/health` returns `{"status":"ok","db":"connected"}`
- [ ] Verify all CUJs on staging (login, admin, student, teacher, public)
- [ ] Verify storage uploads (upload a file, confirm it appears in Supabase Storage)
- [ ] Verify email flows (password reset email arrives)
- [ ] Verify PWA installation prompt appears on mobile Chrome
- [ ] Verify mobile responsiveness at 375px and 414px viewport widths
- [ ] Verify Sentry events arrive in dashboard
- [ ] Verify database backups are being created

## Browser Compatibility

The application targets these browsers. Test on staging before production:

| Browser       | Desktop | Mobile |
| ------------- | ------- | ------ |
| Chrome        | ✅      | ✅     |
| Safari        | ✅      | ✅     |
| Firefox       | ✅      | —      |
| Edge          | ✅      | —      |
| Samsung Internet | —    | ✅     |

Mobile Safari is particularly important since the application is a PWA that users may install via "Add to Home Screen."

## Performance Budget

Run a Lighthouse audit on staging before production:

| Check                        | Target      |
| ---------------------------- | ----------- |
| Performance score            | > 90        |
| Cumulative Layout Shift      | < 0.1       |
| Largest Contentful Paint     | < 2.5s      |
| First Input Delay            | < 100ms     |
| No hydration warnings        | Required    |
| Bundle sizes (initial JS)    | < 150 KB    |
| Images optimized             | Required    |

Automated Lighthouse CI is not required for v1.0. A manual run on staging is sufficient.

## Pre-Deployment Checklist

```sh
# Run the full validation suite locally before every deployment
npm run lint
npm run typecheck
npm run test
npm run build
npm run playwright
```

## Post-Deployment Smoke Tests

After every deployment, manually verify:

1. **Homepage loads** without console errors.
2. **Login flow** — `/login` → authenticate → redirect to role dashboard.
3. **Health endpoint** — `/api/health` returns `{"status":"ok","db":"connected"}`.
4. **Admin dashboard** — key pages render without errors.
5. **Student portal** — a test student can view their dashboard, timetable, materials.
6. **File upload** — upload a small file and verify it appears in storage.
7. **Public pages** — `/`, `/courses`, `/resources`, `/contact` render correctly.
8. **SEO metadata** — `/robots.txt`, `/sitemap.xml`, `/opengraph-image` are accessible.
9. **Favicon** — `/favicon.svg` loads in the browser tab.
10. **PWA** — the service worker is registered (`/serwist/sw.js` loads), the manifest is accessible (`/manifest.webmanifest`), and the offline page (`/offline`) is reachable.
11. **Sentry** — trigger a test error from `/sentry-example-page` (if configured) and verify it appears in the Sentry dashboard.
12. **Mobile** — test critical flows at mobile viewport width.

---

## Monitoring

### Health Checks

Configure your hosting provider to ping `/api/health` every 30–60 seconds. The endpoint:

- Returns `200` with `{"status":"ok","db":"connected"}` when healthy.
- Returns `503` with `{"status":"error","db":"disconnected"}` when the database is unreachable.

### Error Tracking

Sentry captures:

- Unhandled server exceptions (via `onRequestError` in `instrumentation.ts`)
- Client-side rendering errors (via `global-error.tsx`)
- API route errors (via `Sentry.captureException`)
- Server Action errors (via `Sentry.withServerActionInstrumentation`)

### Performance Monitoring

Sentry tracing is enabled with a `tracesSampleRate` of `0.1` (10% of requests) in production. Session Replay captures only errored sessions at full rate (`replaysOnErrorSampleRate: 1.0`).

---

## Maintenance

### Regular Tasks

- **Database**: Monitor connection pool usage. Supabase Pro plan allows 15 connections.
- **Storage**: Periodically review and clean up unused files.
- **Dependencies**: Run `npm audit` regularly. Update non-breaking dependencies with `npm update`.
- **Logs**: Monitor application logs for unusual error patterns.
- **Sentry**: Review error trends weekly. Set up alert rules for new error types.

### Quarterly Maintenance

Perform these tasks every quarter:

- **Database restore verification**: Download the latest automated backup from Supabase, restore it to a local PostgreSQL instance, and run `npx prisma migrate deploy` to verify migration compatibility. A backup is not proven useful until you have successfully restored it.
- **Storage restore verification**: Download a storage bucket backup and verify file integrity.
- **Dependency audit**: Run `npm audit` and review all `WARNING` and `CRITICAL` advisories.
- **Expired content review**: Archive outdated study materials, test papers, and announcements.
- **User accounts review**: Archive inactive student and teacher accounts.
- **Log rotation**: Verify application logs are not consuming excessive disk space.

### SSL / TLS

The application does not terminate SSL itself. Configure SSL at your reverse proxy (nginx, Caddy, Cloudflare, etc.) or hosting provider.
