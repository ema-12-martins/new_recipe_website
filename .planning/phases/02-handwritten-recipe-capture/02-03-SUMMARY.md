---
phase: 02-handwritten-recipe-capture
plan: 03
subsystem: photos
tags: [supabase-storage, rls, indexeddb, offline, service-worker, nextjs, playwright, vitest]

requires:
  - 02-02 (recipe_photos, PhotoPicker, photo route, upload-on-save)
  - 01-14, 01-18 (offline store, sign-out purge, reauthorization)
provides:
  - edit-form photo section: add, reorder, remove (with confirmation) on any saved recipe, including a manually typed one
  - photo changes applied by the same versioned save; a lost save applies nothing and its uploads are deleted
  - set_recipe_photo_order (one-statement renumbering) and an update policy for members
  - offline IndexedDB version 2 with a photos store; opened recipes keep their photos for offline reading
  - STATIC_CACHE v2 and an updated offline reader that shows photos
affects: [02-04]

actuals:
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "applyPhotoChanges(order): remove what is not listed, insert new rows into free positions, renumber with one RPC; repeating it converges"
    - "Photos cached offline only for opened recipes, replaced as a whole; the sign-out purge deletes the whole database so photos go with it, and the owner-change path clears both stores in one transaction"

key-files:
  created:
    - supabase/migrations/20261023120200_recipe_photos_edit.sql
    - src/lib/photos/apply-changes.ts
    - tests/integration/recipe-photos-edit.test.ts
    - tests/e2e/photo-edit.spec.ts
    - tests/e2e/offline-photos.spec.ts
  modified:
    - src/components/{recipe-form,photo-picker,remember-recipe-offline}.tsx
    - src/app/[locale]/(app)/recipes/{actions.ts,[id]/page.tsx,[id]/edit/page.tsx}
    - src/lib/offline/{constants,store}.ts, src/lib/photos/upload.ts
    - public/{offline.js,offline.html,sw.js}
    - src/i18n/messages/{pt,en}.json
    - tests/unit/offline-assets.test.ts, tests/e2e/{offline,offline-privacy}.spec.ts

key-decisions:
  - "Unused uploads from a lost save are deleted on the server (service role), not by the browser: after the direct bucket read policy was dropped in 02-02, a member's own delete through Storage silently did nothing."
  - "A save whose photo step fails after the text update matched returns an error; the form still holds the old version, so the retry reports a conflict. Accepted for now (rare: the files were verified first)."
  - "Phase 1 offline e2e specs open IndexedDB without a version number, because the schema is now version 2."

requirements-completed: [RECP-02]

duration: one session
completed: 2026-10-23
---

# Phase 2 Plan 03: Edit photos and read them offline

Members can add, reorder and remove the photos of any saved recipe, and the photos of recipes they have opened stay readable offline on that device, with the same purge rules as the recipe text.

## Verification

- Unit 67/67, integration 65/65 (9 new for photo edits), typecheck, lint, build and `check:secrets` clean.
- Full e2e: 184 passed, 28 skipped (WebKit offline cases, by design), 0 failed. The new `photo-edit.spec.ts` (4 tests) and `offline-photos.spec.ts` (2 tests) pass; the Phase 1 offline suites still pass.
- Migration 20261023120200 is applied on DEV; production still has no project.

## Deviations from the plan

- Cleanup of uploads from a lost save moved from the browser to the server (see key-decisions).
- Offline-photos e2e runs on Chromium only, like the Phase 1 offline suites; the offline e2e helpers changed to open the database without a hard-coded version.

## Open items

- Real-device check: open a recipe with photos online on an iPhone and an Android phone, go to airplane mode, reload; sign out and confirm the photos are gone.
- The account-switch and lost-access purge paths are covered through the shared purge (whole database) and the owner-change transaction; there is no dedicated photo assertion for them.
- The photo-step-failure-after-text-update case (see key-decisions).

## Self-Check: PASSED (automated); human device check pending
