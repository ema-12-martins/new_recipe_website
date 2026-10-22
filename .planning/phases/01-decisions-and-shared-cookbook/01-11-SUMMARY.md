---
phase: 01-decisions-and-shared-cookbook
plan: 11
subsystem: auth
tags: [supabase, auth, nextjs, server-actions, i18n, playwright, security-definer]

requires:
  - 01-15 (memberships.locale with pt/en check constraint, test helpers)
  - 01-16 (getCurrentMembership, owner storageState for e2e, form/action pattern)
  - 01-17 (live Vercel deploy, check:secrets, test:e2e:prod ship loop)
  - 01-10 (recipes pages, hydration-guarded forms)
provides:
  - /{locale}/sign-in page with SignInForm (email + password, one generic error, no reset or magic link)
  - signInAction (lands in the member's remembered language; open-redirect-safe next) and signOutAction (scope local)
  - AppHeader on every member page (cookbook name, LanguageSwitcher, SignOutButton)
  - public.set_my_locale(text) security-definer function (pt/en only, authenticated only)
  - setLocaleAction + LanguageSwitcher (PT/EN toggle keeping the path; NEXT_LOCALE cookie; per-member memory)
  - safeNextPath / withLocale helpers in src/lib/auth/safe-next.ts
affects: [01-12, 01-13, 01-19, 01-14, 01-18]

actuals:
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Sign-in errors: any credential problem (validation, unknown email, wrong password) maps to one generic message"
    - "Sign-out uses auth.signOut({ scope: 'local' }) so other devices stay signed in"
    - "Per-member preferences are written through narrow security-definer RPCs; memberships keeps no client write policy"
    - "e2e contexts created with browser.newContext pass storageState { cookies: [], origins: [] } explicitly, because Playwright applies the project's use (owner storageState) to new contexts"

key-files:
  created:
    - supabase/migrations/20261021120200_member_locale.sql
    - src/app/[locale]/sign-in/page.tsx
    - src/app/[locale]/sign-in/actions.ts
    - src/app/[locale]/locale-actions.ts
    - src/components/sign-in-form.tsx
    - src/components/sign-out-button.tsx
    - src/components/language-switcher.tsx
    - src/components/app-header.tsx
    - src/lib/auth/safe-next.ts
    - tests/unit/safe-next.test.ts
    - tests/integration/member-locale.test.ts
    - tests/e2e/auth-devices.spec.ts
  modified:
    - src/app/[locale]/(app)/layout.tsx
    - src/i18n/messages/pt.json
    - src/i18n/messages/en.json

key-decisions:
  - "safeNextPath also rejects any next containing '://', a backslash or control characters, and a bare '/pt' without a trailing slash; the language switcher then falls back to /{locale}, which routes onward."
  - "The sign-in page forwards a next value only when safeNextPath would keep it unchanged, so a rejected value never reaches the form."
  - "Rate-limit and other non-credential Supabase errors show a separate 'could not sign in' message; only 400/invalid_credentials map to the generic credential message (no enumeration either way)."
  - "Switcher buttons show PT/EN with endonym accessible names (Português/English) from common.languageSwitcher and lang attributes; aria-pressed marks the current language."
  - "A failed set_my_locale call is logged (error code only) and does not block the switch in this browser."
  - "Ship loop used db:push:dev/db:status:dev instead of db:*:prod, following the 01-17 user decision (the live site is a DEV-backed demo)."

patterns-established:
  - "Member-only chrome lives in AppHeader, rendered by the (app) layout above <main>; pages keep their own h1"

requirements-completed: [AUTH-01, AUTH-04]

coverage:
  - id: D1
    description: "A member signs in with their own email and password and lands on the shared cookbook; wrong email or password shows one generic message"
    requirement: AUTH-01
    verification:
      - kind: e2e
        ref: "tests/e2e/auth-devices.spec.ts#wrong credentials show one generic message and stay on sign-in (4 viewport projects)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/auth-devices.spec.ts#a member sees the same cookbook on two devices and signs out on one only (4 viewport projects)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Sign-out ends the session on that device only; the same account stays signed in on another device, which sees recipes created on the first after reload"
    requirement: AUTH-04
    verification:
      - kind: e2e
        ref: "tests/e2e/auth-devices.spec.ts#a member sees the same cookbook on two devices and signs out on one only (4 viewport projects)"
        status: pass
    human_judgment: false
  - id: D3
    description: "No password reset, magic link or account self-deletion; the sign-in page explains to ask the owner (or operator) instead"
    requirement: AUTH-01
    verification:
      - kind: e2e
        ref: "tests/e2e/auth-devices.spec.ts#the sign-in page offers no password reset and explains what to do instead (4 viewport projects)"
        status: pass
      - kind: command
        ref: "git grep -e resetPasswordForEmail -e signInWithOtp -e updateUser -- src (no matches)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Post-sign-in redirect only follows same-site /pt/ or /en/ paths"
    requirement: AUTH-01
    verification:
      - kind: unit
        ref: "tests/unit/safe-next.test.ts (absolute, protocol-relative, backslash, scheme, control characters, missing locale)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/auth-devices.spec.ts#an absolute next value is ignored after sign-in (4 viewport projects)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Language switcher keeps the path, saves the choice per member, and a different browser signs in to the remembered language; signed-out visitors switch via cookie"
    requirement: AUTH-04
    verification:
      - kind: integration
        ref: "tests/integration/member-locale.test.ts (own row only, rejects fr, anon denied, direct membership update changes nothing)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/auth-devices.spec.ts#a member's language choice follows them to another browser (4 viewport projects)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/auth-devices.spec.ts#a signed-out visitor can switch language on the sign-in page (4 viewport projects)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Real phone + laptop as the same member: switch language on the laptop, sign out/in on the phone, confirm the remembered language"
    requirement: AUTH-04
    human_judgment: true
    rationale: "End-of-phase human check from the plan (human_verify_mode end-of-phase); needs real devices"
  - id: D7
    description: "Shipped: migration applied, Vercel deployed fec040f, live smoke green, live /pt/sign-in and /en/sign-in render with the switcher"
    verification:
      - kind: command
        ref: "npm run db:status:dev (20261021120200 applied remotely)"
        status: pass
      - kind: command
        ref: "npm run test:e2e:prod (6 read-only smoke tests)"
        status: pass
    human_judgment: false

duration: 26 min
completed: 2026-10-22
---

# Phase 1 Plan 11: Sign-in, per-device sign-out and remembered language Summary

**Email + password sign-in with one generic error and an open-redirect-safe landing, per-device sign-out, a member header on every page, and a PT/EN switcher whose choice is stored per member through a security-definer `set_my_locale` RPC and followed on every device.**

## Performance

- **Duration:** 26 min
- **Started:** 2026-10-22T07:31Z
- **Completed:** 2026-10-22T07:57Z
- **Tasks:** 2
- **Files:** 15 (12 created, 3 modified)

## Accomplishments

- Members sign in at `/{locale}/sign-in` and land on the shared cookbook in their remembered language. Unknown email and wrong password show the same message.
- Sign-out ends only this device's session. A second device signed in as the same member keeps working and sees recipes created on the first after a reload.
- There is no password reset, magic link or self-deletion. The sign-in page explains that a member asks the owner to remove and re-invite them, and the owner contacts the operator.
- `AppHeader` (cookbook name, language switcher, sign-out) appears on every member page.
- The PT/EN switcher keeps the current path, sets `NEXT_LOCALE`, and saves the choice on the membership. A German-language browser signing in as that member lands on `/en/recipes`.
- Live on https://newrecipewebsite.vercel.app (`fec040f`).

## Task Commits

1. **Task 1: Sign in on a second device and see the same cookbook (tracer)**: `0148c2c` (feat)
2. **Task 2: Remembered interface language per user (TDD)**: `85fa5f5` (test, RED), `fec040f` (feat, GREEN). The migration was pushed to DEV, then shipped to `main` and deployed by Vercel.

## Files Created/Modified

See `key-files` in the frontmatter.

## Deviations from Plan

**1. [Rule 1 - Test bug] New browser contexts inherited the owner's session**
- **Found during:** Task 1 e2e
- **Issue:** Playwright applies the project's `use` options, including the owner `storageState`, to `browser.newContext()`. Every "device" opened already signed in as the owner, so the sign-in form never appeared (16 of 16 failed).
- **Fix:** `openDevice` passes `storageState: { cookies: [], origins: [] }`.
- **Files modified:** tests/e2e/auth-devices.spec.ts
- **Verification:** auth-devices e2e passed in 4 viewport projects
- **Commit:** `0148c2c`

**2. [Rule 1 - Test bug] `getByRole("alert")` also matched the Next.js route announcer**
- **Found during:** Task 1 e2e
- **Fix:** The alert is matched by its text (`filter({ hasText })`).
- **Commit:** `0148c2c`

**3. [User decision carried from 01-17] The ship loop used DEV**
- `db:push:prod` / `db:status:prod` ran as `db:push:dev` / `db:status:dev`, because no PRODUCTION Supabase project exists yet.

**4. [Additive] Extra tests and a helper beyond the plan's list**
- `withLocale()` was exported next to `safeNextPath()` so both actions rewrite the first path segment the same way.
- Added an e2e check that an absolute `next` is ignored, and an integration check that a member's direct `memberships` update changes nothing.

**Total deviations:** 2 test fixes, 1 carried user decision, 1 additive change. **Impact:** none on scope.

## Issues Encountered

- The language switcher is on the sign-in page and on every member page, as the plan's file list specifies. It is not on the one-time owner setup page, which is only reachable before the cookbook exists. The verifier should confirm that this meets the "every page" truth.
- Running integration or local e2e tests wipes the DEV database that the live demo uses (accepted in 01-17).

## User Setup Required

None.

## Next Phase Readiness

- Ready for 01-12 (one-time invite links and guided join). Invited members will use this sign-in page, header and language memory.
- End-of-phase human check to add to the list: on a phone and a laptop signed in as the same member, switch language on the laptop, then sign out and back in on the phone and confirm the remembered language.

## Self-Check: PASSED

- Files exist: all 12 created files are present.
- Commits exist: `0148c2c`, `85fa5f5`, `fec040f` are on `main` and pushed.
- Verification: unit 26/26, integration 24/24 (member-locale 4/4), full local e2e 88/88, `test:e2e:prod` 6/6, migration `20261021120200` applied remotely.
