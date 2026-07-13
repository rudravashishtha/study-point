# Phase 10B — Account Experience: Plan

Status: Approved (with adjustments) — proceed to implementation.
Depends on: Phase 10A (committed `8e1669d`, pushed), `src/lib/auth/permissions.ts`,
`src/features/auth/actions.ts`, `src/lib/supabase/{server,admin}.ts`, `src/proxy.ts`,
`docs/ROUTES_AND_PERMISSIONS.md`, `docs/PHASE_10_AUTH_PLAN.md`.
Last reviewed: 2026-07-13.

This plan covers the work deferred from Phase 10A: account activation, the invitation
flow, forgot/reset password, password-strength feedback, rate limiting, and authorization
hardening of existing protected pages. All implementation must pass the Quality Baseline
(format, lint, typecheck, tests, build) and a `next start` smoke check before commit, and
must stop for human review before any commit.

---

## 1. Scope (deferred from 10A)

1. **Account activation** — admin-initiated Supabase invitation wired to the Phase 4 student/teacher provisioning.
2. **Invitation flow** — `/auth/callback` PKCE exchange + mandatory password-set gate.
3. **Forgot password** — Supabase built-in email reset request.
4. **Reset password** — `/reset-password` page handling both invite set-password and recovery.
5. **Password strength** — guidance meter on set/reser password forms (advisory only; enforcement by Supabase project policy).
6. **Rate limiting** — lightweight in-memory limiter on login, forgot-password, and activation.
7. **Authorization hardening** — enforce `AppUser.status` gates on existing `/admin/*` and `/student/*` pages; confirm every server action enforces server-side checks.

Non-goals (unchanged from 10A plan): MFA, OAuth, SAML/SSO, passkeys, magic links (except
Supabase invite/reset), impersonation, API tokens, public registration.

---

## 2. Resolved Design Decisions

| #   | Area                    | Decision                                                                                                                                                                                                                                                                                |
| --- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Invitation transport    | `supabase.auth.admin.inviteUserByEmail(email, { redirectTo, data })` (service-role, server-only). PKCE is **not** used by `inviteUserByEmail` (per Supabase docs), so the invite link lands on `/auth/callback` which performs the session exchange and redirects to `/reset-password`. |
| 2   | Reset transport         | `supabase.auth.resetPasswordForEmail(email, { redirectTo: "/auth/callback?next=/reset-password" })`. `/auth/callback` calls `exchangeCodeForSession(code)` (PKCE) and 302-redirects to `next`.                                                                                          |
| 3   | Unified password page   | One `/reset-password` page handles both invite (set password) and recovery (reset password). Context is derived from session state, not URL trust.                                                                                                                                      |
| 4   | Password-set gate       | `AppUser.status` is the source of truth. `INVITED` → user must set password before portal access; on success flip to `ACTIVE`. This is the app-level gate that Supabase does not provide natively (see §3).                                                                             |
| 5   | Email enumeration       | `resetPasswordForEmail` is called, then a **generic** "Check your email" response is returned unconditionally. Never echo Supabase error details for auth emails.                                                                                                                       |
| 6   | Session rotation        | After a successful `updateUser({ password })`, call `supabase.auth.signOut({ scope: "global" })` and redirect to `/login` so the recovery/invite session cannot be reused.                                                                                                              |
| 7   | Referrer leakage        | `/reset-password` sets `Referrer-Policy: no-referrer` (route segment config).                                                                                                                                                                                                           |
| 8   | Rate limiting           | In-memory sliding-window limiter at module scope (`src/lib/rate-limit.ts`), fail-open, keyed by IP (+ target where available). No Redis initially (per 10A §8). Documented single-instance caveat below.                                                                                |
| 9   | Password strength       | Lightweight estimator (checklist: 8+ chars, upper, lower, number, symbol + strength bar). **No `zxcvbn`.** Supabase project password policy remains the enforced rule.                                                                                                                  |
| 10  | Authorization hardening | `requireRole` / `requireAdmin` gain an `INVITED` check: an authenticated user whose `AppUser.status === INVITED` is redirected to `/reset-password` before any portal data is served.                                                                                                   |

---

## 3. Security Notes (from current Supabase guidance)

- **Invite/recovery sessions are usable before password set.** Supabase issue #45210 documents
  that both `inviteUserByEmail` and `resetPasswordForEmail` establish a session as soon as the
  link is opened; the resulting JWT carries no marker distinguishing it from a normal login. The
  recommended app-side mitigation is a **mandatory password-set gate backed by app state**.
  Our `AppUser.status` (INVITED until first password set) is exactly that state, enforced at the
  authorization layer (`requireRole` redirect to `/reset-password`). This keeps the gate on the
  database source of truth, never on the JWT.
- **PKCE vs implicit.** The reset email uses `/auth/callback` (PKCE code exchange) so the recovery
  token is never present in the URL the user lands on. Invite links cannot use PKCE (Supabase
  limitation); the invite session is still gated by the `INVITED` status check above.
- **Generic responses.** Both forgot-password and activation return the same neutral message
  regardless of whether the email/account exists, to avoid enumeration.
- **Harden `/auth/callback`.** Validate `next` is a same-origin relative path (`startsWith("/")`
  and not an open redirect). Reuse the existing safe-redirect rule from `ROUTES_AND_PERMISSIONS.md`.
- **Verify before state change.** In `updatePassword`, after `updateUser({ password })` succeeds,
  re-confirm the user is still authenticated via the recovery/invitation session **and** that the
  corresponding `AppUser` exists; only then flip `INVITED`→`ACTIVE`. Never change application state
  if the session is no longer valid.

---

## 4. New Routes, Pages, Actions, Utilities

| Artifact                | Kind                                         | Access                                    | Notes                                                                                                                                            |
| ----------------------- | -------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/auth/callback`        | Route Handler (`app/auth/callback/route.ts`) | Supabase callback                         | `exchangeCodeForSession(code)`; validate `next`; redirect. Needed for reset (and future OAuth).                                                  |
| `/reset-password`       | Page (`app/(auth)/reset-password/page.tsx`)  | Authenticated via invite/recovery session | Set/reset password form + strength meter; `Referrer-Policy: no-referrer`; on success flip `INVITED`→`ACTIVE`, global signOut, redirect `/login`. |
| `activateAccounts`      | Server Action (`features/auth/actions.ts`)   | ADMIN only                                | Bulk `inviteUserByEmail` for selected students/teachers without active auth accounts; record audit; best-effort.                                 |
| `requestPasswordReset`  | Server Action (`features/auth/actions.ts`)   | Anonymous                                 | `resetPasswordForEmail`; generic response.                                                                                                       |
| `updatePassword`        | Server Action (`features/auth/actions.ts`)   | Invite/recovery session                   | `updateUser({ password })`; status flip; global signOut.                                                                                         |
| `src/lib/rate-limit.ts` | Util                                         | —                                         | In-memory sliding-window limiter, fail-open, module scope.                                                                                       |
| `PasswordStrength`      | Component (`features/auth/components/`)      | —                                         | Advisory meter for set/reset forms.                                                                                                              |

`/forgot-password` remains a thin page posting to `requestPasswordReset` (already referenced by
`proxy.ts` as an auth-entry redirect target). The existing `signIn` action is extended only by the
rate limiter.

---

## 5. Flow Sequences

### Activation (admin → student sets password)

1. Admin selects students on `/admin/students/activate` → `activateAccounts` (ADMIN-checked).
2. For each selected `AppUser` without an auth account: `inviteUserByEmail(email, { redirectTo: "/auth/callback?next=/reset-password", data: { appUserId, role } })`.
3. Student opens invite → `/auth/callback` exchanges → redirects to `/reset-password`.
4. Student submits password → `updatePassword` flips `AppUser.status` INVITED→ACTIVE, global signOut, redirect `/login`.
5. Student logs in normally; `requireRole` no longer redirects (status ACTIVE).

### Forgot password (student/teacher/admin)

1. User submits email on `/forgot-password` → `requestPasswordReset` → `resetPasswordForEmail({ redirectTo: "/auth/callback?next=/reset-password" })`; generic response.
2. User opens link → `/auth/callback` → `/reset-password`.
3. Submit new password → `updatePassword` (status already ACTIVE; no flip) → global signOut → `/login`.

---

## 6. Authorization Hardening Checklist

- [x] `requireRole` / `requireAdmin` redirect `AppUser.status === INVITED` to `/reset-password` (server-side, no client trust).
- [x] Audit every existing `/admin/*` and `/student/*` page to confirm it calls `requireAdmin` / `requireRole` (grep confirms all do).
- [x] Audit every existing Server Action that mutates data to confirm it resolves `getAppUser` and checks role/scope before the mutation.
- [x] `/reset-password` rejects when no valid invite/recovery session is present (redirect `/login` or `/forgot-password`).
- [x] `updatePassword` re-checks auth session + `AppUser` existence before flipping `INVITED`→`ACTIVE`.
- [x] `/auth/callback` hardcodes/strictly validates `next`; never trusts client-supplied absolute URLs.

---

## 7. Rate Limiting Design

`src/lib/rate-limit.ts`:

- Module-scope `Map<string, { count: number; reset: number }>` sliding window.
- `rateLimit(identifier, max, windowMs)` → `{ success, retryAfter? }`; fail-open on error.
- Used inside Server Actions (not in `proxy.ts`, to keep proxy routing-only): `signIn` (e.g. 10/15m/IP+email), `requestPasswordReset` (e.g. 5/15m/IP+email), `activateAccounts` (e.g. 20/1h/ADMIN).
- **Caveat (documented):** in-memory does not share state across serverless instances. Acceptable for the single-instance / Fluid Compute dev+small-deploy target; replace with Upstash Redis when multi-instance production scaling is confirmed. Do not block the phase on Redis.

---

## 8. Testing Strategy

- **Unit:** rate-limit window logic; `INVITED`→`ACTIVE` flip helper; safe-redirect validation for `next`.
- **Integration:** `activateAccounts` mocks `admin.auth.admin.inviteUserByEmail`; `requestPasswordReset` asserts generic response regardless of existence; `updatePassword` asserts status flip + global signOut; `/auth/callback` asserts `next` validation.
- **E2E (planned):** admin activate → invite email (mock) → set password → login; forgot → reset → login.

---

## 9. Validation Gate

- Lint, type check, unit/integration tests, production build.
- `next start` smoke: unauth `/reset-password` → redirect; invalid `next` on `/auth/callback` rejected; rate limiter returns 429 after threshold; `INVITED` user hitting `/student` → `/reset-password`.
- Mobile viewport + accessibility check for `/forgot-password` and `/reset-password`.
- Security review of `/auth/callback` and password-set gate.

---

## 10. 10B Task Order (slices, reordered per review)

The callback route is the foundation for every email-based flow; build it first so reset
and invitation can be tested end-to-end before adding protections.

- **10B.1** `/auth/callback` route handler (PKCE `exchangeCodeForSession` + safe `next`).
- **10B.2** `/reset-password` page + `updatePassword` action + `PasswordStrength` + `Referrer-Policy`.
- **10B.3** `requestPasswordReset` action + `/forgot-password` page.
- **10B.4** `activateAccounts` action (bulk + individual) + `/admin/students/activate` and student-list wiring (audit log).
- **10B.5** Password strength meter (lightweight estimator; checklist + bar) on set/reset forms.
- **10B.6** Rate limiting util (`src/lib/rate-limit.ts`) + wire into `signIn`/`requestPasswordReset`/`activateAccounts`.
- **10B.7** `INVITED` gate in `requireRole`/`requireAdmin`; authorization hardening audit of existing pages/actions; validation gate + smoke + docs update.

---

## 11. Open Questions (resolved per review)

1. Activation transport: **Approved `inviteUserByEmail`** (recommended; matches 10A decision #3, avoids a parallel invitation system).
2. Password strength: **Approved lightweight estimator** — no `zxcvbn`. Use an 8+ char checklist (uppercase, lowercase, number, symbol) plus a strength bar; Supabase enforces the real policy.
3. Activation UI: **Approved both** — bulk on `/admin/students/activate` and an individual "Activate account" action on the student list; both call the same `activateAccounts` server action.

---

## 12. Stop for Review

Stop here. Do not begin 10B implementation until this plan is reviewed and approved.
