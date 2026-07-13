# Phase 10 — Authentication & Account Experience: Plan

Status: Phase 10A complete (commit 8e1669d, pushed); Phase 10B planned / not started.
Depends on: Phase 9A (complete, pushed), existing `src/lib/auth/permissions.ts`, `src/lib/supabase/*`, `docs/ROUTES_AND_PERMISSIONS.md`.
Last reviewed: 2026-07-13.

This phase delivers a polished, secure, cohesive authentication experience. It is a **planning +
implementation** phase but is sliced so no auth code is written until the structure below is
approved. All implementation must pass the Quality Baseline (format, lint, typecheck, tests, build)
and a production `next start` smoke check before commit.

---

## 1. Resolved Decisions (from stakeholder)

| #   | Decision                      | Choice                                                                                                                                                                                                                                |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Roles                         | `ADMIN` / `TEACHER` / `STUDENT` only. **No `SUPER_ADMIN`** (single institute).                                                                                                                                                        |
| 2   | Login architecture            | **Shared login component, themed per entry point**. URLs: `/login`, `/login/student`, `/login/teacher`, `/login/admin`. Role in URL is **visual only**; server determines role after auth and redirects.                              |
| 3   | First-time student activation | **Supabase invitation email**. Admin creates/imports → activates → Supabase invites → student sets password → lands in portal. No manual password distribution.                                                                       |
| 4   | Forgot / reset password       | **Supabase built-in email reset flow**. No custom reset infra.                                                                                                                                                                        |
| 5   | Session strategy              | **Supabase SSR session cookies** (reuse existing `@supabase/ssr` setup). No custom refresh logic.                                                                                                                                     |
| 6   | Logout                        | **Server Action / Route Handler** — sign out, clear cookies, redirect `/login`.                                                                                                                                                       |
| 7   | Unauthorized states           | Dedicated pages: `/login`, `/unauthorized`, `/forbidden` (optional), `/session-expired` (recommended).                                                                                                                                |
| 8   | Rate limiting                 | **Supabase built-in email limits + lightweight route-level limiter** on login, forgot-password, activation. No Redis initially.                                                                                                       |
| 9   | Visual language               | **Per-role theming on one shared component**. Student = welcoming/academic; Teacher = professional; Admin = premium dashboard.                                                                                                        |
| 10  | Scope guardrails              | MFA, OAuth, SAML/SSO, passkeys, magic links (except Supabase invite/reset), device management, session history, login notifications, trusted devices, impersonation, API tokens, public sign-up, social login — **all out of scope**. |

Additional in-scope items requested: role-aware middleware, auto-redirect from `/login` when
authenticated, beautiful loading/transition states, consistent auth layout with subtle animation
matching the premium public site, password strength indicator during activation/reset, and clear
empty/error/success states for activation, reset, expired links, and invalid tokens.

---

## 2. Auth Architecture — Reuse Map

Reuse, do not rebuild:

| Existing                         | Reuse for                                                                                                                              |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/auth/permissions.ts`    | `getAuthUser`, `getAppUser`, `requireAuth`, `requireAppUser`, `requireRole`, `requireAdmin` as the server-side authorization boundary. |
| `src/lib/supabase/server.ts`     | Server client (cookie-based) for all Server Components / Actions / Route Handlers.                                                     |
| `src/lib/supabase/client.ts`     | Browser client for client-side auth UI feedback only.                                                                                  |
| `src/lib/supabase/admin.ts`      | **Service-role** client for account invitation/activation (`inviteUserByEmail`). Never expose; server-only.                            |
| `src/proxy.ts`                   | Session refresh + coarse role-aware guards — extended in place (see §9); Next 16 uses `proxy.ts` as the Middleware file.               |
| `docs/ROUTES_AND_PERMISSIONS.md` | Authoritative route/permission matrix; this plan extends it (§4, §11).                                                                 |

**Authoritative role source:** the database `AppUser.role` (via `getAppUser`). The Supabase JWT
`app_metadata.role` is used **only for coarse middleware routing** and must be set at activation and
kept in sync. Fine-grained authorization always uses `getAppUser`/DB.

---

## 3. Login Flow (shared component, themed)

- Single `LoginForm` client component.
- Route segment (`/login/student | /teacher | /admin`, or `/login` default) selects a **theme only**
  (palette, copy, illustration). It does **not** restrict which account may authenticate.
- Submit → Server Action `signInWithPassword(email, password)` via server client.
- On success, server reads `app_metadata.role` and redirects (§10).
- On failure, show safe error ("Invalid email or password"), never reveal which field.
- Includes: password show/hide, submit disabled + spinner (loading state), accessible labels,
  focus management, and a link to `/forgot-password`.

---

## 4. Routes & URL Plan

Auth route group `src/app/(auth)/`:

| Route                              | Access                         | Purpose                                                                                                |
| ---------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `/(auth)/login/page.tsx`           | Anonymous (redirect if authed) | Default login (neutral theme).                                                                         |
| `/(auth)/login/[role]/page.tsx`    | Anonymous                      | Themed login for `student`/`teacher`/`admin` (theme only). Invalid role → 404/redirect `/login`.       |
| `/(auth)/forgot-password/page.tsx` | Anonymous                      | Request reset email.                                                                                   |
| `/(auth)/reset-password/page.tsx`  | Token/session                  | Set new password (handles both reset **and** Supabase invitation). Shows expired/invalid token states. |
| `/(auth)/session-expired/page.tsx` | Any                            | Shown when middleware detects expired/invalid session.                                                 |
| `/unauthorized/page.tsx`           | Any                            | Generic access denied (also used by `requireRole`).                                                    |
| `/forbidden/page.tsx`              | Any                            | Optional explicit forbidden state.                                                                     |

Existing `/(auth)/layout.tsx` hosts the shared auth visual language and theme context.

Note: `ROUTES_AND_PERMISSIONS.md` lists `/auth/callback` and `/logout` as routes. We implement:

- `/logout` as a Server Action (and optionally a Route Handler for non-form contexts).
- Supabase callback handling via the configured redirect URL (typically `/reset-password` for
  invite/reset, or `/auth/callback` if route-based callback is preferred). Decision below (§7/§12).

---

## 5. First-Time Student Account Activation (Supabase invitation)

Server-side (admin context, service-role client):

1. Admin creates/imports student (`AppUser` row created with `status = INVITED` or `PENDING`, no password).
2. Admin activates (`/admin/students/activate` or per-student action) → Server Action:

- Calls `supabase.auth.admin.inviteUserByEmail(email, { data: { role: "STUDENT" }, redirectTo: <appUrl>/reset-password })`.
- Sets `app_metadata.role = "STUDENT"` on the Supabase user.
- Links `AppUser.supabaseAuthUserId`; sets `AppUser.status = "ACTIVE"` only after the user confirms? Decide: set ACTIVE on invite sent, or on first password set. **Recommended:** `INVITED` until the user completes invite; `ACTIVE` after first successful `updateUser`. Audit log the activation.

3. Student receives invitation email → sets password via `/reset-password` (Supabase invite reuses the update-password flow).
4. On password set, redirect to `/student` (or `/session-expired` if token stale).

This reuses `src/lib/supabase/admin.ts`. No manual passwords are ever distributed.

---

## 6. Forgot / Reset Password (Supabase built-in)

- `/forgot-password` → Server Action `resetPasswordForEmail(email, { redirectTo: <appUrl>/reset-password })`.
- `/reset-password` → Server Action `updateUser({ password })`; show password strength indicator; on success redirect to role portal and show success state; on invalid/expired token show error state with "request new link".
- Rate-limited (§8).

---

## 7. Session Management & Cookies

- Reuse Supabase SSR cookies (`@supabase/ssr`). Confirm cookie attributes in production:
  `httpOnly`, `secure` (prod only), `sameSite: "lax"`, `path: "/"`. `@supabase/ssr` sets these by default; verify in `server.ts`/middleware.
- No custom refresh logic. Session refresh happens in `proxy.ts` via `supabase.auth.getUser()`.
- Detect expired/invalid session in middleware → redirect to `/session-expired` (or `/login` if no session).

---

## 8. Rate Limiting (lightweight, no Redis)

- New `src/lib/rate-limit.ts`: in-memory sliding-window keyed by `ip:route` (acceptable for single-instance/dev; note serverless limitation).
- Apply to: login Server Action, forgot-password Server Action, activation Server Action.
- Return `429` / friendly message when exceeded. Document the serverless caveat; upgrade to Upstash/Redis only if multi-instance is later required.
- Supabase's own email-send limits remain the primary protection for email-based flows.

---

## 9. Role-Aware Middleware (security-critical)

**Convention:** Next.js 16 uses `src/proxy.ts` as the Middleware/proxy file (the function is
exported as `proxy`); `src/proxy.ts` already exists and is the correct location. Extend it with
guards — do **not** rename to `middleware.ts`. It runs automatically (build output shows `ƒ Proxy`).

Middleware responsibilities (edge-safe, no DB):

1. Refresh session: `supabase.auth.getUser()`.
2. Coarse route protection by reading `session.user.app_metadata.role`:

- `/admin/*` → require authenticated + `role == ADMIN`, else redirect `/login` (or `/unauthorized` if authed wrong role).
- `/student/*` → require authenticated + `role == STUDENT`.
- `/teacher/*` → require authenticated + `role == TEACHER` (teacher portal deferred → placeholder, §11).
- `/login*`, `/forgot-password`, `/reset-password` → if authenticated, redirect to role portal (auto-redirect).

3. Expired/invalid session → `/session-expired`.
4. **Never** trust client-supplied role; middleware uses only the verified JWT claim for routing.

Fine-grained authorization (ownership, batch scope, permission presets) stays in Server Components /
Server Actions via `getAppUser` + `requireRole` + `src/server/auth/*`. Middleware is a coarse gate only.

---

## 10. Post-Login Redirect Map

| Role    | Redirect target                                               |
| ------- | ------------------------------------------------------------- |
| STUDENT | `/student`                                                    |
| TEACHER | `/teacher` (placeholder until teacher portal built — see §11) |
| ADMIN   | `/admin`                                                      |

If a user hits a portal they are not authorized for, middleware redirects them to their own portal
root (preferred) or `/unauthorized`.

---

## 11. Integration With Existing Portals & Teacher Deferral

- **Audit existing protected pages**: verify every `/admin/*` and `/student/*` page (and API route
  handlers) actually calls `requireAdmin()` / role + ownership checks. Some may currently rely only
  on UI or be unprotected. Harden as part of this phase (use existing helpers; no new auth logic).
- **Teacher portal deferred** (per `ROUTES_AND_PERMISSIONS.md`). For Phase 10, `TEACHER` login works
  and authenticates, but the destination is a minimal `/teacher` placeholder page ("Portal coming
  soon") until teacher routes are approved. Themed login + activation still supported.
- Student/Admin portals already exist as route groups; this phase wires auth around them.

---

## 12. Visual Language (cohesive auth experience)

- `/(auth)/layout.tsx`: shared shell — consistent with the premium public site (same Tailwind tokens,
  `@fontsource` fonts, spacing/radius). Subtle entrance animations (respect `prefers-reduced-motion`).
- Theme provider keyed by route segment: `student` (soft academic palette, welcoming copy),
  `teacher` (professional), `admin` (premium dashboard aesthetic). One component, three atmospheres.
- `PasswordStrength` component (zxcvbn or a lightweight estimator) shown during activation/reset.
- Unified states: loading (spinner + disabled), error (inline, safe), success (toast/redirect),
  empty (no session), expired/invalid token.
- Mobile-first: single-column, thumb-friendly actions, no hover-only controls, accessible focus.

---

## 13. Security Review Checklist

- [ ] Cookies `httpOnly`+`secure`(prod)+`sameSite=lax`; verify in `server.ts`/middleware.
- [ ] CSRF: rely on Next Server Actions same-origin protections + SameSite cookies; no custom tokens needed for Actions. Confirm no state-changing GETs.
- [ ] Session expiry handled in middleware → `/session-expired`.
- [ ] Safe redirects only to same-origin relative paths or approved app URL (per `ROUTES_AND_PERMISSIONS.md` §Safe Redirect Rules). Never redirect to arbitrary user-supplied absolute URLs.
- [ ] Rate limiting on login/forgot-password/activation (§8).
- [ ] Service-role key used **only** in `src/lib/supabase/admin.ts`, server-only; never shipped to client; never logged.
- [ ] Invitation/reset tokens: handled by Supabase; we only render safe error states for invalid/expired.
- [ ] No client-supplied role/ownership trusted anywhere; all checks server-side via `getAppUser`.
- [ ] Passwords: enforcement by Supabase project policy; UI strength indicator is guidance only.

---

## 14. Testing Strategy

- **Unit:** `permissions.ts` helpers (already tested — extend for role/redirect edge cases);
  `rate-limit.ts` (window expiry, keying); redirect-target safety validator.
- **Integration:** login success/failure; forgot-password request; reset/invite password set;
  activation invitation send (mock service-role client); middleware guard logic (mock session).
- **E2E (Playwright):** admin login → dashboard; student invite → activate → login → portal;
  wrong-role redirect; expired session → `/session-expired`; logout → `/login`; auto-redirect from
  `/login` when authenticated.

---

## 15. Implementation Sub-Slices (ordered)

- **10A — Auth foundation:** `proxy.ts` (session refresh + coarse guards), login Server Action,
  `/(auth)/layout.tsx`, `/(auth)/login` (+ `[role]` themes), `/unauthorized`, `/logout` action.
  Verify login works for existing admin/student accounts.
- **10B — Activation & password recovery:** admin activation Server Action (Supabase invite),
  `/forgot-password`, `/reset-password` (handles invite + reset), password strength UI, expired/invalid
  token states, rate limiter on login/forgot/activation.
- **10C — Hardening & polish:** audit + harden existing `/admin` & `/student` pages; `/forbidden`,
  `/session-expired`; auto-redirect from `/login`; loading/transition/empty/error/success states;
  teacher placeholder; final security review; E2E suite.

Each sub-slice passes the Quality Baseline and a `next start` smoke check before commit.

---

## 16. Files (create / modify)

Create:

- (none — `proxy.ts` already exists and is extended in place)
- `src/lib/rate-limit.ts`
- `src/app/(auth)/layout.tsx`
- `src/app/(auth)/login/page.tsx`, `src/app/(auth)/login/[role]/page.tsx`
- `src/app/(auth)/forgot-password/page.tsx`
- `src/app/(auth)/reset-password/page.tsx`
- `src/app/(auth)/session-expired/page.tsx`
- `src/app/(auth)/_components/LoginForm.tsx`, `PasswordStrength.tsx`, theme config
- `src/features/auth/actions/*.ts` (signIn, signOut, forgotPassword, resetPassword, invite/activate)
- `/unauthorized/page.tsx`, `/forbidden/page.tsx`
- `src/app/teacher/page.tsx` (placeholder)
- Tests under `src/features/auth/...` and `src/lib/...`

Modify:

- `src/proxy.ts` extended with session refresh + coarse role-aware guards
- `src/lib/supabase/server.ts` / `client.ts` (verify cookie attrs; minor)
- `src/lib/supabase/admin.ts` (ensure `inviteUserByEmail` + `app_metadata.role`)
- `src/server/services/*` or `src/features/students/*` (wire activation Server Action)
- Existing `/admin/*` and `/student/*` pages (add `requireAdmin()` / role+ownership checks where missing)
- `docs/ROUTES_AND_PERMISSIONS.md` (record new routes/pages, middleware behaviour)
- `docs/IMPLEMENTATION_PLAN.md` (mark Phase 10 status)

---

## 17. Out of Scope (per stakeholder)

MFA, OAuth (Google/Microsoft/GitHub/etc.), SAML, enterprise SSO, passkeys/WebAuthn, magic links
(except Supabase invite/reset), device management, session history, login notifications, trusted
devices, impersonation, API tokens, public registration/sign-up, social login, multi-tenant auth,
organization switching.

---

## 18. Open Sub-Decisions — RESOLVED

All four resolved by stakeholder (approved recommended options):

1. **Supabase redirect target for invite/reset:** `/reset-password` (unifies invite + reset; page
   distinguishes context from session/token state).
2. **`AppUser.status` lifecycle on invite:** `INVITED` until first successful password set, then `ACTIVE`.
3. **Wrong-role behaviour:** redirect to the user's own portal root (e.g. student on `/admin` → `/student`).
   `/unauthorized` reserved for genuinely-no-destination / no-permission cases.
4. **Teacher destination:** `/teacher` placeholder ("Coming Soon"); teacher auth fully functional.

**10A status (Complete — commit 8e1669d):** `proxy.ts` extended (session refresh +
coarse role-aware guards, no DB authz); shared auth layout + themed `/login` and `/login/[role]`;
server-side `signIn` (syncs JWT `role` claim from `AppUser`, role-aware redirect) and `signOut`;
`/unauthorized`, `/session-expired`, `/teacher` placeholder; logout wired into `AdminShell` and
`StudentShell`. Out of scope for 10A (deferred to 10B): account activation, invitation flow, forgot password, reset
password, password strength, rate limiting, and authorization hardening of existing `/admin/*` and
`/student/*` pages (permission helpers already exist).
