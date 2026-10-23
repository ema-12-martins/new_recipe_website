---
quick_id: 261023-ln9
status: complete
commit: cd11f8e
key-files:
  created:
    - scripts/remove-incomplete-recipes.mjs
  modified:
    - src/lib/recipes/schema.ts
    - src/app/[locale]/(app)/recipes/actions.ts
    - src/i18n/messages/pt.json
    - src/i18n/messages/en.json
    - tests/unit/recipe-schema.test.ts
    - tests/e2e/auth-devices.spec.ts
    - tests/e2e/invites.spec.ts
    - tests/e2e/offline-photos.spec.ts
    - tests/e2e/photo-capture.spec.ts
    - tests/e2e/photo-edit.spec.ts
    - tests/e2e/recipes.spec.ts
---

# Quick 261023-ln9 Summary: Complete recipes only

## What changed

- **Rule:** `recipeInputSchema` requires at least one non-blank ingredient and one non-blank step
  (title was already required). Create and edit both validate through it in the server actions.
- **Messages:** an empty list shows `ingredientsRequired` / `stepsRequired` ("Adicione pelo menos um
  ingrediente/passo." / "Add at least one ingredient/step."); over-long lines keep the old message.
- **Tests:** unit tests for empty and blank-only lists and for the issue path/code the action relies
  on. E2E helpers that saved title-only recipes now fill one ingredient and one step; `recipes.spec`
  seed defaults are complete; new e2e test "a recipe without ingredients or steps is not saved".
- **Cleanup:** `scripts/remove-incomplete-recipes.mjs`. It runs as a dry run by default; `--apply`
  removes each recipe's Storage folder files, then the recipe row (photo/creator rows cascade).

## Data cleanup (DEV, user-approved)

- Dry run: 88 of 163 recipes incomplete (29 with photo files), all automated-test leftovers.
- `--apply` deleted 88 recipes and their photo files; re-run dry run reports none left.

## Verification

- `npm run typecheck`, `eslint` on changed files, `vitest run tests/unit` (17 files, all pass).
- E2E not run: the default config resets the DEV database behind the live demo.

## Notes / follow-ups

- No database CHECK constraint for the minimum (direct PostgREST writes by a member could still
  store an empty list). Adding one also means updating integration fixtures that insert title-only
  rows.
- Code commit not pushed yet; the live site still accepts incomplete recipes until it is pushed.
- Run the script against production once it exists, if needed.
