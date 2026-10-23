---
quick_id: 261023-lti
mode: quick
description: Database rule — recipes need title, at least one ingredient and one step; publish to the site
files_modified:
  - supabase/migrations/20261023130000_recipe_required_lines.sql
  - src/lib/recipes/schema.ts
  - tests/integration/recipes-rls.test.ts
  - tests/integration/recipe-photos-rls.test.ts
  - tests/integration/recipe-photos-edit.test.ts
---

# Quick 261023-lti: Incomplete recipes impossible, not just discouraged

User (pt): "não devia ser possível adicionar uma receita em que falte um dos elementos (passos,
ingredientes, título)". The app-side rule from 261023-ln9 was committed but not deployed, and direct
API writes were never covered.

## Task 1: Database backstop

- **files:** `supabase/migrations/20261023130000_recipe_required_lines.sql`, `src/lib/recipes/schema.ts`
- **action:** `public.has_text_line(text[])` + CHECK constraints `recipes_has_ingredient` and
  `recipes_has_step` (title is already checked). No delete in the migration: incomplete rows make it
  fail, so the operator runs `scripts/remove-incomplete-recipes.mjs` first (it also removes photo
  files, which SQL cannot).
- **verify:** `db:status:dev` shows only this migration pending; dry-run cleanup; `db:push:dev`;
  probe inserts of incomplete rows return 23514 and store nothing.

## Task 2: Fixtures + test

- **files:** integration tests
- **action:** Fixtures that inserted title-only / empty-list recipes get one ingredient and one step;
  `recipes-rls.test.ts` asserts a member's incomplete insert/update fails with 23514.
- **verify:** typecheck, eslint. Integration suite not run (it resets the DEV database).

## Task 3: Publish

- **action:** `git push` so Vercel deploys the form rule from 261023-ln9 together with this.
- **verify:** Vercel commit status = success.
