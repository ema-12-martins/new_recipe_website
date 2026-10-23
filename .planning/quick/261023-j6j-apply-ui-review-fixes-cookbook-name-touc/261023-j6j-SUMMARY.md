---
quick_id: 261023-j6j
slug: apply-ui-review-fixes-cookbook-name-touc
status: complete
date: 2026-10-23
commit: 87d4f76
source: .planning/phases/01-decisions-and-shared-cookbook/01-UI-REVIEW.md
key-files:
  - src/lib/cookbook-name.ts
  - src/components/app-header.tsx
  - src/app/[locale]/(app)/recipes/page.tsx
  - src/app/[locale]/error.tsx
  - src/app/[locale]/not-found.tsx
  - src/components/ui/input.tsx
  - src/components/ui/button.tsx
  - src/components/recipe-form.tsx
  - src/components/photo-picker.tsx
  - src/app/globals.css
  - src/i18n/messages/pt.json
  - src/i18n/messages/en.json
  - tests/unit/cookbook-name.test.ts
  - tests/e2e/owner-setup.spec.ts
  - tests/e2e/responsive-shell.spec.ts
  - .planning/phases/02-handwritten-recipe-capture/02-UI-SPEC.md
---

# Quick 261023-j6j Summary: Phase 1 UI review fixes

## Priority fixes
1. **Cookbook name:** `displayCookbookName()` shows `common.appName` ("Livro de Receitas da
   Família" / "Family Recipe Cookbook") while the stored name is the database default
   `Family cookbook`. It is used by the header and the recipe list `h1`. On phones the header
   title gets its own line and wraps (no truncation). Two e2e assertions updated to
   `pt.common.appName`.
2. **Touch targets:** `Input` `h-9` → `h-11`. The "Voltar…" back links, the setup sign-in link
   and the join links are 44 px tall. Re-measured at 375 px: no control below 44 px on
   sign-in, setup, list, recipe, edit, members or capture.
3. **Error and not-found screens:** `[locale]/error.tsx` (client; localised; paper panel;
   `retry()` plus a full-navigation home link) and `[locale]/not-found.tsx` (localised; paper
   panel; back to the cookbook), following the Next 16.4 docs in `node_modules`.
   **Dropped:** `(app)/loading.tsx`. With a loading boundary the response starts streaming
   before `notFound()`, so missing or removed recipes returned HTTP 200 instead of 404,
   which breaks `member-removal.spec.ts:129`, `invites.spec.ts:194` and the 404 semantics.

## Minor fixes
- Form legends (Ingredientes, Passos, Fotografias) and the invite-link heading use the recipe
  section style (Zilla Slab, bold, terracotta); `font-medium` removed from app code.
- One terracotta CTA per form: `PhotoPicker` `primaryWhenEmpty={false}` inside `RecipeForm`.
  Link buttons use the foreground colour.
- Logged-out app names are all `text-3xl`.
- Colour: the sign-in purge error sits on a paper chip; the offline notice uses theme tokens;
  new `--stamp` token (`#56632c` light 5.96:1, `#a3b06a` dark 6.13:1).
- Empty cookbook: added hint "Comece por «Nova receita» ou fotografe uma receita escrita à
  mão." (`recipes.emptyHint`).
- 02-UI-SPEC Typography now describes the kraft scale.

## Verification
- `tsc --noEmit` and ESLint clean; 89/89 unit tests (3 new); `next build` OK;
  `check:secrets` OK (44 client files).
- Selected e2e run in isolation (a temporary config and auth step, deleted afterwards),
  **without** the database-resetting setup project, signed in as the existing owner:
  offline, recipes, responsive-shell, member-removal and invites on desktop Chromium plus
  recipes and responsive-shell on Pixel 7. **23/24 passed.** The one failure,
  `invites.spec.ts:79`, is a strict-mode collision: the DEV database still holds a used invite
  labelled "Tia desktop-chromium" from the 09:38 full run, and the spec's label is not unique
  (it assumes a freshly reset database). The steps before that assertion passed.
- Local production screenshots at 375 px: list (localised name, two-line header), edit form
  (single primary CTA, consistent legends), not-found (HTTP 404, localised).
- Not exercised: `error.tsx` rendering (no safe way to force a server error) and the
  tablet/phone WebKit projects.
