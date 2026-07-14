# Rendering & Caching Audit

> Phase 11B.5.3 — Mechanical audit. No code changes.

Generated: 2026-07-14

---

## 1. Rendering Strategy by Route Group

### 1a. Public Pages (`/`, `/about`, `/courses`, etc.)

| Page                                                                 | Config              | Effective      | Correct?           |
| -------------------------------------------------------------------- | ------------------- | -------------- | ------------------ |
| Home, About, Courses, Contact, Admissions, Resources, Privacy, Terms | `revalidate = 3600` | ISR (1h)       | ✅                 |
| Announcements                                                        | `force-dynamic`     | Always dynamic | ⚠️ (see Finding 1) |

**Good**: Consistent 1-hour ISR on all public content pages. Correct for infrequently changing content.

### 1b. Auth Pages (`/login`, `/forgot-password`, `/reset-password`)

| Page                                  | Config               | Effective | Correct? |
| ------------------------------------- | -------------------- | --------- | -------- |
| `/login`                              | None                 | Static    | ✅       |
| `/login/[role]`                       | None (uses `params`) | Dynamic   | ✅       |
| `/forgot-password`, `/reset-password` | None                 | Static    | ✅       |

**Good**: Auth pages correctly static where appropriate.

### 1c. Admin Pages (`/admin/*`)

All admin pages are **implicitly dynamic** via `requireAdmin()` → `cookies()` in the Supabase server client. This is correct — admin data must be fresh per request.

| Page                                            | Explicit Config             | Effective      | Correct?                 |
| ----------------------------------------------- | --------------------------- | -------------- | ------------------------ |
| Dashboard, Students, Batches, Tests, etc. (15+) | None                        | Dynamic (auth) | ✅                       |
| `imports/*`, `students/activate`                | `force-dynamic` (redundant) | Dynamic        | ⚠️ (Finding 2)           |
| `questions`, `settings`                         | None                        | Static         | ❌ (Bug — see Finding 3) |

### 1d. Student & Teacher Pages

All correctly dynamic via `requireRole()` → `cookies()`.

---

## 2. Bugs Found

### Bug 1 (MEDIUM): Public announcements use `force-dynamic`

**File**: `src/app/(public)/announcements/page.tsx`

Public announcements are publicly visible, serve many users, and change infrequently. Using `force-dynamic` means every visitor causes a full server render + database query.

**Recommendation**: Replace with `export const revalidate = 120` (2-minute ISR) or similar short interval.

### Bug 2 (LOW): Redundant `force-dynamic` on 4 pages

**Files**:

- `admin/imports/page.tsx`
- `admin/imports/students/page.tsx`
- `admin/imports/questions/page.tsx`
- `admin/students/activate/page.tsx`

All already call `requireAdmin()` which uses `cookies()` → implicit dynamic. The explicit directive is redundant. Not harmful, but obscures intent.

**Recommendation**: Remove the redundant `force-dynamic` exports, or add a comment explaining why it's intentional.

### Bug 3 (MEDIUM): `admin/teachers/page.tsx` — `searchParams` not awaited

**File**: `src/app/admin/teachers/page.tsx`

In Next.js 15+, `searchParams` is a Promise. The teachers page accesses it synchronously:

```tsx
const q = searchParams.q || "";
```

This will return `undefined` at runtime because `searchParams` is a Promise, not an object.

All other admin list pages correctly use:

```tsx
const resolvedParams = await searchParams;
```

**Recommendation**: Fix to match the pattern used everywhere else.

---

## 3. Auth Protection Gaps

### Gap 1 (HIGH): No middleware exists

No `src/middleware.ts`. All route protection is page-level. If any page forgets to call its auth guard, the route is unprotected.

### Gap 2 (HIGH): Admin pages missing auth calls

**Files**:

- `src/app/admin/page.tsx` — Admin dashboard has zero auth checks
- `src/app/admin/questions/page.tsx` — Placeholder, no auth
- `src/app/admin/settings/page.tsx` — Placeholder, no auth

Currently harmless (render only placeholder data), but will become security bugs when real data is added.

---

## 4. Caching Analysis

### 4a. Cache Invalidation Coverage

| Mechanism                                | Count                       | Assessment                                |
| ---------------------------------------- | --------------------------- | ----------------------------------------- |
| `revalidatePath` in Server Actions       | ~100+ calls across 18 files | ✅ Complete coverage                      |
| `revalidateTag`                          | 0                           | ⚠️ Could improve public page invalidation |
| `export const revalidate`                | 8 pages (value: 3600)       | ✅ Consistent                             |
| `export const dynamic = "force-dynamic"` | 5 pages                     | ⚠️ 4 redundant, 1 questionable            |

### 4b. Missing: Public pages not invalidated after admin edits

When admin updates site settings, announcements, or teacher profile, `revalidatePath()` invalidates **only the admin path**. Public pages (`/`, `/about`, `/contact`, etc.) continue serving stale data until their 1-hour ISR timer expires.

**Impact**: Admin edits to public-facing content take up to 1 hour to appear on the public site.

**Recommendation**: Add `revalidatePath` for relevant public routes in mutation actions for site settings, announcements, and teacher profile updates.

### 4c. No `supabase.auth.getUser()` deduplication

`getAuthUser()` is called on every authenticated request via `requireAdmin()` / `requireRole()`. Within a single page render that calls multiple service functions, the auth check may run multiple times. Each call hits Supabase's API.

**Impact**: Minor per-request overhead. Each call is a lightweight HTTP request.

**Recommendation**: Wrap `getAuthUser()` with `react.cache()` to deduplicate within a single render pass.

### 4d. PublicShell Prisma query has no caching strategy

**File**: `src/components/public/PublicShell.tsx`

The public layout shell calls `getSiteSettings()` via Prisma on every render. This query is either:

- Executed once at build time (if the route is fully static), freezing site settings until redeployment
- Executed on every request (if any sibling page uses a dynamic API), with no caching

There is no middle ground like ISR would provide with `fetch()`-based caching.

**Recommendation**: Wrap `getSiteSettings()` with React's `cache()` and add time-based revalidation, or consider using `unstable_cache()` if data staleness guidance is acceptable.

---

## 5. What's Working Well

1. **All layouts are server components** — No dynamic-forcing in layouts.
2. **Server Actions properly invalidate** — Every mutation calls `revalidatePath()`.
3. **Auth is correctly never cached** — `supabase.auth.getUser()` runs fresh per request.
4. **Admin pages correctly dynamic** — Auth-required pages should not be cached.
5. **Public page ISR is consistent** — All content pages use 3600s revalidation.
6. **No accidental `cookies()`/`headers()` in layouts** — The Supabase server client is only called in page components, never in layout render paths.
7. **No `noStore()` misuse** — Zero uses in the codebase.
8. **Static pages are truly static** — Login, forgot-password, reset-password, session-expired, unauthorized, offline pages generate zero dynamic overhead.

---

## 6. Prioritized Recommendations

### Must Fix Before Production

| Priority | Item                                                                                            | Effort |
| -------- | ----------------------------------------------------------------------------------------------- | ------ |
| HIGH     | Add middleware protecting `/admin/*`, `/student/*`, `/teacher/*`                                | Low    |
| HIGH     | Add `requireAdmin()` to `admin/page.tsx`, `admin/questions/page.tsx`, `admin/settings/page.tsx` | Low    |
| HIGH     | Fix `searchParams` in `admin/teachers/page.tsx`                                                 | Low    |

### Should Fix Before Production

| Priority | Item                                                                                                               | Effort |
| -------- | ------------------------------------------------------------------------------------------------------------------ | ------ |
| MEDIUM   | Change public announcements from `force-dynamic` to `revalidate = 120`                                             | Low    |
| MEDIUM   | Add `revalidatePath('/')` + other public paths in site settings, announcements, and teacher profile Server Actions | Low    |
| MEDIUM   | Wrap `getSiteSettings()` in PublicShell with caching strategy                                                      | Low    |
| LOW      | Remove redundant `force-dynamic` from 4 admin pages                                                                | Low    |
| LOW      | Wrap `getAuthUser()` with `react.cache()` for per-request dedup                                                    | Low    |

### Future Considerations

| Priority | Item                                                        | Effort |
| -------- | ----------------------------------------------------------- | ------ |
| LOW      | Investigate `revalidateTag` for granular cache invalidation | Medium |
| LOW      | Consider stale-while-revalidate pattern for public data     | Medium |
