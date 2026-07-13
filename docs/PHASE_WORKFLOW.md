# Phase Workflow — Project Governance

**Purpose:** Define the mandatory workflow for every implementation phase in this project. No phase may deviate from this process without explicit approval.

---

## Definition of Done

A phase is complete when:

1. All implementation work for the approved scope is finished.
2. The full gate passes: format, lint, typecheck, test, build.
3. Git inspection shows only intended changes.
4. Phase Completion Report is written.
5. Phase Boundary Audit passes.
6. Commit approval is granted.
7. Push approval is granted.
8. Local HEAD == remote HEAD, working tree clean.

---

## Phase Completion Workflow (10 Steps)

1. **Implement** — Write all code for the approved scope.
2. **Full gate** — Run:
   - `npm run format:check`
   - `npm run lint`
   - `npm run typecheck`
   - `npm test`
   - `npm run build`
     All must pass with zero new errors.
3. **Git inspection** — Record:
   - `git status`
   - `git diff --stat`
   - `git diff --name-only`
   - List of untracked files
4. **Phase Completion Report** — Write a concise report covering:
   - Features implemented
   - Files created
   - Files modified
   - Verification results (gate output summary)
   - Known limitations
   - Any deviations from the approved plan
5. **Phase Boundary Audit** — Mechanically verify every item in the [Phase Boundary Audit](#phase-boundary-audit) checklist.
6. **Wait for commit approval** — Do not commit until explicitly approved.
7. **Commit** — Create the commit. Present:
   - Commit hash
   - Commit subject
   - Files changed / insertions / deletions
   - `git status` (must be clean)
8. **Wait for push approval** — Do not push until explicitly approved.
9. **Push** — Push to `origin/main`. Verify:
   - Local HEAD == remote HEAD
   - Working tree is clean
10. **Stop** — End the phase. Record the status block (see [Status Block Format](#status-block-format)).

---

## Phase Boundary Audit Checklist

### Scope Control

- [ ] Every changed file belongs to the approved phase scope.
- [ ] No unrelated documentation changed.
- [ ] No unrelated migrations changed.
- [ ] No unrelated tests modified (except justified: FK cleanup, test isolation, deterministic ordering, legitimate regression fixes).
- [ ] No generated artifacts tracked.
- [ ] No `.env`, secrets, logs, or scratch files present.
- [ ] No new `TODO`, `FIXME`, `HACK`, `XXX` comments introduced.
- [ ] No new `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, or unjustified `any` usages (without explicit justification).
- [ ] No unapproved dependency additions, removals, or version changes.

### Documentation Synchronization

- [ ] `IMPLEMENTATION_PLAN.md` updated to reflect current phase status.
- [ ] `PRODUCT_SCOPE.md` updated if product scope changed.
- [ ] `DATABASE_DESIGN.md` updated if schema changed.
- [ ] `ROUTES_AND_PERMISSIONS.md` updated if routes changed.
- [ ] `ARCHITECTURE.md` updated if architecture changed.
- [ ] Phase-specific design/verification docs updated if applicable.

### Migration Protocol (if schema changed)

- [ ] Migration SQL mechanically inspected before application.
- [ ] Any generated SQL affecting protected unmanaged indexes reviewed and corrected.
- [ ] Migration applied where required.
- [ ] Schema documentation updated.

### Route & Permission Changes (if applicable)

- [ ] Route documentation updated in `ROUTES_AND_PERMISSIONS.md`.
- [ ] Permission matrix updated in `ROUTES_AND_PERMISSIONS.md`.

### Rollback Readiness

- [ ] Phase is self-contained (no dependency on uncommitted work).
- [ ] No next-phase implementation leaked into this phase.
- [ ] No temporary bridge code exists (feature flags, placeholders, dead code for future phases) unless explicitly approved.
- [ ] Commit is independently reversible — reverting it does not break subsequent phases.

---

## Commit Conventions

- One commit per phase (or per approved slice within a phase).
- Subject format: `<type>: <imperative summary>`
  - Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `ci`, `perf`, `style`
  - Example: `feat: add student timetable widget`
- Body may include bullet points for context.
- No secrets, no generated files, no binary blobs.
- Commit message references the phase/slice identifier.

## Push Conventions

- Push only after explicit push approval.
- Push to `origin/main` only.
- Never force-push without explicit approval. When a history rewrite is explicitly approved, use `git push --force-with-lease origin main` — never plain `--force`. `--force-with-lease` aborts if the local remote-tracking ref is stale, protecting against overwriting unrelated remote work.
- Verify local HEAD == remote HEAD after push.

## Git Hygiene (Pre-push Hook)

This repository ships a self-enforcing pre-push hook at `.githooks/pre-push`. It is version-controlled, so every clone inherits the same safeguards automatically.

### Install (one time, per clone)

```bash
git config core.hooksPath .githooks
```

### What the hook enforces before every push

- `git config user.name` is set.
- `git config user.email` is set.
- No `Co-authored-by:` trailers.
- No `Signed-off-by:` trailers.
- No `Reviewed-by:` trailers.
- No `Suggested-by:` trailers.
- No `Generated-by:` / `AI-` trailers.
- Working tree is clean (`git status --porcelain` is empty).

### Force-push policy (convention, not hook-enforced)

The hook cannot reliably detect push flags, so the rule is a documented convention:

- Prefer `git push --force-with-lease` over `--force`.
- Never use plain `--force` for this repository.
- Only force-push after explicit approval for a defined reason (e.g. removing attribution trailers from history).

## Migration Protocol

- All Prisma migrations are additive unless a destructive change is explicitly approved.
- Migration SQL is inspected before `prisma migrate deploy`.
- Indexes on protected columns (audit fields, FKs, PKs) are preserved.
- Downgrade path is considered: `prisma migrate diff` should be usable to generate a reversal if needed.

## Documentation Synchronization Rules

1. Documentation is updated **in the same phase** as the implementation that changes it.
2. Documentation-only cleanup is permitted only when explicitly approved.
3. `IMPLEMENTATION_PLAN.md` always reflects the true current phase status.
4. `PRODUCT_SCOPE.md` changes require explicit scope change approval.
5. `DATABASE_DESIGN.md` is the source of truth for schema; it must match `prisma/schema.prisma`.
6. `ROUTES_AND_PERMISSIONS.md` is the source of truth for routes and permission matrices.
7. `ARCHITECTURE.md` reflects actual system structure, not aspirational.

## Rollback Readiness Checklist

- [ ] Phase implementation is complete and verified.
- [ ] No next-phase code exists in this commit.
- [ ] No feature flags, placeholder components, or dead code introduced for future phases.
- [ ] All public APIs introduced are stable and documented.
- [ ] Reverting this commit leaves the codebase in a working state at the previous phase boundary.

## Exception Policy

This workflow **may be bypassed** only for:

1. Emergency production hotfixes.
2. Security fixes with immediate deployment requirement.
3. Repository recovery operations (e.g., corrupt history, lost commits).

In all exception cases:

- The bypass is documented in the commit message and a follow-up issue.
- A retroactive Phase Completion Report and Boundary Audit are completed within 24 hours.
- The normal workflow resumes for the next planned phase.

---

## Status Block Format

At the end of every completed phase, append a status block to `IMPLEMENTATION_PLAN.md`:

```text
Phase: <phase-id>
Status: Complete
Working tree: Clean
Commit: <hash | pending>
Push: <completed | pending>

Next planned phase:
Phase <next-id> — <title>

Outstanding blockers:
None | <list>
```

---

## Explicit Rules

### Phase Isolation

> Every commit must represent one complete, independently understandable phase or slice. Mixing unrelated work is prohibited.

### Documentation Rule

> Documentation is updated in the same phase as the implementation that changes it. Documentation-only cleanup is permitted only when explicitly approved.

### Migration Rule

> Every Prisma migration must be mechanically inspected before application. Any generated SQL affecting protected unmanaged indexes must be reviewed and corrected before deployment.

### Approval Rule

> No commit occurs without explicit approval. No push occurs without explicit approval. Approval is never inferred from previous phases.

### Exception Rule

> The only situations where this workflow may be bypassed are:
>
> - emergency production hotfixes,
> - security fixes,
> - repository recovery operations.
>   Those must be documented afterward.

---

## Quality Baseline

The repository has established the following mandatory baseline:

- ESLint: 0 errors
- ESLint: 0 warnings
- TypeScript: 0 errors
- Build: Passing
- Tests: Passing

Rules:

- Every future phase must preserve this baseline.
- No phase may introduce new ESLint warnings or errors.
- No phase may introduce new TypeScript errors.
- All gates (format, lint, typecheck, test, build) must pass before commit approval.
- Any regression against this baseline must be fixed within the same phase before requesting commit approval.

---

_This document is the single source of truth for phase governance. Amendments require the same approval process as a phase commit._
