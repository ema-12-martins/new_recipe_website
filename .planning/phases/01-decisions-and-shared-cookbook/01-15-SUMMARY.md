---
phase: 01-decisions-and-shared-cookbook
plan: 15
subsystem: data
tags: [supabase, postgres, rls, auth, vitest, shadcn, i18n]

requires:
  - 01-09 (Next.js shell, src/proxy.ts locale redirect, approved packages)
provides:
  - Supabase clients — src/lib/supabase/server.ts (createClient, RLS-scoped), admin.ts (createAdminClient, server-only), proxy.ts (updateSession)
  - Migration 20261021120000 on the hosted DEV database — cookbooks (singleton) + memberships (one owner), RLS, is_member/is_owner/current_cookbook_id/cookbook_exists, service-role-only claim_owner
  - scripts/supabase-db.mjs + npm scripts db:push|status:dev|prod, typecheck, test:unit, test:integration, test:e2e
  - Vitest harness with DEV-guarded resetDatabase and createTestUser/userClient/anonClient helpers
  - Data-boundary integration test (Auth settings, signup_disabled, RLS zero rows, claim_owner denied, owner reads own)
  - shadcn/ui initialized (components.json, local cn in src/lib/utils.ts, neutral theme) and pt/en message parity unit test
affects: [01-16, 01-17, 01-10, 01-11, 01-12, 01-13, 01-19, 01-14, 01-18]

actuals:
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Every data table carries cookbook_id references cookbooks(id) on delete cascade; resetDatabase deletes cookbooks then all auth users"
    - "RLS helpers are SECURITY DEFINER with search_path '' and explicit grants; privileged writes only through service-role RPCs"
    - "Policies are `to authenticated`; anon gets explicit SELECT grants but no policy, so it reads zero rows instead of erroring"
    - "Integration tests run against hosted DEV with fileParallelism false; .env.local loaded via Vite loadEnv"
    - "shadcn components import cn from @/lib/utils; the npm package 'cn' is never installed"

key-files:
  created:
    - .env.example
    - src/lib/supabase/server.ts
    - src/lib/supabase/admin.ts
    - src/lib/supabase/proxy.ts
    - supabase/config.toml
    - supabase/.gitignore
    - supabase/migrations/20261021120000_cookbook_membership.sql
    - scripts/supabase-db.mjs
    - vitest.config.ts
    - tests/helpers/supabase-admin.ts
    - tests/integration/data-boundary.test.ts
    - tests/unit/i18n-messages.test.ts
    - components.json
    - src/lib/utils.ts
  modified:
    - src/proxy.ts
    - package.json
    - src/app/globals.css

key-decisions:
  - "PRODUCTION Supabase project deferred by user ('ignore production, it's not needed' for now); SUPABASE_PROD_DB_URL is empty and must be filled, with the same Auth settings, before 01-17's production push."
  - "shadcn init done by hand from the new-york-v4 registry JSON because the CLI has no skip-install option and its utils item depends on the rejected 'cn' package (and its default preset is now base-nova / Base UI, not the approved radix-ui)."
  - "The sign-up refusal test first asserts GET /auth/v1/settings (disable_signup, mailer_autoconfirm) and only then probes signUp, so a misconfigured project fails fast without creating an account or sending an email."

requirements-completed: [AUTH-01, AUTH-03]

coverage:
  - id: D1
    description: "Hosted DEV database has migration 20261021120000 applied (cookbooks/memberships, RLS, helper functions, claim_owner)"
    requirement: AUTH-03
    verification:
      - kind: other
        ref: "npm run db:status:dev → local 20261021120000 / remote 20261021120000"
        status: pass
    human_judgment: false
  - id: D2
    description: "Public sign-up is refused (signup_disabled) and creates no account; Auth settings have sign-ups and email confirmation off"
    requirement: AUTH-01
    verification:
      - kind: integration
        ref: "tests/integration/data-boundary.test.ts#refuses a public sign-up and creates no account"
        status: pass
      - kind: integration
        ref: "tests/integration/data-boundary.test.ts#has public sign-ups and email confirmation turned off in Auth settings"
        status: pass
    human_judgment: false
  - id: D3
    description: "Anonymous and non-member users read zero cookbook/membership rows and cannot execute claim_owner; owner reads exactly its cookbook and membership; cookbook_exists works without sign-in"
    requirement: AUTH-03
    verification:
      - kind: integration
        ref: "tests/integration/data-boundary.test.ts (4 boundary tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Proxy session refresh keeps 01-09 locale routing intact"
    verification:
      - kind: e2e
        ref: "tests/e2e/locale.spec.ts (36 tests, 4 viewport projects)"
        status: pass
    human_judgment: false
  - id: D5
    description: "shadcn/ui initialized without new packages; pt/en message key parity and non-empty strings enforced"
    verification:
      - kind: unit
        ref: "tests/unit/i18n-messages.test.ts"
        status: pass
      - kind: other
        ref: "npm run lint; npm run typecheck; package.json/package-lock.json unchanged by Task 3"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-10-21
status: complete
---

# Phase 1 Plan 15: Hosted Supabase Data Boundary Summary

**The app now talks to a hosted EU Supabase DEV project whose membership schema enforces RLS. Public sign-up is rejected with `signup_disabled` and creates no account. Anonymous visitors and non-members read zero rows and cannot call `claim_owner`. All of this is proved by a 6-test integration suite against the live database.**

## Performance

- **Duration:** ~25 min of execution after resume (14:54Z–15:19Z), including a second human dashboard step
- **Tasks:** 3 / 3
- **Files:** 14 created, 3 modified

## Accomplishments

- Supabase server/admin/proxy clients following the current `@supabase/ssr` pattern (`getClaims()` in the proxy; cache headers forwarded from `setAll`).
- `src/proxy.ts` now returns `updateSession(request)` for locale paths; redirect logic unchanged.
- Migration `20261021120000_cookbook_membership.sql` pushed to DEV and confirmed by `migration list`.
- `scripts/supabase-db.mjs` runs the local CLI through `node` with no shell and masks the connection string in all output.
- DEV-guarded `resetDatabase()`: it refuses to run unless `ALLOW_TEST_DB_RESET=true` and the URL host starts with `SUPABASE_DEV_PROJECT_REF`.
- shadcn/ui configured (`components.json`, neutral theme, local `cn`), with the message-parity unit test.

## Task Commits

1. **Task 1: Supabase projects + .env.local (human):** verified on resume. No commit (setup was recorded earlier in `c1b1115`).
2. **Task 2: Clients, migration, DEV push, harness, data-boundary test:** `bbdc658` (feat)
3. **Task 3: Message parity test + shadcn init:** `5676e75` (test), `0713818` (feat)

## Authentication Gates

- **DEV Auth settings were wrong on first run.** `GET /auth/v1/settings` reported `disable_signup=false` and `mailer_autoconfirm=false`, so public sign-up was open and "Confirm email" was on. The human changed both in the dashboard. The re-check showed `true`/`true`, and all 6 integration tests passed.
- **Observed sign-up rejection code:** `signup_disabled` (asserted by the test).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The sign-up probe could not prove the gate**
- **Found during:** Task 2
- **Issue:** Hosted Auth rejects `@example.com` with `email_address_invalid` before it checks the sign-up gate, so the plan's probe address could pass even with sign-ups enabled.
- **Fix:** Added an Auth-settings assertion test. The probe now re-checks `disable_signup` before calling `signUp`, so it cannot create an account or send email, and uses a real-looking domain.
- **Files modified:** tests/integration/data-boundary.test.ts
- **Verification:** The test failed against the misconfigured project and passed after the dashboard fix.
- **Commit:** bbdc658

**2. [Rule 3 - Blocking] `shadcn init` would install the rejected `cn` package**
- **Found during:** Task 3
- **Issue:** The registry `utils` item is `export { cn } from "cn"` with dependency `cn`. The CLI has no option to skip installs, and its default preset is now `base-nova` (Base UI).
- **Fix:** Wrote the init output by hand from the `new-york-v4` registry JSON: `components.json`, a `clsx` + `tailwind-merge` `cn`, and the neutral theme. Dark mode keeps following `prefers-color-scheme`, as it did in 01-09. Nothing was installed.
- **Files modified:** components.json, src/lib/utils.ts, src/app/globals.css
- **Verification:** lint, typecheck, unit tests and desktop e2e (production build) pass. package.json and the lockfile are unchanged.
- **Commit:** 0713818

**3. [Rule 2 - Missing critical] Explicit table and function grants in the migration**
- **Found during:** Task 2
- **Issue:** The test results depended on project default privileges. Without SELECT grants, anon would get a permission error instead of zero rows.
- **Fix:** Added explicit `grant select` on both tables to anon/authenticated, explicit execute grants on the helpers, and `revoke ... from public, anon, authenticated` on `claim_owner`.
- **Commit:** bbdc658

**4. [Rule 2 - Missing critical] Local `supabase/config.toml` Auth settings aligned with D-29/D-30**
- **Found during:** Task 2
- **Fix:** Set `enable_signup = false` (global and email) and `minimum_password_length = 8`, so a future `config push` cannot reopen sign-ups.
- **Commit:** bbdc658

**5. [Scope - user decision] PRODUCTION project deferred**
- `SUPABASE_PROD_DB_URL` is empty. `db:push:prod` and `db:status:prod` exit with a clear message until it is filled. Required before 01-17.

---

**Total deviations:** 4 auto-fixed (1 bug, 1 blocking, 2 missing critical) plus 1 user-directed deferral. **Impact:** no change to the architecture contract. The security posture is stronger than planned.

## Issues Encountered

- Vitest prints a Vite `configLoader: 'native'` advisory because package.json has no `"type": "module"`. It is cosmetic, and the file name `vitest.config.ts` is kept because the acceptance criteria grep it.
- The PRODUCTION Supabase project still needs to be created and configured with the same Auth settings before 01-17.

## Verification

- `npm run db:status:dev` → 20261021120000 local = remote
- `npm run test:integration -- tests/integration/data-boundary.test.ts` → 6 passed
- `npm run test:unit -- tests/unit/i18n-messages.test.ts` → 4 passed. Drift was proven to fail by temporarily breaking pt.json (2 failures), then restoring it.
- `npm run lint`, `npm run typecheck` → exit 0
- `npx playwright test tests/e2e/locale.spec.ts` → 36 passed (all viewports)

## Self-Check: PASSED

- Task 2 acceptance criteria: `claim_owner` appears on 3 lines; singleton and one-owner indexes are present; exactly 2 `enable row level security` lines; `server-only` in admin.ts; no `NEXT_PUBLIC_SUPABASE_SECRET`; `ALLOW_TEST_DB_RESET` in the helper; `'@'` and `server-only` aliases in vitest.config.ts; `updateSession` in src/proxy.ts.
- Task 3 acceptance criteria: components.json exists; `export function cn` appears once; every dependency is on the 01-09 approved list.

## Next Phase Readiness

Ready for 01-16 (owner setup flow), which uses `claim_owner`, `cookbook_exists`, the admin client and shadcn button/input/label. Before 01-17: create or configure the PRODUCTION project and fill `SUPABASE_PROD_DB_URL`.
