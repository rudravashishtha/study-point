# Phase 9A Design Document — Public Website

**Phase:** 9A — Public Website (Core Pages)
**Status:** Approved (with refinements)
**Date:** 2026-07-12

---

## 1. Scope

### In Scope (Phase 9A)

| Page               | Route            | Purpose                                                                                                     |
| ------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------- |
| Home               | `/`              | Institute identity, teacher intro, methodology highlights, current batch info, CTA, WhatsApp, contact       |
| About the Teacher  | `/about`         | Photo, qualifications, experience, teaching philosophy, subjects/classes taught                             |
| Courses            | `/courses`       | Board/programme grouped: Class IX, X, XI, XII — syllabus, batch info, teaching approach, fee display toggle |
| Resources          | `/resources`     | Public study materials: PDFs, formula sheets, sample papers, previous-year papers                           |
| Announcements      | `/announcements` | Public notices (already implemented in Phase 7C)                                                            |
| Contact            | `/contact`       | Phone, WhatsApp, address, landmark, map, directions, opening hours, pre-filled WhatsApp message             |
| Admissions Enquiry | `/admissions`    | Simple form (name, phone, class, board, message) → WhatsApp redirect                                        |

### Out of Scope (Deferred)

- Blog / Articles section
- Online payment gateway
- Parent portal
- Attendance system
- Student performance analytics / progress reports
- Online examination platform
- Generic CMS / page builder
- Multi-branch management
- Newsletter / email capture
- Gallery (optional — only if content exists)
- Testimonials carousel (if no published testimonials)
- Results & Achievements section (if no published results)

---

## 2. Existing Assets to Reuse

| Domain            | Service / Model                                     | Usage                                              |
| ----------------- | --------------------------------------------------- | -------------------------------------------------- |
| Academic Sessions | `AcademicSession` model, `listAcademicSessions`     | Current session for batch display                  |
| Curriculum        | `CurriculumTrack`, `Board`, `Subject`, `ClassLevel` | Course grouping, display names                     |
| Fee Plans         | `FeePlan`, `FeePlanInstallment`                     | Public fee display (configurable per course/batch) |
| Study Materials   | `StudyMaterial`, `FileAsset`                        | Public resources (visibility = `CURRICULUM_TRACK`) |
| Announcements     | `Announcement`, `listPublicAnnouncements`           | `/announcements` page (already live)               |
| Contact Info      | `SiteSettings` (to be created)                      | Phone, WhatsApp, address, map, hours               |
| Teacher Profile   | `Teacher` model                                     | About page photo, qualifications, philosophy       |

### New Models Needed

| Model               | Purpose                                                                                |
| ------------------- | -------------------------------------------------------------------------------------- |
| `SiteSettings`      | Singleton: institute name, tagline, contact, map, WhatsApp, social links, SEO defaults |
| `AdmissionsEnquiry` | Log form submissions before WhatsApp redirect (best-effort)                            |
| `PublicResource`    | Already covered by `StudyMaterial` with `visibility: CURRICULUM_TRACK`                 |

---

## 3. Rendering Strategy

| Page             | Strategy                            | Rationale                                                                          |
| ---------------- | ----------------------------------- | ---------------------------------------------------------------------------------- |
| `/` (Home)       | **Static (ISR)** `revalidate: 3600` | Mostly stable; refresh hourly for batch/announcement changes                       |
| `/about`         | **Static (ISR)** `revalidate: 3600` | Teacher profile rarely changes                                                     |
| `/courses`       | **Static (ISR)** `revalidate: 3600` | Curriculum structure stable; fee display toggles via settings                      |
| `/resources`     | **Static (ISR)** `revalidate: 3600` | Public materials don't need second-by-second freshness; `revalidatePath` on change |
| `/announcements` | **Dynamic** `force-dynamic`         | Already implemented; fresh data required                                           |
| `/contact`       | **Static (ISR)** `revalidate: 3600` | Contact info changes rarely; WhatsApp/map are deterministic                        |
| `/admissions`    | **Static (ISR)** `revalidate: 3600` | Form is static; submission is client-side WhatsApp redirect                        |

**Note:** All public pages use **Server Components** by default. Client components only for interactive elements (WhatsApp buttons, form submission, map).

---

## 4. Information Architecture

```
/
├── About (/about)
├── Courses (/courses)
│   ├── Class IX
│   ├── Class X
│   ├── Class XI
│   └── Class XII
├── Resources (/resources)
├── Announcements (/announcements)
├── Contact (/contact)
└── Admissions (/admissions)
```

**Navigation:** Header with logo, primary nav (About, Courses, Resources, Announcements, Contact), WhatsApp CTA button. Footer with institute details, map link, social, quick links.

---

## 5. Component Strategy

### New Reusable Components (Public)

| Component          | Location                      | Purpose                                                                 |
| ------------------ | ----------------------------- | ----------------------------------------------------------------------- |
| `PublicHeader`     | `components/public/`          | Logo, nav, WhatsApp CTA                                                 |
| `PublicFooter`     | `components/public/`          | Contact, map, social, quick links                                       |
| `HeroSection`      | `components/public/sections/` | Home hero: headline, subtext, CTA, WhatsApp (content from SiteSettings) |
| `TeacherIntro`     | `components/public/sections/` | Photo, name, qualifications, philosophy                                 |
| `CourseCard`       | `components/public/`          | Course: class, board, batch, fee badge, CTA                             |
| `ResourceCard`     | `components/public/`          | Public material: title, type, download                                  |
| `AnnouncementCard` | `components/public/`          | Reuse existing announcement display                                     |
| `ContactInfo`      | `components/public/`          | Phone, WhatsApp, address, map embed                                     |
| `AdmissionsForm`   | `components/public/`          | Name, phone, class, board, message → WhatsApp                           |
| `SectionHeader`    | `components/public/`          | Consistent h2 + subtext + optional link                                 |
| `WhatsAppButton`   | `components/public/`          | Pre-filled message, tracking params                                     |

### Existing Components to Reuse

- `EmptyState` — for empty resources/announcements
- `Button` (shadcn) — CTAs
- `Card` (shadcn) — card layouts
- `Badge` — priority, status labels

---

## 6. SEO

| Aspect               | Approach                                                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Title Generation** | `generateMetadata` per page: `${pageTitle}                                                                                        | ${siteConfig.name}` |
| **Metadata**         | `description`, `keywords` per page from `SiteSettings` + page content                                                             |
| **Open Graph**       | `og:title`, `og:description`, `og:image` (hero/teacher photo), `og:type: website`                                                 |
| **Structured Data**  | `Organization` (JSON-LD) on every public page; `Course` on `/courses`; `FAQ` only if FAQs exist; `BreadcrumbList` on nested pages |
| **Sitemap**          | `next-sitemap` or `app/sitemap.ts` — include all public routes                                                                    |
| **Robots**           | `robots.ts` — allow all public routes, disallow `/admin`, `/student`, `/api`                                                      |
| **Canonical URLs**   | Absolute URLs via `metadataBase`                                                                                                  |

---

## 7. Performance

| Area             | Decision                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------- |
| **Images**       | `next/image` with `priority` for hero/teacher photo; WebP/AVIF; responsive sizes         |
| **Lazy Loading** | Default for below-fold images; `loading="lazy"`                                          |
| **Fonts**        | `next/font` (Manrope, Outfit, JetBrains Mono) — self-hosted, preload                     |
| **CSS**          | Tailwind JIT — only used classes shipped                                                 |
| **ISR**          | 1-hour revalidation for static pages; `revalidatePath` on admin content changes          |
| **Bundle**       | No heavy client JS on public pages; only WhatsAppButton, Map, Form are client components |
| **Third-party**  | WhatsApp (wa.me), Google Maps embed (iframe) — no SDKs loaded                            |

---

## 8. Responsive Behavior

| Breakpoint              | Layout                                                                       |
| ----------------------- | ---------------------------------------------------------------------------- |
| **Mobile (< 640px)**    | Single-column; stacked sections; WhatsApp FAB                                |
| **Tablet (640–1024px)** | Two-column grids for courses/resources; side-by-side hero content            |
| **Desktop (> 1024px)**  | Max-width 1280px; multi-column course grid (3–4); full-width hero with image |

**Breakpoints:** Tailwind defaults (`sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`)

**Mobile-first** — all components designed mobile-first, enhanced at larger breakpoints.

---

## 9. Documentation Impact

| Document                    | Change Required                                                             |
| --------------------------- | --------------------------------------------------------------------------- |
| `ROUTES_AND_PERMISSIONS.md` | Add public routes table (already partially there); confirm `/admissions`    |
| `ARCHITECTURE.md`           | Note public rendering strategy (ISR vs dynamic); public component structure |
| `IMPLEMENTATION_PLAN.md`    | Mark Phase 9A complete when done                                            |
| `PRODUCT_SCOPE.md`          | No change (scope already defined)                                           |
| `DATABASE_DESIGN.md`        | Add `SiteSettings`, `AdmissionsEnquiry` models                              |
| `README.md`                 | Update public routes section in local dev guide                             |

---

## 10. Verification Plan

### UI Tests (Vitest + RTL)

| Component        | Tests                                                 |
| ---------------- | ----------------------------------------------------- |
| `PublicHeader`   | Logo link, nav links, WhatsApp CTA visible            |
| `PublicFooter`   | Contact info, map link, social links, quick links     |
| `HeroSection`    | Headline, subtext, CTA, WhatsApp button               |
| `CourseCard`     | Title, board, batch, fee badge, CTA link              |
| `ResourceCard`   | Title, type icon, download link                       |
| `AdmissionsForm` | Validation, WhatsApp redirect with pre-filled message |
| `ContactInfo`    | Phone, WhatsApp, address, map iframe                  |

### Integration Tests

- `listPublicAnnouncements` — already covered
  - `listPublicResources` — authoritative public-resource query: filter by `visibility: CURRICULUM_TRACK`, `lifecycleState: PUBLISHED`, not archived; file-asset activeness enforced at download time
- `getSiteSettings` — singleton fetch

### Build & Typecheck

- `npm run lint` — 0 errors
- `npm run typecheck` — 0 errors
- `npm run format:check` — clean
- `npm run build` — all public routes compile; ISR/dynamic markers correct

### Accessibility (axe / manual)

- Semantic HTML (`header`, `nav`, `main`, `section`, `footer`)
- Heading hierarchy (h1 → h2 → h3)
- Focus visible on all interactive elements
- Color contrast (WCAG AA)
- Alt text on all images
- ARIA labels on icon-only buttons
- Form labels associated

### Responsive Verification

- Viewport testing at 375px, 768px, 1024px, 1440px
- No horizontal overflow
- Touch targets ≥ 44×44px
- Text readable without zoom

### Lighthouse Audit (pre-merge)

Verify before closing Phase 9A:

- Performance ≥ 90
- Accessibility ≥ 95
- Best Practices ≥ 90
- SEO ≥ 95

---

## Implementation Order (Suggested)

1. **9A.1 Foundation** — `SiteSettings` model + migration, `getSiteSettings` service
2. **9A.2 Public Layout** — `PublicHeader`, `PublicFooter`, root layout update
3. **9A.3 Home** — Hero (from SiteSettings), TeacherIntro, current batch highlight, CTAs
4. **9A.4 About** — Teacher profile page
5. **9A.5 Courses** — Curriculum-driven course cards with fee display toggle
6. **9A.6 Resources** — Public materials grid with download
7. **9A.7 Contact** — Info + map + WhatsApp
8. **9A.8 Admissions** — Form → WhatsApp redirect (best-effort logging)
9. **9A.9 SEO** — `generateMetadata`, sitemap, robots, structured data (Organization, Course, FAQ, Breadcrumb)
10. **9A.10 Polish** — ISR config, image optimization, accessibility audit, Lighthouse audit

> **Implementation note (actual delivery):** The repository delivered Phase 9A in 5 compressed slices rather than the 10 suggested above: 9A.1 SiteSettings foundation, 9A.2 Public Layout & Footer, 9A.3 Public Home, 9A.4 Public Courses, 9A.5 Public Resources. The Resources page committed as **9A.5** therefore corresponds to the suggested **9A.6** here. Design content (scope, visibility criteria, components) is unchanged.

---

## Public Content Service Layer

Rather than pages querying multiple services directly, create dedicated public services:

```
src/server/services/public.ts
```

with:

- `getPublicHomeData()` — hero, teacher intro, next batch, recent announcements
- `listPublicCourses()` — curriculum tracks with batch info, fee display
- `listPublicResources()` — public materials with visibility + validity checks
- `getPublicSiteSettings()` — singleton settings
- `createAdmissionsEnquiry()` — best-effort logging before WhatsApp redirect

This mirrors the dashboard aggregation service from Phase 8.

---

## SiteSettings Scope (Explicit)

**Included:**

- Institute name, tagline
- Phone, WhatsApp number, email
- Address, landmark
- Map embed URL
- Logo, favicon
- SEO defaults (site name, default description, OG image)
- Social links
- Hero: headline, subheadline, CTA text, CTA target
- Fee display toggles (per course/batch)

**Excluded:**

- Page-specific content (belongs in page components or CMS if added later)
- Teacher profile details (uses Teacher model)

---

## Admissions Form — Best-Effort Logging

Workflow:

1. User submits form
2. **Best-effort**: `createAdmissionsEnquiry()` — if it fails, log error but continue
3. Generate WhatsApp URL with pre-filled message
4. Redirect user to WhatsApp

Never block the user from contacting the institute due to logging failure.

---

## Resource Visibility Criteria

The `StudyMaterialVisibility` enum is `{ CURRICULUM_TRACK, BATCH }`. There is **no**
`PUBLIC` value — publicly shared resources use `CURRICULUM_TRACK` visibility, while
`BATCH`-scoped materials remain restricted to enrolled students. `StudyMaterial` has
**no `expiresAt` field**, so resource expiry is out of scope (deferred; would require a
schema change if product later requires it).

A `StudyMaterial` appears on `/resources` iff (single authoritative policy implemented in
`listPublicResources`):

- `visibility === "CURRICULUM_TRACK"`
- `lifecycleState === "PUBLISHED"` (implies `publishedAt` is set and `archivedAt` is null)
- `fileAsset` exists and `fileAsset.lifecycleState === "ACTIVE"` — enforced when the public
  download route resolves the signed URL.

This same `listPublicResources` query is the only public-resource selection policy and is
shared by the Home page data and the `/resources` page, so batch-restricted materials are
never exposed publicly.

---

## Hero Content from SiteSettings

Hero section content is **not hardcoded**. It comes from `SiteSettings`:

- `heroHeadline`
- `heroSubheadline`
- `heroCtaText`
- `heroCtaTarget`

Changing marketing copy does not require deployment.

---

## Approval Gate

Before implementation begins, this document must be reviewed and approved. Changes after approval follow the standard Phase Completion Workflow.

---

**Reviewed by:** _______________
**Date:** _______________
**Approved:** ☐ Yes ☐ No (with comments)
