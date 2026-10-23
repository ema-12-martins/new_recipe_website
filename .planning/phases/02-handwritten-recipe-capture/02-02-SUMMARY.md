---
phase: 02-handwritten-recipe-capture
plan: 02
subsystem: photos
tags: [supabase-storage, rls, nextjs, app-router, browser-image-resize, playwright, vitest]

requires:
  - 01-10 (recipes, idempotent createRecipe, RecipeForm, server-issued recipe id)
  - 01-19 (requireMembership guard on every (app) page)
provides:
  - private bucket recipe-photos and table recipe_photos (RLS, 6-photo trigger, path derived from ids)
  - /{locale}/recipes/capture: choose, reorder and remove up to 6 photos, then type the recipe (Skip - type it myself)
  - upload-on-save: nothing leaves the browser until Save; idempotent createRecipeWithPhotos
  - GET /api/recipes/[recipeId]/photos/[photoId] (membership-checked, Cache-Control private, no-store)
  - "Original photos" section and viewer on the recipe page; "Add from photos" on the list page
  - leave-without-saving guard (beforeunload plus in-app links)
affects: [02-03, 02-04]

actuals:
  tasks: 3
  commits: 1

tech-stack:
  added: []
  patterns:
    - "Photos are uploaded by the browser straight to Storage at Save, keyed by the server-issued recipe id; the save action verifies the files, inserts the recipe idempotently, then inserts only the missing photo rows"
    - "Files are read only by the application: the route authorises with the member's session (membership and the photo row under RLS) and then fetches the file with the service role"
    - "Photo state updates use functional setState; a ref mirrored from props in an effect lost photos in WebKit"

key-files:
  created:
    - supabase/migrations/20261023120000_recipe_photos.sql
    - supabase/migrations/20261023120100_recipe_photos_fix.sql
    - src/lib/photos/{limits,paths,schema,resize,queries,upload}.ts
    - src/lib/supabase/browser.ts
    - src/components/{capture-flow,photo-picker,photo-gallery,use-leave-guard,use-hydrated}.tsx|ts
    - src/components/ui/{alert,alert-dialog,dialog}.tsx
    - src/app/[locale]/(app)/recipes/capture/page.tsx
    - src/app/api/recipes/[recipeId]/photos/[photoId]/route.ts
    - tests/helpers/images.ts, tests/unit/photo-limits.test.ts
    - tests/integration/{recipe-photos-rls,recipe-create-with-photos}.test.ts
    - tests/e2e/photo-capture.spec.ts
  modified:
    - src/components/recipe-form.tsx, src/lib/recipes/create-recipe.ts
    - src/app/[locale]/(app)/recipes/{actions.ts,page.tsx,[id]/page.tsx}
    - src/i18n/messages/{pt,en}.json
    - scripts/check-client-bundle.mjs, tests/e2e/locale.spec.ts

key-decisions:
  - "Direct SELECT on the bucket was dropped (migration 20261023120100). Testing showed a member who had just downloaded a file could keep downloading it for at least 8 seconds after their membership was removed; routing every read through the application closes that."
  - "The service-role client is used only after the membership and photo-row checks pass, for the file read in the photo route and for the file listing in the save action. This is a deliberate exception to the admin client's 'never for member data' note."
  - "Test photos are generated PNGs (tests/helpers/images.ts), not committed JPEG fixtures; prepareJpeg converts them, so the resize path is exercised."
  - "check:secrets now matches sb_secret_ followed by key characters: the browser Supabase client bundles supabase-js, which contains the bare prefix. A planted key is still caught."
  - "shadcn add attempted to add the unrelated npm package 'cn' to package.json; it was reverted (no dependency change) and the generated files import cn from @/lib/utils. alert-dialog was written by hand in the same style."

requirements-completed: [CAPT-01, CAPT-04, RECP-02]

duration: one session
completed: 2026-10-23
---

# Phase 2 Plan 02: Capture photos, type the recipe, save, see the originals

A member can add up to 6 photos of a handwritten recipe, reorder or remove them, type the recipe, save, and then see the original photos on the recipe page. Nothing is uploaded or stored until Save, and manual entry is always available.

## Verification

- Unit 66/66; integration 56/56 (including 12 new); lint, typecheck and build clean; `check:secrets` OK.
- New e2e `photo-capture.spec.ts`: 6 tests on 4 viewport projects, all passing (28 with the setup tests).
- Full e2e regression: 160 passed, 4 failed. The 4 failures were `locale.spec.ts` asserting a hard-coded list of message namespaces; it now includes `capture` and `photos` and passes. The suite was not re-run in full afterwards.
- Migrations 20261023120000 and 20261023120100 are applied on the DEV project. The production Supabase project does not exist yet, so they must be pushed there once it does.

## Deviations from the plan

- Direct bucket reads were removed and the service role is used for file reads (see key-decisions). The plan said to read with the user-scoped client.
- `createRecipeWithPhotos` takes an optional storage client for the listing because members can no longer list the bucket.
- Generated PNG test images instead of committed JPEG fixtures.
- `locale.spec.ts` and `check-client-bundle.mjs` were changed because the new copy and the browser client broke them.
- Shipping (push to main and the production smoke test) was not done in this plan; nothing has been pushed.

## Open items

- End-of-phase human check on real iPhone and Android phones (camera and gallery capture, HEIC from iPhone, leave warning).
- HEIC on desktop Chrome and Firefox shows "unsupported file" (no converter package added).
- Orphan files remain possible only if a save fails after uploading; the browser does not yet remove them automatically.

## Self-Check: PASSED (automated); human device check pending
