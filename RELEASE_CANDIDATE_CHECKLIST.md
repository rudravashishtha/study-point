# Release Candidate Checklist

> Feature freeze in effect. No new features, abstractions, dependencies, or UI redesigns.
> Bug fixes only from this point forward.

## Freeze Rules

### Allowed
- Bug fixes
- Documentation updates
- Production configuration changes
- Accessibility fixes

### Not Allowed
- New features
- New dependencies
- Architectural changes
- Design changes (beyond minor copy/alignment)
- Refactors
- New components or abstractions

---

## Core Gates

| Gate                      | Status |
| ------------------------- | ------ |
| Architecture Refactor     | PASS   |
| Operational Readiness     | PASS   |
| Bug Bash                  | PASS   |
| Navigation Audit          | PASS   |
| Route Discoverability     | PASS   |
| Teacher Dashboard         | PASS   |

---

## Build & Code Quality

| Check          | Status |
| -------------- | ------ |
| TypeScript     | PASS   |
| Lint           | PASS   |
| Production Build | PASS |

---

## Tests

| Suite                            | Status   |
| -------------------------------- | -------- |
| CUJ-1 Authentication Lifecycle   | 11/11 ✅ |
| CUJ-2-9 Admin Workflows          | 1/1 ✅   |
| CUJ-10 Public Enquiry Flow       | 8/8 ✅   |
| **Total Playwright**             | **22/22** ✅ |

---

## Product

| Area              | Status |
| ----------------- | ------ |
| Public Website    | PASS   |
| Admin Portal      | PASS   |
| Student Portal    | PASS   |
| Teacher Portal    | PASS   |
| Authentication    | PASS   |
| Role Routing      | PASS   |
| Session Handling  | PASS   |
| PWA               | PASS   |
| SEO               | PASS   |
| Monitoring (Sentry) | PASS |

---

## Operational

| Area                       | Status |
| -------------------------- | ------ |
| Environment Variables      | PASS   |
| `.env.example`             | PASS   |
| Supabase Configuration     | PASS   |
| Storage Configuration      | PASS   |
| Error Boundaries           | PASS   |
| Offline Fallback           | PASS   |
| Service Worker             | PASS   |
| CI Workflow                | PASS   |
| Deployment Documentation   | PASS   |

---

## Deferred Items (Intentionally Outside Scope)

| Item                          | Reason                |
| ----------------------------- | --------------------- |
| Home page content sections    | Staged for next phase |
| Public resource search        | Staged for next phase |

---

## Release Status

**RELEASE CANDIDATE APPROVED**

| Area                         | Status    |
| ---------------------------- | --------- |
| Architecture Refactor        | PASS      |
| Operational Readiness        | PASS      |
| Bug Bash                     | PASS      |
| Critical User Journeys       | 10/10 ✅  |
| Playwright                   | 22/22 ✅  |
| Production Build             | PASS      |
| TypeScript                   | PASS      |
| Lint                         | PASS      |
| PWA                          | PASS      |
| SEO                          | PASS      |
| Monitoring (Sentry)          | PASS      |
| CI/CD                        | PASS      |
| Accessiblity                 | PASS      |
| Authentication               | PASS      |
| Navigation & Discoverability | PASS      |
| Documentation                | PASS      |
| **Release Candidate**        | **APPROVED** |

## Pre-Tag Checklist

Before tagging the RC:

1. Fresh clone: `git clone <url> && cd study-point && npm ci`
2. Build: `npm run build`
3. Lint: `npm run lint`
4. TypeScript: `npm run typecheck`
5. Playwright: `npm run playwright`
6. Seed data: `npx prisma db seed`
7. Production env validation
8. PWA install test on mobile
9. Mobile viewport smoke test of all portals
10. Deployment dry run to staging
