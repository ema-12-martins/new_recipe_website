---
phase: 01-decisions-and-shared-cookbook
plan: 18
subsystem: offline-privacy
tags: [supabase, indexeddb, service-worker, nextjs, playwright, vercel]

requires:
  - phase: 01-14
    provides: Offline recipe storage, service worker reader, and useOnlineStatus
  - phase: 01-19
    provides: Membership-status classification for member, none, and unavailable states
provides:
  - Cache purge before local sign-out and on sign-in page mount
  - Account ownership verification when the member app loads
  - No-store session reauthorization endpoint and reconnect handling
  - Offline reading and its privacy protections deployed together
affects: [phase-1-verification, offline-privacy]

actuals:
  tokens: 6457
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Reauthorize on connectivity restoration with a no-store session request; redirect and purge only on confirmed denial"
    - "Preserve offline cache and display a retry notice when session reauthorization is unavailable"
    - "Purge IndexedDB before invoking the local sign-out server action"

key-files:
  created:
    - src/app/api/session/route.ts
    - src/components/offline-session.tsx
    - src/components/purge-offline-on-mount.tsx
    - tests/e2e/offline-privacy.spec.ts
  modified:
    - src/components/sign-out-button.tsx
    - src/components/app-header.tsx
    - src/app/[locale]/sign-in/page.tsx
    - src/app/[locale]/(app)/layout.tsx
    - src/i18n/messages/pt.json
    - src/i18n/messages/en.json

key-decisions:
  - "A confirmed 401 is the only reconnect response that purges cached recipes and redirects to no-access sign-in."
  - "A 503 or failed fetch is an outage, not a denial: retain cached recipes and show a retryable notice."
  - "Purge failures are logged and shown; a denied session still navigates to sign-in so the page can retry the purge."
  - "Offline reading and its purge/reauthorization guarantees were pushed to main together."

patterns-established:
  - "Session reauthorization returns only membership status and the authenticated user ID, with Cache-Control: no-store."
  - "Sign-out submits only after the browser's offline database has been purged."

requirements-completed: [AUTH-04]

coverage:
  - id: D1
    description: "Signing out clears an opened recipe, and a removed member's sign-in page purges cached recipe data."
    requirement: AUTH-04
    verification:
      - kind: e2e
        ref: "tests/e2e/offline-privacy.spec.ts#signing out clears a previously opened recipe before it can be read offline; the sign-in page clears cached recipes after membership is removed"
        status: pass
    human_judgment: false
  - id: D2
    description: "A second member on the same browser cannot read recipes cached by the prior member."
    requirement: AUTH-04
    verification:
      - kind: e2e
        ref: "tests/e2e/offline-privacy.spec.ts#a second member sees no recipes cached for the first member"
        status: pass
    human_judgment: false
  - id: D3
    description: "On reconnect, revoked access purges the cache and redirects to no-access sign-in; valid access stays on the recipe and refreshes."
    requirement: AUTH-04
    verification:
      - kind: e2e
        ref: "tests/e2e/offline-privacy.spec.ts#revoked access on reconnect clears cached recipes and returns to sign-in; a valid member stays on the recipe and refreshes after reconnect"
        status: pass
    human_judgment: false
  - id: D4
    description: "A 503 response or network failure keeps cached data and shows a retry notice; the session route distinguishes anonymous and member requests without caching."
    requirement: AUTH-04
    verification:
      - kind: e2e
        ref: "tests/e2e/offline-privacy.spec.ts#outage reconnect cases and the session endpoint is private and distinguishes anonymous from member requests"
        status: pass
    human_judgment: false
  - id: D5
    description: "Offline reading and the privacy protections were deployed together, and the production site responds to read-only smoke checks."
    requirement: AUTH-04
    verification:
      - kind: other
        ref: "Vercel status for b206cb4: success; npm run test:e2e:prod: 6 passed"
        status: pass
    human_judgment: false
  - id: D6
    description: "On an iPhone Safari and Android Chrome production URL, an opened recipe remains readable in airplane mode, sign-out clears it, and the browser shows no install-app prompt."
    requirement: AUTH-04
    verification: []
    human_judgment: true
    rationale: "Requires real devices, airplane mode, and inspection of browser install UI."

duration: 35min
completed: 2026-10-22
status: complete
---

# Phase 1 Plan 18: Offline Privacy and Reauthorization Summary

**Cached family recipes are purged before sign-out and after revoked access, while reconnect outages retain the cache and ask the member to retry.**

## Performance

- **Duration:** 35 min
- **Started:** 2026-10-22T11:22:33Z
- **Completed:** 2026-10-22T11:57:29Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Added a purge-before-sign-out flow and a sign-in page purge component, with visible error feedback if local data cannot be cleared.
- Added `GET /api/session` with 200 member, 401 no-access, and 503 unavailable outcomes, all marked `Cache-Control: no-store`.
- Added reconnect reauthorization: revoked sessions purge and redirect, valid sessions refresh in place, and outages retain cached recipes with a retry notice.
- Deployed the code with Plan 01-14 to `main`; Vercel completed successfully and the read-only production smoke suite passed.

## Task Commits

1. **Task 1: Purge cached data on sign-out and sign-in** - `b206cb4` (feat; integrated with task 2)
2. **Task 2: Reauthorize on reconnect and ship offline privacy** - `b206cb4` (feat)
3. **Plan metadata** - recorded in this summary commit (docs)

## Files Created/Modified

- `src/components/sign-out-button.tsx` - Purges IndexedDB before submitting the local sign-out action and displays purge errors.
- `src/components/purge-offline-on-mount.tsx` - Clears offline recipe storage when the sign-in page is mounted.
- `src/components/offline-session.tsx` - Verifies cache ownership on app mount and reauthorizes after reconnect.
- `src/app/api/session/route.ts` - Returns membership status without caching or exposing cookbook data.
- `src/app/[locale]/(app)/layout.tsx`, `src/components/app-header.tsx`, `src/app/[locale]/sign-in/page.tsx` - Wire the purge and reconnect components.
- `src/i18n/messages/pt.json`, `src/i18n/messages/en.json` - Add translated cache-clear failure feedback.
- `tests/e2e/offline-privacy.spec.ts` - Covers sign-out, sign-in purge, account switch, reconnect, outages, and endpoint behavior.

## Decisions Made

- A 401 is the only response that purges cached recipes and redirects; a 503 or network failure remains a recoverable outage.
- The endpoint returns only a boolean result and the authenticated user ID, with no-store headers.
- The browser submit button is disabled during purge, and the sign-out server action is not invoked until purge succeeds.
- Privacy reauthorization checks run only in Chromium, as required by the plan's offline-emulation scope.

## Deviations from Plan

### Auto-fixed Issues

**1. The offline privacy tests needed a hard navigation to become service-worker controlled**
- **Found during:** Task 1 browser verification.
- **Issue:** The worker was active but a test page created through a client-side action redirect did not yet have a controller.
- **Fix:** Reopened the recipe URL before checking service-worker control and IndexedDB persistence.
- **Files modified:** `tests/e2e/offline-privacy.spec.ts`.
- **Verification:** The privacy and offline suites passed on desktop and phone Chromium.

**2. The privacy checks were explicitly scoped to Chromium**
- **Found during:** Full local Playwright run.
- **Issue:** WebKit's connectivity emulation did not reliably trigger the reauthorization path, while the plan requires Chromium coverage and a best-effort WebKit check only for offline reading.
- **Fix:** Skipped offline-privacy reauthorization tests outside Chromium; kept the separate best-effort offline-reading WebKit checks.
- **Files modified:** `tests/e2e/offline-privacy.spec.ts`.
- **Verification:** Full local E2E run passed with 136 passed and 24 skipped; all required privacy checks passed on desktop and phone Chromium.

**Impact on plan:** The implementation and required verification were completed; WebKit skip scope matches the plan.

## Issues Encountered

- `PRODUCTION_URL` was not set in `.env.local`; used the repository's configured public Vercel URL for the read-only production smoke test without changing local configuration.
- The final sign-in-page purge test initialized the IndexedDB schema when polling for deletion, avoiding a test-created schema-less database.
- The Vercel deployment check for `b206cb4` completed successfully before production smoke testing.

## User Setup Required

No new external setup. The complete production smoke suite can be run with `PRODUCTION_URL` set to the deployed Vercel URL.

## Next Phase Readiness

Plan 01-14 and plan 01-18 are deployed together. The remaining acceptance check is the real-device end-of-phase test on iPhone Safari and Android Chrome; see coverage D6.

---
*Phase: 01-decisions-and-shared-cookbook*
*Completed: 2026-10-22*
