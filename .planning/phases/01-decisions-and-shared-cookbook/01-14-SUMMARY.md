---
phase: 01-decisions-and-shared-cookbook
plan: 14
subsystem: offline
tags: [service-worker, indexeddb, offline, nextjs, playwright]

requires:
  - phase: 01-19
    provides: Member-page authorization guards and membership user identity
provides:
  - Offline access to recipes opened by the signed-in member on this browser
  - Localized offline notice and disabled recipe submission while disconnected
  - Static offline reader and service worker that caches only generic offline assets and static build files
affects: [01-18, offline-privacy]

actuals:
  tokens: 19811
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Store only recipes explicitly opened on this browser in IndexedDB, associated with the current owner"
    - "Use a same-origin service worker network-first navigation fallback without caching authenticated HTML or API responses"
    - "Use useSyncExternalStore with navigator.onLine for reactive connectivity state and an online server snapshot"

key-files:
  created:
    - public/sw.js
    - public/offline.html
    - public/offline.js
    - src/lib/offline/constants.ts
    - src/lib/offline/store.ts
    - src/lib/offline/use-online-status.ts
    - src/components/offline-notice.tsx
    - src/components/service-worker-registrar.tsx
    - src/components/remember-recipe-offline.tsx
    - tests/unit/offline-assets.test.ts
    - tests/e2e/offline.spec.ts
  modified:
    - next.config.ts
    - src/app/[locale]/(app)/layout.tsx
    - src/app/[locale]/(app)/recipes/[id]/page.tsx
    - src/components/recipe-form.tsx
    - src/i18n/messages/pt.json
    - src/i18n/messages/en.json

key-decisions:
  - "Keep the offline cache non-installable: no web app manifest, and no caching of authenticated pages, API responses, or Supabase traffic."
  - "Clear cached recipes when a different account becomes the offline-store owner; sign-out purge and reconnect authorization remain in plan 01-18."
  - "Do not queue recipe writes while offline; disable the submit action and explain that editing needs a connection."
  - "Keep plan 01-14 local and unpushed; plan 01-18 must ship the offline reader together with its purge guarantees."

patterns-established:
  - "Offline reader values are rendered with textContent rather than interpreted as HTML."
  - "Client connectivity state uses useSyncExternalStore and renders online on the server to preserve hydration."

requirements-completed: [AUTH-04]

coverage:
  - id: D1
    description: "Recipes explicitly opened on this browser remain readable after disconnecting and reloading; unopened recipes are not available offline."
    requirement: AUTH-04
    verification:
      - kind: e2e
        ref: "tests/e2e/offline.spec.ts#an opened recipe survives reload offline while an unopened recipe is unavailable (desktop-chromium, phone-chromium, phone-webkit)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The offline recipe list contains only recipes opened on this device."
    requirement: AUTH-04
    verification:
      - kind: e2e
        ref: "tests/e2e/offline.spec.ts#an opened recipe survives reload offline while an unopened recipe is unavailable"
        status: pass
    human_judgment: false
  - id: D3
    description: "The member app updates its offline notice immediately, disables new and edit recipe submissions, and does not send an offline form request."
    requirement: AUTH-04
    verification:
      - kind: e2e
        ref: "tests/e2e/offline.spec.ts#the offline notice appears and clears without reloading; the new recipe form cannot submit while offline; the edit form cannot submit while offline"
        status: pass
    human_judgment: false
  - id: D4
    description: "The app has no installable manifest, uses safe text rendering, and the worker caches runtime responses only for static build assets."
    requirement: AUTH-04
    verification:
      - kind: unit
        ref: "tests/unit/offline-assets.test.ts#offline assets"
        status: pass
    human_judgment: false

duration: 36min
completed: 2026-10-22
status: complete
---

# Phase 1 Plan 14: Offline Recipe Reading Summary

**Opened recipes are readable after a connection drop, while offline navigation exposes only the recipes saved on that browser and recipe writes remain disabled.**

## Performance

- **Duration:** 36 min
- **Started:** 2026-10-22T10:46:19Z
- **Completed:** 2026-10-22T11:22:33Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments

- Added a service worker and static offline reader backed by IndexedDB, storing only recipes a member opened and clearing the previous account's cache when ownership changes.
- Added a live, localized offline banner and disabled recipe submission on both new and edit forms while offline; no writes are queued.
- Added tests proving saved-recipe rendering, offline-list filtering, unopened-recipe unavailability, no installable manifest, safe text rendering, and static-only runtime caching.

## Task Commits

1. **Task 1: End-to-end offline recipe reading** - `76a8d44` (feat)
2. **Task 2: Offline notice and write prevention** - `76a8d44` (feat; integrated with the offline reader)
3. **Offline saved-recipe list assertion** - `c954100` (test)
4. **Plan metadata** - recorded in this summary commit (docs)

## Files Created/Modified

- `public/sw.js`, `public/offline.html`, `public/offline.js` - Network-first page navigation with a static offline fallback and safe IndexedDB rendering.
- `src/lib/offline/constants.ts`, `src/lib/offline/store.ts` - Offline database schema, recipe persistence, ownership switching, and purge helper.
- `src/lib/offline/use-online-status.ts`, `src/components/offline-notice.tsx` - Reactive connectivity hook and translated notice.
- `src/components/service-worker-registrar.tsx`, `src/components/remember-recipe-offline.tsx` - Service worker setup and saving only recipes opened by a member.
- `src/components/recipe-form.tsx`, `src/app/[locale]/(app)/layout.tsx`, `src/app/[locale]/(app)/recipes/[id]/page.tsx` - Offline form protection, notice mounting, and recipe cache wiring.
- `src/i18n/messages/pt.json`, `src/i18n/messages/en.json` - Portuguese and English offline copy.
- `next.config.ts` - Prevents stale service-worker script caching.
- `tests/unit/offline-assets.test.ts`, `tests/e2e/offline.spec.ts` - Static asset constraints and browser coverage.

## Decisions Made

- Used a non-installable service worker and IndexedDB rather than a PWA manifest.
- Kept authenticated HTML, API, and Supabase responses out of the service-worker cache.
- Preserved page-level `requireMembership(locale)` guards and the existing form hydration gate.
- Kept the implementation local and unpushed so plan 01-18 can deliver it with the privacy protections.

## Deviations from Plan

### Auto-fixed Issues

**1. The offline reader script was cached but not served while offline**
- **Found during:** Task 1 browser verification.
- **Issue:** Offline navigation returned the generic HTML page, but its script could not load, so cached recipes did not render.
- **Fix:** Added a service-worker cache response for the precached `/offline.js` asset.
- **Files modified:** `public/sw.js`.
- **Verification:** Offline reload and unopened-recipe checks passed on desktop Chromium, phone Chromium, and phone WebKit.

**2. The test did not verify the saved-recipe list**
- **Found during:** Final acceptance review.
- **Issue:** The initial end-to-end assertions checked an opened recipe and an unopened URL but not the offline index.
- **Fix:** Asserted that the offline list includes the opened recipe and excludes the unopened recipe.
- **Files modified:** `tests/e2e/offline.spec.ts`.
- **Verification:** Desktop Chromium, phone Chromium, and phone WebKit offline suites passed.

**Impact on plan:** The fixes completed the stated offline-reader behavior and tightened its verification without expanding the feature scope.

## Issues Encountered

- The optional phone WebKit run initially could not start because the Playwright WebKit binary was not installed. Installed the browser and reran the suite successfully.
- The online recovery assertion initially observed the still-rendered offline page because the test did not wait for the navigation initiated on reconnect. It now waits for that navigation explicitly.

## User Setup Required

No new external-service configuration. End-to-end tests require the existing DEV-only Supabase test setup and reset permission; do not enable destructive database reset against production.

## Next Phase Readiness

Plan 01-14 is complete locally and remains unpushed. Plan 01-18 is next and must add sign-out/sign-in purge and reconnect reauthorization before shipping both plans together.

---
*Phase: 01-decisions-and-shared-cookbook*
*Completed: 2026-10-22*
