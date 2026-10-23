---
quick_id: 261023-lti
status: complete
commit: b285fcf
key-files:
  created:
    - supabase/migrations/20261023130000_recipe_required_lines.sql
  modified:
    - src/lib/recipes/schema.ts
    - tests/integration/recipes-rls.test.ts
    - tests/integration/recipe-photos-rls.test.ts
    - tests/integration/recipe-photos-edit.test.ts
---

# Quick 261023-lti Summary: Incomplete recipes are impossible

## What changed

- **Database:** migration `20261023130000_recipe_required_lines.sql` adds `public.has_text_line` and
  CHECK constraints `recipes_has_ingredient` / `recipes_has_step` (title was already constrained).
  The migration does not delete rows; it fails if incomplete recipes exist.
- **Tests:** integration fixtures that stored title-only or empty-list recipes now store complete
  ones; `recipes-rls.test.ts` asserts a member's incomplete insert/update is refused (23514).
- **Published:** pushed `cd11f8e` (form rule from 261023-ln9) + `b285fcf`; Vercel deploy succeeded.

## DEV database actions

- The first `db:push:dev` failed (constraint violated) because a new incomplete recipe "fvdv" (no
  steps, no photos) had been added through the live site. It was deleted with
  `remove-incomplete-recipes.mjs --apply`, under the user's standing instruction to remove incomplete
  recipes. The second push applied the migration.
- Probe (service role, so RLS is not involved): inserts with no step, no ingredient, or a whitespace-only
  ingredient all returned 23514; 0 probe rows stored.

## Verification

- typecheck, eslint, `vitest run tests/unit` (recipe-schema: 10/10, incl. the new tests).
- Integration and e2e suites not run: both reset the DEV database behind the live demo.

## Follow-ups

- Production: run `remove-incomplete-recipes.mjs` (dry run, then `--apply`) before `db:push:prod`.
