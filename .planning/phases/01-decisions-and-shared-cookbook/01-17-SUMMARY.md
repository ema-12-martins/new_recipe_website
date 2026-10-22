---
phase: 01-decisions-and-shared-cookbook
plan: 17
subsystem: infra
tags: [vercel, deploy, secrets, playwright, routing]

requires:
  - 01-16 (owner setup, getCurrentMembership, setup page heading = common.appName)
provides:
  - Live site at https://newrecipewebsite.vercel.app, auto-deployed from GitHub main (Vercel Hobby, vercel.json regions fra1)
  - Root routing — /{locale} → setup (no cookbook) / recipes (member) / sign-in (others)
  - check:secrets post-build scan of .next/static (secret key value, sb_secret_, service_role)
  - test:e2e:prod read-only smoke (playwright.prod.config.ts, tests/e2e/prod-smoke.spec.ts)
affects: [01-10, 01-11, 01-12, 01-13, 01-19, 01-14, 01-18]

actuals:
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Ship loop for later plans: db:push:dev (if migration) → db:status:dev → build → check:secrets → local e2e → commit → git push origin HEAD:main → wait for Vercel → test:e2e:prod"
    - "Local Playwright webServer readiness probe is /pt/setup (always 200); the root redirects onward"
    - "Playwright locale is set with test.use({ locale }) — Chromium ignores an extraHTTPHeaders Accept-Language override"

key-files:
  created:
    - vercel.json
    - scripts/check-client-bundle.mjs
    - playwright.prod.config.ts
    - tests/e2e/prod-smoke.spec.ts
  modified:
    - src/app/[locale]/page.tsx
    - tests/e2e/locale.spec.ts
    - package.json
    - playwright.config.ts

key-decisions:
  - "USER DECISION (Rule 4, 2026-10-21): the live site runs on the DEV Supabase project as a temporary demo. Every test run wipes DEV (all accounts, cookbook, later recipes), so no real family data is stored until a PRODUCTION Supabase project exists. Vercel env vars in all scopes hold DEV values; db:*:prod steps ran as db:*:dev."
  - "vercel.json regions [\"fra1\"] is accepted on Hobby (one region allowed); the deploy succeeded with it."

requirements-completed: [AUTH-01]

coverage:
  - id: D1
    description: "Site is live on a *.vercel.app address, auto-deployed from GitHub main"
    requirement: AUTH-01
    verification:
      - kind: e2e
        ref: "tests/e2e/prod-smoke.spec.ts (6 tests, desktop + phone)"
        status: pass
      - kind: other
        ref: "GitHub commit status for 5832beb: 'Vercel: success Deployment has completed'"
        status: pass
    human_judgment: false
  - id: D2
    description: "Root routes to setup / recipes / sign-in; locale redirects and html lang unchanged"
    verification:
      - kind: e2e
        ref: "tests/e2e/locale.spec.ts + owner-setup.spec.ts + responsive-shell.spec.ts (44 tests)"
        status: pass
    human_judgment: false
  - id: D3
    description: "No secret material in the client bundle"
    verification:
      - kind: other
        ref: "npm run check:secrets (13 files, OK); planted sb_secret_ probe detected (exit 1)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Real owner sets up the cookbook on the live site from a phone"
    human_judgment: true
    rationale: "Deferred: the live site is a DEV-backed demo whose data tests wipe; the real owner setup waits for a PRODUCTION Supabase project"

duration: 45min
completed: 2026-10-21
status: complete
---

# Phase 1 Plan 17: Live Deploy on Vercel Summary

**The owner-setup slice is live at https://newrecipewebsite.vercel.app. Vercel deploys it automatically on every push to GitHub `main` and runs it in Frankfurt (`fra1`). The site root routes visitors to setup, their cookbook, or sign-in. A post-build scan keeps the Supabase secret key out of the browser bundle. By user decision, the live site runs on the DEV database as a temporary demo.**

## Performance

- **Duration:** ~45 min (15:35Z–16:20Z), mostly the two human dashboard steps and waiting for Vercel
- **Tasks:** 2 / 2
- **Files:** 4 created, 4 modified

## Production details

- **URL:** https://newrecipewebsite.vercel.app (D-36)
- **Region:** `vercel.json` sets `regions: ["fra1"]`, the Hobby plan accepted it, and the user also set the dashboard Function Region to Frankfurt. Responses carry `X-Vercel-Id: fra1::…` (D-35).
- **Database:** the Supabase **DEV** project (EU), not a separate PRODUCTION project. See the decision below.
- **Auto-deploy:** confirmed. Commit `5832beb` received the GitHub status "Vercel: success Deployment has completed" (D-33).
- **Setup notes:** `OWNER_SETUP_CODE` is a hardening addition consistent with D-06/D-28. The plan expected DEV + PROD to use the free tier's two active projects; only DEV is in use for now.

## Task Commits

1. **Task 1: Vercel link (human):** verified that `PRODUCTION_URL` ends with `.vercel.app` and resolves. No commit.
2. **Task 2: Root routing, secret scan, Vercel config, prod smoke:** `0b3545b` (feat), `5832beb` (test). Both were pushed to `main`.

## Authentication Gates

- **Vercel did not deploy the first push.** GitHub showed no Vercel status, and the domain kept serving the first, empty build (`X-Vercel-Error: NOT_FOUND`). The user deployed from the dashboard and the build passed. The next push then deployed automatically. The npm warnings in the build log (`cache-dir`, an ESLint 9 support notice, the `unrs-resolver` install script) are harmless.

## Deviations from Plan

**1. [Rule 4 - User decision] The live site uses the DEV Supabase project**
- **Decided:** 2026-10-21. The user chose "Live site on DEV as a temporary demo only" after being told that tests wipe DEV.
- **Changes:** Vercel env vars in all scopes hold DEV values. The plan's `db:push:prod` / `db:status:prod` ran as `db:status:dev`; the migration was already applied. Threat T-01-39 (production secrets in previews) does not apply. The end-of-phase check where the real owner sets up the live site is deferred until a PRODUCTION project exists.
- **Risk accepted:** any test run deletes all live-site accounts and data and leaves a test owner behind. The live site currently shows "already set up" with a test owner.

**2. [Rule 3 - Blocking] The local Playwright webServer never became ready**
- **Issue:** The readiness probe hit `/`, which now redirects to `/pt/sign-in`. That route returns 404 until plan 01-11.
- **Fix:** `webServer.url` now points to `/pt/setup`, which always returns 200.
- **Commit:** 0b3545b

**3. [Rule 1 - Bug] The smoke test's Accept-Language was ignored**
- **Issue:** Chromium sends `Accept-Language` from the context locale (en-US), overriding `extraHTTPHeaders`, so the root test landed on `/en/`.
- **Fix:** Replaced it with `test.use({ locale: "pt-PT" })`.
- **Commit:** 5832beb

**4. [Addition] Scanner self-test**
- A planted `sb_secret_` marker in `.next/static` made `check:secrets` exit 1. The probe file was then removed.

---

**Total deviations:** 1 user-directed architecture change, 1 blocking fix, 1 test bug fix. **Impact:** the deploy pipeline is complete; the real-data production database is postponed.

## Issues Encountered

- `/{locale}/sign-in` still returns 404 until plan 01-11. Signed-out visitors to the live root land on that 404 page.
- Running any integration test or the local e2e `setup` project resets the database the live demo uses.

## Verification

- `npm run db:status:dev` → 20261021120000 is applied remotely (substitutes for db:status:prod)
- `npm run lint`, `npm run typecheck`, `npm run build` → exit 0. `npm run check:secrets` → 13 files, no secret material.
- `npx playwright test tests/e2e/locale.spec.ts tests/e2e/owner-setup.spec.ts tests/e2e/responsive-shell.spec.ts` → 44 passed
- `npm run test:e2e:prod` → 6 passed (desktop + phone; GET only)

## Self-Check: PASSED

- `vercel.json` contains `fra1` and no `crons` key. The crons/keep-alive grep over vercel.json and src exits 1.
- `cookbook_exists` is in `src/app/[locale]/page.tsx`. `origin/main` equaled `HEAD` after each push.

## Next Phase Readiness

Plan 01-10 (manual recipes) is next and is fully autonomous. Each later plan ships with the loop above, using `db:*:dev` in place of `db:*:prod` while the live site runs on DEV. Before real family use: create the PRODUCTION Supabase project, switch the Vercel Production-scope env vars to it, and set a production-only `OWNER_SETUP_CODE`.
