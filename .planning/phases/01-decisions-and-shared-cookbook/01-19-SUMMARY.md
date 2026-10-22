---
phase: 01-decisions-and-shared-cookbook
plan: 19
subsystem: auth
tags: [supabase, auth, members, nextjs, app-router, soft-navigation, playwright, vitest, vercel]

requires:
  - 01-13 (getMembershipStatus member | none | unavailable, member removal, tests/e2e/member-removal.spec.ts, migration 20261021120400)
  - 01-11 (sign-in page reason=no-access message)
  - 01-16 ((app) layout membership guard)
  - 01-17 (ship sequence; live site on the DEV Supabase project)
provides:
  - requireMembership(locale) (src/lib/auth/require-membership.ts) — member -> membership; none -> sign-in (?reason=no-access when a Supabase auth cookie is still presented); unavailable -> /{locale}/unavailable
  - The (app) layout and all 6 (app) pages call requireMembership, so soft navigations are guarded
  - /{locale}/unavailable can't-reach-the-server page (static, no Supabase call, no offline purge)
  - common.unavailable title/body/retry in pt and en
  - tests/unit/membership-status.test.ts and tests/unit/app-pages-guard.test.ts
  - 01-13 member removal and this guard live on https://newrecipewebsite.vercel.app (commit 9c2f9f9)
affects: [01-14, 01-18]

actuals:
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "Page-level guard: every (app) page.tsx calls requireMembership(locale) itself, because a soft navigation does not re-render the shared layout; a unit test walks the route folder so new pages cannot drop it"
    - "Outage is not lost access: unavailable redirects to a static page that never shows sign-in (so no offline purge runs)"

key-files:
  created:
    - src/lib/auth/require-membership.ts
    - src/app/[locale]/unavailable/page.tsx
    - tests/unit/membership-status.test.ts
    - tests/unit/app-pages-guard.test.ts
  modified:
    - src/app/[locale]/(app)/layout.tsx
    - src/app/[locale]/(app)/recipes/page.tsx
    - src/app/[locale]/(app)/recipes/new/page.tsx
    - src/app/[locale]/(app)/recipes/[id]/page.tsx
    - src/app/[locale]/(app)/recipes/[id]/edit/page.tsx
    - src/app/[locale]/(app)/members/page.tsx
    - src/app/[locale]/(app)/members/[userId]/remove/page.tsx
    - src/i18n/messages/pt.json
    - src/i18n/messages/en.json
    - tests/e2e/member-removal.spec.ts

key-decisions:
  - "requireMembership shows the no-access message only when a non-empty Supabase auth cookie (sb-*-auth-token, including .0/.1 chunks) is still presented; a visitor without one gets the plain sign-in page."
  - "Every (app) page calls requireMembership in addition to the layout (T-01-43); tests/unit/app-pages-guard.test.ts fails if the layout or any page.tsx under (app) lacks it."
  - "An unreachable or paused Supabase redirects to /{locale}/unavailable (D-34), never to sign-in, so the 01-18 sign-out purge cannot be triggered by an outage."
  - "No client router-cache staleTimes override in next.config.ts (T-01-48)."
  - "Ship loop used db:*:dev in place of db:*:prod (01-17 user decision): the live site still runs on the DEV Supabase project, where 20261021120400 is applied."

patterns-established:
  - "New (app) pages start with `const membership = await requireMembership(locale);` (or a bare await when unused) instead of getCurrentMembership + redirect."

requirements-completed: [AUTH-02]

coverage:
  - id: D1
    description: "A removed member whose session is still live taps an in-app recipe link (soft navigation, window marker survives) and lands on /pt/sign-in?reason=no-access with the no-access message; a full load does the same"
    requirement: AUTH-02
    verification:
      - kind: e2e
        ref: "tests/e2e/member-removal.spec.ts#the owner reviews a member's recipes, removes their access and can re-invite the same email (4 viewport projects)"
        status: pass
    human_judgment: false
  - id: D2
    description: "A visitor with no session opening a member page gets the plain sign-in page without the no-access message"
    requirement: AUTH-02
    verification:
      - kind: e2e
        ref: "tests/e2e/member-removal.spec.ts (fresh no-cookie context on /pt/recipes ends on /pt/sign-in, no message)"
        status: pass
      - kind: command
        ref: "curl https://newrecipewebsite.vercel.app/pt/recipes -> 307 /pt/sign-in"
        status: pass
    human_judgment: false
  - id: D3
    description: "Supabase outages are classified unavailable and shown as can't-reach-the-server, never as lost access"
    requirement: AUTH-02
    verification:
      - kind: unit
        ref: "tests/unit/membership-status.test.ts (7 cases, mutation-checked)"
        status: pass
      - kind: command
        ref: "npm run build (/[locale]/unavailable prerendered as static HTML); 360px screenshots pt/en, scrollWidth 360"
        status: pass
    human_judgment: false
  - id: D4
    description: "The (app) layout and every (app) page enforce membership on each navigation; no router-cache override"
    requirement: AUTH-02
    verification:
      - kind: unit
        ref: "tests/unit/app-pages-guard.test.ts (layout + 6 pages)"
        status: pass
      - kind: command
        ref: "git grep staleTimes -- next.config.ts (no lines)"
        status: pass
    human_judgment: false
  - id: D5
    description: "01-13 member removal and this guard are live together"
    requirement: AUTH-02
    verification:
      - kind: command
        ref: "git push origin HEAD:main (5e3962c..9c2f9f9); Vercel commit status success; npm run db:status:dev (20261021120400 remote)"
        status: pass
      - kind: e2e
        ref: "npm run test:e2e:prod (6/6)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Real-device check: the owner removes a test relative on a phone (keep one recipe, remove another); the relative's phone, tapping a recipe link, lands on sign-in with the no-access message; the owner re-invites the same email"
    requirement: AUTH-02
    human_judgment: true
    rationale: "End-of-phase human check (human_verify_mode end-of-phase)"

duration: 21 min
completed: 2026-10-22
---

# Phase 1 Plan 19: Page-level no-access guard and ship of member removal Summary

**Every member page now runs `requireMembership(locale)`, so a removed relative whose session is still live is turned away with the no-access message on a full load and on an in-app link tap. A visitor without a session sees the plain sign-in page. A Supabase outage shows a static "can't reach the server" page instead of lost access. Member removal (01-13) and this guard are live together on newrecipewebsite.vercel.app.**

## Performance

- **Duration:** 21 min
- **Started:** 2026-10-22T09:42Z
- **Completed:** 2026-10-22T10:03Z
- **Tasks:** 3
- **Files:** 14 (4 created, 10 modified)

## Accomplishments

- `requireMembership(locale)` handles the three membership states. `member` returns the membership. `none` redirects to sign-in, and adds `?reason=no-access` when a Supabase auth cookie is still presented. `unavailable` redirects to `/{locale}/unavailable`.
- The `(app)` layout and all six `(app)` pages call it, replacing their own lookups. Owner-only pages still return 404 for members. A unit test walks the route folder and fails if the layout or any page lacks the guard.
- `/{locale}/unavailable` is prerendered as static HTML. It makes no Supabase call and runs no offline purge. It shows a heading, a body line and a "Try again" link to the cookbook, and is readable at 360px in pt and en.
- Shipped: `origin/main` went from `5e3962c` to `9c2f9f9`, which includes 01-13. Vercel deployed it successfully and the production smoke tests pass.

## Task Commits

1. **Task 1: The removed member taps an in-app recipe link and lands on sign-in with the no-access message (tracer)**: `31983d7` (feat). The e2e passed in 4 viewport projects and passed again for the tracer gate (8/8).
2. **Task 2: Can't reach the server**: `d2c59c3` (test), `14627a8` (feat)
3. **Task 3: Guard every (app) page, then ship**: `b2f9a8a` (test, RED: 4 pages failing), `9c2f9f9` (feat, GREEN), pushed to `main`

## Token expiry

Once the removed member's access token expires, they see the plain sign-in page without the no-access message. The expiry is about 1 hour, the Supabase default JWT expiry. The refresh then fails because the account is deleted, and the auth cookie is cleared. Access stays blocked either way. This is the expected behaviour and was not observed in this run: the e2e only covers the still-live session.

## Files Created/Modified

See `key-files` in the frontmatter.

## Deviations from Plan

**1. [Ship-loop substitution] `db:push:dev` / `db:status:dev` instead of `db:*:prod`**
- No PRODUCTION Supabase project exists yet (01-15/01-17 user decision), and the live site runs on DEV. `db:push:dev` reported the remote as up to date, and `db:status:dev` lists `20261021120400` as applied remotely. `db:push:prod` must run once a production project exists.

**2. [Additive] The no-access check ignores empty auth cookies**
- `hasAuthCookie` requires a non-empty value, so a cookie cleared by a failed refresh does not trigger the no-access message.

**3. [Additive] Extra verification**
- A mutation check removed the guard from the recipe view page and confirmed the soft-navigation e2e step then fails. The page was restored afterwards.
- Spot checks on the live site: `/pt/recipes` without a cookie gives a 307 to `/pt/sign-in`, and `/en/unavailable` serves "Can't reach the server".

**Total deviations:** 1 ship-loop substitution (pre-approved), 2 additive changes. **Impact:** none on scope.

## Issues Encountered

- **No honest RED for Task 2.** The 01-13 classification already matched every case, so `membership-status.test.ts` passed on its first run. Instead, a mutation broke the outage rules: the three `unavailable` cases failed, then the source was restored with an empty diff. No change to `src/lib/auth/membership.ts` was needed.
- Local e2e runs wipe the DEV database that the live demo uses (accepted in 01-17).

## User Setup Required

None.

## Next Phase Readiness

- Ready for 01-14 (offline reading of opened recipes). New or edited `(app)` pages must keep `requireMembership(locale)`, which the guard unit test enforces. An outage lands on `/{locale}/unavailable`, which must not purge the offline cache.
- AUTH-02 is complete: 01-12 covers invites, and 01-13 + 01-19 cover removal.
- End-of-phase human check: on a phone, the owner removes a test relative, keeping one recipe and removing another. The relative taps a recipe link and lands on sign-in with the no-access message. The owner then re-invites the same email.

## Self-Check: PASSED

- Files exist: all 4 created files are present.
- Commits exist: `31983d7`, `d2c59c3`, `14627a8`, `b2f9a8a`, `9c2f9f9` are on `main` and `origin/main`.
- Verification: unit 46/46 (membership-status 7/7, app-pages-guard 8/8, i18n parity), full local e2e 112/112, member-removal e2e 4/4 in all 4 viewports, typecheck and eslint clean, build and check:secrets OK, `20261021120400` applied remotely on DEV, Vercel deployed `9c2f9f9`, test:e2e:prod 6/6.
