# Performance Audit

> Phase 11B.5.1 — Baseline measurement. No code changes.

Generated: 2026-07-14

---

## 1. Build Overview

| Metric          | Value       |
| --------------- | ----------- |
| Next.js version | 16.2.10     |
| Bundler         | Turbopack   |
| Total routes    | 56          |
| Static (ISR)    | ~20         |
| Dynamic (ƒ)     | ~34         |
| SSG             | 1 (serwist) |
| Build time      | ~9.5 s      |

### Route Classification

**ISR (3600s revalidate)** — public/informational pages:
`/`, `/about`, `/admissions`, `/contact`, `/courses`, `/resources`, `/privacy`, `/terms`, `/login`, `/forgot-password`, `/reset-password`, `/session-expired`, `/offline`, `/unauthorized`, `/admin`, `/admin/questions`, `/admin/settings`

**Dynamic** — authenticated pages and data-driven routes (correct):
All admin CRUD pages, student portal, teacher portal, API routes, `/login/[role]`, `/auth/callback`.

**SSG** — serwist service worker.

---

## 2. Bundle Sizes

### Client-Side JS

| Metric                | Value     |
| --------------------- | --------- |
| Total client JS files | 88 chunks |
| Total client JS size  | ~3.3 MB   |
| Largest chunk         | 561 KB    |
| Second largest        | 332 KB    |
| Chunks > 100 KB       | ~10       |
| Average chunk         | 39 KB     |

### CSS

| Metric          | Value  |
| --------------- | ------ |
| Total CSS files | 2      |
| Total CSS size  | 129 KB |
| Main CSS chunk  | 118 KB |

### PWA (Serwist)

| Metric            | Value    |
| ----------------- | -------- |
| Precached entries | 96       |
| Precache size     | 3,487 KB |

### Server-Side JS

| Metric             | Value   |
| ------------------ | ------- |
| Total server files | 508     |
| Total server JS    | 13.7 MB |

---

## 3. Client Component Profile

| Metric                       | Value                           |
| ---------------------------- | ------------------------------- |
| Files with `"use client"`    | 118 (32.5% of 363 source files) |
| Total client component lines | 17,520                          |
| Largest client files         | 543, 542, 459, 454, 405 lines   |
| Zero-code-split components   | 0 (no lazy loading anywhere)    |

### Largest Client Components

| File                             | Lines | Notes                    |
| -------------------------------- | ----- | ------------------------ |
| `QuestionImportWizard.tsx`       | 543   | Only shown during import |
| `StudentImportWizard.tsx`        | 542   | Only shown during import |
| `FeeAssignmentPreviewDialog.tsx` | 459   | Only on explicit action  |
| `ChapterTopicBuilder.tsx`        | 454   | Builder UI               |
| `FeePlanFormDialog.tsx`          | 405   | Dialog                   |
| `HomeworkList.tsx`               | 367   | Admin listing            |
| `TestList.tsx`                   | 366   | Admin listing            |
| `BatchScheduleEditor.tsx`        | 352   | Editor                   |
| `TestFormDialog.tsx`             | 345   | Dialog                   |
| `MaterialFormDialog.tsx`         | 344   | Dialog                   |

### Key Findings

1. **No `next/dynamic` usage** — zero code-splitting. Every client component ships regardless of whether the route needs it.
2. **No `React.lazy` usage** — consistent with the above.
3. **Large dialog components are eagerly loaded** — import wizards, fee assignment preview, chapter/topic builder, all form dialogs are part of the parent route bundle.
4. **`src/app/admin/page.tsx`** (151 lines, `"use client"`) may not need to be a client component. The admin dashboard could be a server component that imports client sub-components only where interactivity is needed.

### Potentially Unnecessary Client Components

- `src/app/admin/page.tsx` — admin dashboard overview. Server component wrapper with client sub-components would be more efficient.

---

## 4. Dynamic Imports / Lazy Loading

| Pattern                  | Count |
| ------------------------ | ----- |
| `next/dynamic()`         | 0     |
| `React.lazy()`           | 0     |
| `import()` in components | 0     |

All 118 client components are **eagerly bundled** in the route they are imported from.

---

## 5. Image Loading

| Metric                 | Value                        |
| ---------------------- | ---------------------------- |
| `next/image` imports   | 0                            |
| Images in `public/`    | 2 (PWA icons: 2.8 KB, 11 KB) |
| Supabase Storage usage | Present (via direct URLs)    |

Images are served via Supabase Storage direct URLs without Next.js optimisation. No automatic:

- Responsive srcset generation
- Lazy loading (`loading=lazy`)
- Blur-up placeholders
- WebP/AVIF format negotiation

---

## 6. Font Loading

| Metric                | Value                     |
| --------------------- | ------------------------- |
| `next/font` usage     | 0                         |
| Font loading strategy | `@fontsource` CSS imports |

Fonts used:

- **Outfit** (400, 600, 700)
- **Manrope** (400, 500, 600)
- **JetBrains Mono** (400)

The `@fontsource` approach works but bypasses Next.js font optimisation:

- No automatic `font-display: swap` (depends on `@fontsource` CSS defaults)
- No automatic preloading
- No subsetting
- Potential render-blocking CSS

---

## 7. Rendering and Caching

| Metric                      | Value                                 |
| --------------------------- | ------------------------------------- |
| ISR revalidation            | Consistent 3600s (1h) on public pages |
| `export const dynamic`      | None set explicitly                   |
| Layouts with `"use client"` | 0 (all server components)             |
| Server Action files         | 15 across admin + teacher modules     |

### Observations

- **Public pages** use appropriate 1-hour ISR. Content that changes infrequently (courses, about, contact, etc.) could arguably use longer revalidation (e.g., 1 day).
- **No `force-dynamic`** export found — but all admin/student routes are correctly dynamic because they use `cookies()`, `headers()`, or `prisma` queries with session data.
- **No `force-static`** export found where it could be useful (e.g., static public pages that don't even need ISR, like privacy and terms of service).

---

## 8. Dependencies

### Largest Packages

| Package        | Disk Size |
| -------------- | --------- |
| `next`         | 169 MB    |
| `prisma`       | 41 MB     |
| `lucide-react` | 39 MB     |
| `@supabase/*`  | 9 MB      |
| `xlsx`         | 8 MB      |
| `react-dom`    | 7 MB      |
| `serwist`      | 1.4 MB    |
| `motion`       | 772 KB    |
| `react`        | 252 KB    |

**Total `node_modules`**: 1.2 GB

---

## 9. PWA / Service Worker

| Metric            | Value                |
| ----------------- | -------------------- |
| Precached entries | 96                   |
| Precache size     | 3.4 MB               |
| Bundler           | Serwist with esbuild |

The service worker precache includes the full application shell. 3.4 MB is reasonable for a full SPA-like installation but could be reduced with better scope configuration.

---

## 10. Bottlenecks (Prioritised)

### Critical

1. **No code-splitting** — every dialog, wizard, and complex editor is eagerly loaded on every page in its route group. `next/dynamic` would allow lazy-loading of the largest components on explicit user action.
2. **0 `next/image` usage** — images served from Supabase without responsive sizing. Should investigate whether this is actually a problem (are there many images?).

### High

3. **0 `next/font` usage** — fonts loaded via `@fontsource` CSS without Next.js optimisation. Should measure actual render-blocking impact.
4. **`src/app/admin/page.tsx`** marked as client when it likely doesn't need to be.
5. **No bundle analysis in CI** — cannot track size regressions.

### Medium

6. **Admin dashboard is client-side** — could be server component wrapping client sub-components.
7. **Public page revalidation** — privacy, terms, and other rarely-changed pages could use longer ISR or static generation.
8. **Large CSS bundle** (118 KB) — check for unused Tailwind classes.

### Low

9. **Largest chunk 561 KB** — investigate what's in it and whether it can be split.
10. **Serwist precache 3.4 MB** — could be trimmed if scope is narrowed.

---

## 11. Estimated Impact

| Optimisation                      | Est. Improvement                        | Effort          |
| --------------------------------- | --------------------------------------- | --------------- |
| `next/dynamic` for import wizards | ~20-30% reduction on admin JS           | Low (2 files)   |
| `next/dynamic` for large dialogs  | ~10-15% on admin listing pages          | Low (6-8 files) |
| `next/font` migration             | FOUT reduction, ~5% perf improvement    | Low (1 file)    |
| `next/image` adoption             | Variable — depends on image count       | Medium          |
| Admin page server component       | ~0.5% improvement, mostly architectural | Low (1 file)    |

---

## 12. Current Performance Score (Estimated)

Without live Lighthouse data from a deployed URL:

- **Public pages**: Likely 85-95 on Performance. Simple static content, but fonts and no image optimisation may cost points.
- **Admin pages**: Likely 60-75 on Performance due to large JS bundles from eager-loaded components.
- **Accessibility**: 100 (after Phase 11B.4)
- **Best Practices**: Likely 90-95
- **SEO**: Likely 100

> **Recommendation**: Deploy to a staging environment and run Lighthouse CI to get accurate baseline scores before making any optimisation.
