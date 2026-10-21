---
phase: 01-decisions-and-shared-cookbook
plan: 16
subsystem: auth
tags: [supabase, auth, server-actions, rls, shadcn, playwright, vitest]

requires:
  - 01-15 (Supabase clients, claim_owner/cookbook_exists, guarded test helpers, shadcn init)
provides:
  - setupOwner() race-safe first-owner bootstrap (src/lib/auth/setup-owner.ts) and ownerSetupSchema
  - getCurrentMembership() (React-cached, RLS-scoped) in src/lib/auth/membership.ts
  - /{locale}/setup page + setupOwnerAction (sign-in after setup, redirect to /{locale}/recipes)
  - Member-only (app) route group guard and /{locale}/recipes cookbook home (empty state)
  - shadcn Button/Input/Label (cn from @/lib/utils)
  - Playwright setup project writes tests/e2e/.auth/owner.json; viewport projects depend on it and start signed in as the owner
affects: [01-17, 01-10, 01-11, 01-12, 01-13, 01-19, 01-14, 01-18]

actuals:
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Server actions take locale from a hidden field validated by isLocale; error messages come from the dictionary"
    - "Member-only pages live under src/app/[locale]/(app)/; layout AND page both call getCurrentMembership (they render in parallel)"
    - "shadcn components are copied from the registry JSON with cn imported from @/lib/utils (never `shadcn add`)"
    - "E2E specs that need the owner run in viewport projects (storageState); setup-only flows go in owner-setup.spec.ts"

key-files:
  created:
    - src/lib/auth/schemas.ts
    - src/lib/auth/setup-owner.ts
    - src/lib/auth/membership.ts
    - src/app/[locale]/setup/page.tsx
    - src/app/[locale]/setup/actions.ts
    - src/components/owner-setup-form.tsx
    - src/components/ui/button.tsx
    - src/components/ui/input.tsx
    - src/components/ui/label.tsx
    - src/app/[locale]/(app)/layout.tsx
    - src/app/[locale]/(app)/recipes/page.tsx
    - tests/e2e/owner-setup.spec.ts
    - tests/integration/owner-setup.test.ts
    - tests/e2e/responsive-shell.spec.ts
  modified:
    - src/i18n/messages/pt.json
    - src/i18n/messages/en.json
    - playwright.config.ts

key-decisions:
  - "Portuguese interface copy uses European Portuguese (e.g. 'palavra-passe'); no variant was specified, and pt-PT matches the test browser locale and the EU setting."
  - "shadcn button/input/label were copied from the new-york-v4 registry with imports rewritten to @/lib/utils, because `shadcn add` would install the rejected 'cn' package (per the 01-09 decision)."
  - "If cookbook_exists cannot be read, the setup page shows the already-set-up state rather than the form; the server re-checks on every submit regardless."

requirements-completed: [AUTH-01]

coverage:
  - id: D1
    description: "First visitor with the setup code becomes the single owner, is signed in, and lands on /pt/recipes with the cookbook name and empty message; no email involved"
    requirement: AUTH-01
    verification:
      - kind: e2e
        ref: "tests/e2e/owner-setup.spec.ts#the first person with the code becomes the owner and lands on the cookbook"
        status: pass
    human_judgment: false
  - id: D2
    description: "Wrong code, invalid input, repeat, concurrent race and taken email create no second cookbook/owner; race loser's account is deleted"
    requirement: AUTH-01
    verification:
      - kind: integration
        ref: "tests/integration/owner-setup.test.ts (5 tests)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/owner-setup.spec.ts#a wrong setup code shows an error and creates no account; #setup cannot be repeated once the cookbook exists"
        status: pass
    human_judgment: false
  - id: D3
    description: "Member-only pages redirect visitors without a membership to /{locale}/sign-in"
    verification:
      - kind: e2e
        ref: "tests/e2e/owner-setup.spec.ts#visitors without a membership are sent to sign-in"
        status: pass
    human_judgment: false
  - id: D4
    description: "Signed-in cookbook page has no horizontal scroll on desktop, iPad, Pixel 7 and iPhone 13"
    verification:
      - kind: e2e
        ref: "tests/e2e/responsive-shell.spec.ts (4 viewport projects)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Setup form usability and Portuguese/English copy quality"
    human_judgment: true
    rationale: "Wording and form feel on a real phone are judgment calls no test asserts"

duration: 12min
completed: 2026-10-21
status: complete
---

# Phase 1 Plan 16: First Owner Setup Summary

**The first person with the owner setup code creates an email + password account on `/pt/setup`. That person becomes the single owner of the family cookbook without any email being sent, is signed in, and lands on the member-only `/pt/recipes` page. Wrong codes, repeats, concurrent races and taken emails cannot create a second owner. Tests cover this on the live DEV database and in all four browser viewports.**

## Performance

- **Duration:** ~12 min (15:21Z–15:33Z)
- **Tasks:** 2 / 2
- **Files:** 14 created, 3 modified

## Accomplishments

- `setupOwner()` validates input with zod and checks the setup code with a timing-safe comparison of SHA-256 digests. It refuses before creating any account when a cookbook already exists. It creates the account server-side, claims ownership through `claim_owner`, and deletes the account again if it loses a race.
- Setup page and server action: labelled fields with email/new-password autocomplete, a pending-disabled submit button, an error area with `role="alert"`, and the typed email is kept after an error.
- Member-only `(app)` route group guarded by `getCurrentMembership()`; the cookbook home shows the cookbook name and an empty-state message.
- Playwright viewport projects now depend on the `setup` project and reuse the owner's session.

## Task Commits

1. **Task 1: Owner setup vertical slice:** `a946964` (feat)
2. **Task 2: Repeat/race proofs + responsive check:** `69b0ea6` (test), `1dbeb36` (feat)

## Future email verification (D-30)

Every v1 account is created with `email_confirm: true`. This covers owner setup here, invite redemption in 01-12, and the test users. The flag exists only so password sign-in works without any email. As a result, `auth.users.email_confirmed_at` is synthetic for every v1 account and proves nothing about who owns the address. If email verification or reset is enabled later, do not trust that field for existing accounts; require a fresh verification for them.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `shadcn add button input label` would install the rejected `cn` package**
- **Found during:** Task 1
- **Fix:** Copied the three component sources from the `new-york-v4` registry JSON and rewrote `import { cn } from "cn"` to `@/lib/utils`. The 01-09 summary prescribes this. Nothing was installed.
- **Verification:** `git grep 'from "cn"' -- src` finds nothing; package.json and package-lock.json are unchanged.
- **Commit:** a946964

**2. [Rule 1 - Bug] E2E alert locator matched Next.js's route announcer**
- **Found during:** Task 1
- **Issue:** `getByRole("alert")` also matched `#__next-route-announcer__`.
- **Fix:** The locator now filters by the expected error text.
- **Commit:** a946964

**3. [Rule 2 - Missing critical] Page-level membership check on /recipes**
- **Issue:** Next.js renders layouts and pages in parallel, so a check in the layout alone does not stop the page from rendering.
- **Fix:** `recipes/page.tsx` also calls the cached `getCurrentMembership()` and redirects. RLS still gates the data.
- **Commit:** a946964

**Additions beyond the plan:** an `invalid_input` integration test (6 integration tests total, 5 planned), a check that the typed email is kept after an error, and `weak_password`/`validation_failed` Auth errors mapped to `invalid_input`.

---

**Total deviations:** 3 auto-fixed (1 blocking, 1 bug, 1 missing critical). **Impact:** none on scope; no packages were installed.

## Issues Encountered

- `/pt/sign-in` does not exist yet (plan 01-11). Guarded pages and the already-set-up link point there, and it currently shows Next.js's 404 page.
- The cookbook's default name comes from the database default `'Family cookbook'` (English) and appears that way in the Portuguese interface until a rename feature exists.
- The race test may resolve on either the `cookbook_exists` pre-check or the `claim_owner` unique-index path, depending on timing. Both paths are enforced; the database path is guaranteed by the `cookbooks_singleton` index.
- `npm run test:integration -- <file>` also runs the other integration files, because the script already passes the directory.

## Verification

- `npm run lint`, `npm run typecheck` → exit 0
- `npm run test:unit -- tests/unit/i18n-messages.test.ts` → 4 passed (pt/en parity holds with the new keys)
- `npm run test:integration -- tests/integration/owner-setup.test.ts` → 11 passed (owner-setup 5 + data-boundary 6)
- `npx playwright test tests/e2e/owner-setup.spec.ts tests/e2e/responsive-shell.spec.ts tests/e2e/locale.spec.ts` → 44 passed (setup project + desktop-chromium, tablet-webkit, phone-chromium, phone-webkit)

## Self-Check: PASSED

- Task 1 acceptance criteria: `email_confirm` appears once and `timingSafeEqual` is present in setup-owner.ts; no email-sending Auth APIs in src; `getCurrentMembership` is used in the `(app)` layout; the parity unit test passes.
- Task 2 acceptance criteria: `Promise.all` is in the integration test; playwright.config.ts has `dependencies`; both verify commands exit 0.

## Next Phase Readiness

Plan 01-17 (production deploy) is next. It needs the Supabase PRODUCTION project configured with sign-ups and Confirm email OFF and minimum password length 8, `SUPABASE_PROD_DB_URL` filled in, a different production `OWNER_SETUP_CODE`, and the user's Vercel account linked.
