---
phase: 01-decisions-and-shared-cookbook
plan: 10
subsystem: recipes
tags: [supabase, rls, postgres, nextjs, server-actions, playwright, i18n]

requires:
  - 01-15 (cookbooks/memberships, is_member/is_owner/current_cookbook_id, test helpers)
  - 01-16 (owner setup, getCurrentMembership, owner storageState for e2e)
  - 01-17 (live Vercel deploy, check:secrets, test:e2e:prod ship loop)
provides:
  - public.recipes (title, ingredients text[], steps text[], version) with member-only RLS, content-column grants and no delete policy
  - public.recipe_creators (owner-only select; created_by anonymized on account deletion) filled by an AFTER INSERT trigger
  - createRecipe (idempotent on the server-issued form id), createRecipeAction, updateRecipeAction (version-guarded)
  - Pages /{locale}/recipes (alphabetical list), /recipes/new, /recipes/[id], /recipes/[id]/edit
  - RecipeForm (title, ingredient lines, reorderable steps) and shadcn Textarea
affects: [01-11, 01-12, 01-13, 01-19, 01-14, 01-18, phase-2-photo-import, phase-3-search]

actuals:
  tokens: 14400
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "Optimistic concurrency: BEFORE UPDATE trigger bumps version; updates filter .eq('version', v) and zero matched rows means conflict"
    - "Idempotent create: the server renders the recipe id into the form; a repeat insert hits recipes_pkey (23505) and returns the existing recipe"
    - "Client forms with controlled state stay inert (<fieldset disabled>) until hydrated, via useSyncExternalStore"
    - "Column-level GRANTs restrict client writes to content columns; RLS is the row gate"

key-files:
  created:
    - supabase/migrations/20261021120100_recipes.sql
    - src/lib/recipes/schema.ts
    - src/lib/recipes/queries.ts
    - src/lib/recipes/create-recipe.ts
    - src/app/[locale]/(app)/recipes/actions.ts
    - src/app/[locale]/(app)/recipes/new/page.tsx
    - src/app/[locale]/(app)/recipes/[id]/page.tsx
    - src/app/[locale]/(app)/recipes/[id]/edit/page.tsx
    - src/components/recipe-form.tsx
    - src/components/ui/textarea.tsx
    - tests/unit/recipe-schema.test.ts
    - tests/integration/recipe-create.test.ts
    - tests/integration/recipes-rls.test.ts
    - tests/e2e/recipes.spec.ts
  modified:
    - src/app/[locale]/(app)/recipes/page.tsx
    - src/i18n/messages/pt.json
    - src/i18n/messages/en.json
    - tests/e2e/responsive-shell.spec.ts
    - eslint.config.mjs

key-decisions:
  - "The recipe form is disabled until React hydrates. WebKit typed into the title before hydration and React then reset it to empty state, so the save failed validation."
  - "Textarea was copied by hand from the shadcn registry JSON with cn from @/lib/utils. The registry still lists the rejected 'cn' package as a dependency, so shadcn add would have installed it (T-01-SC)."
  - "The cookbook list is sorted with Intl.Collator in the app (dictionary order, ignoring case and accents), because the database collation may sort by byte order."
  - "DELETE is granted on recipes but no delete policy exists, so a client delete affects 0 rows instead of raising a permission error (D-15, as the plan's tests require)."
  - "Ship loop used db:status:dev instead of db:push:prod/db:status:prod, following the 01-17 user decision (the live site is a DEV-backed demo)."

patterns-established:
  - "Recipe text is rendered only as React text nodes with whitespace-pre-wrap; no normalization, trimming or case change anywhere in the recipe path"
  - "Pages under (app) re-check getCurrentMembership because layouts and pages render in parallel"

requirements-completed: [RECP-01, RECP-03, AUTH-03]

coverage:
  - id: D1
    description: "A member creates a recipe (title, ingredient lines, ordered steps) and sees it exactly as typed, including ½, 1 1/2 and 180 °C, with no contributor shown"
    requirement: RECP-01
    verification:
      - kind: e2e
        ref: "tests/e2e/recipes.spec.ts#a member creates a recipe and sees it exactly as typed (4 viewport projects)"
        status: pass
      - kind: unit
        ref: "tests/unit/recipe-schema.test.ts (byte-identical lines, decomposed accents kept, limits)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Re-submitting the same new-recipe form (same id, double click or concurrent) creates exactly one recipe"
    requirement: RECP-01
    verification:
      - kind: integration
        ref: "tests/integration/recipe-create.test.ts (sequential and Promise.all same-id submits)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/recipes.spec.ts#double-clicking save creates exactly one recipe (4 viewport projects)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The cookbook lists every recipe alphabetically with a New recipe button"
    requirement: RECP-01
    verification:
      - kind: e2e
        ref: "tests/e2e/recipes.spec.ts#the cookbook lists recipes alphabetically with a New recipe button"
        status: pass
    human_judgment: false
  - id: D4
    description: "Any member edits any recipe (title, add/remove lines, edit and reorder steps); a stale save shows a conflict and keeps the typed values without overwriting"
    requirement: RECP-03
    verification:
      - kind: e2e
        ref: "tests/e2e/recipes.spec.ts#a member edits text, lines and step order of a saved recipe"
        status: pass
      - kind: e2e
        ref: "tests/e2e/recipes.spec.ts#a stale save shows a conflict and keeps the member's edits (4 viewport projects)"
        status: pass
      - kind: integration
        ref: "tests/integration/recipes-rls.test.ts#a member reads every cookbook recipe, adds one, and edits another member's recipe"
        status: pass
    human_judgment: false
  - id: D5
    description: "Data boundary: anon and non-members see and write nothing; nobody can delete; recipe_creators is owner-only; id/cookbook_id/version cannot be changed; operator account deletion keeps the recipe and nulls its creator"
    requirement: AUTH-03
    verification:
      - kind: integration
        ref: "tests/integration/recipes-rls.test.ts (7 tests)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Recipe feature is live on the deployed site"
    verification:
      - kind: other
        ref: "GitHub commit status for 1a54fe9: 'Vercel: success Deployment has completed'"
        status: pass
      - kind: e2e
        ref: "npm run test:e2e:prod (6 read-only smoke tests)"
        status: pass
    human_judgment: false
  - id: D7
    description: "On a real phone browser, a recipe with Portuguese accents, fractions and °C reads back exactly, and Move up/down reorders steps by tapping"
    requirement: RECP-01
    verification: []
    human_judgment: true
    rationale: "Plan's end-of-phase human check on a physical phone; Playwright device emulation does not replace a real touch keyboard and browser"

duration: 29min
completed: 2026-10-22
status: complete
---

# Phase 1 Plan 10: Manual Recipes Summary

**Family members can now add, browse, view and edit recipes in the shared cookbook. Recipes have a title, free-text ingredient lines and reorderable steps, and the text is saved exactly as typed (accents, ½, 1 1/2 and 180 °C included). Postgres RLS limits access to members, nobody can delete a recipe, and if two people edit the same recipe, the slower save gets a "changed by someone else" message instead of overwriting the other.**

## Performance

- **Duration:** 29 min (06:47Z–07:16Z)
- **Tasks:** 3 / 3
- **Files:** 14 created, 5 modified

## Accomplishments

- `recipes` table: one row holds the title plus the `ingredients text[]` and `steps text[]` arrays, with CHECK limits (300 / 500 / 4000 characters; 200 ingredients; 100 steps). Member-only RLS policies for select, insert and update; no delete policy. Column grants let clients write only the title, ingredients and steps.
- A version trigger plus `.eq('version', v)` updates give optimistic concurrency. Because title, ingredients and steps change in one row update, a save is applied whole or not at all.
- `recipe_creators` holds the private creator for the later member-removal review (D-10/D-21). Only the owner can read it, and deleting a member's account sets it to null (D-17).
- Creating a recipe is idempotent: the server issues the id when it renders the form, so a double click or a retried request lands on the same single recipe.
- The form has one input per ingredient line and one numbered textarea per step, with Move up/down/Remove buttons labelled in Portuguese and English. Touch targets are 44 px, and the form stays disabled until it has hydrated.
- The cookbook page lists recipes in dictionary order with a prominent "Nova receita" button. The view page shows plain text with no contributor information and no delete control.

## Task Commits

1. **Task 1: Create and view a recipe (tracer):** `be85107` (feat). The migration was pushed to DEV.
2. **Task 2: Alphabetical list, edit page, conflict handling:** `b7e2f8f` (test, RED), `b908922` (feat, GREEN)
3. **Task 3: Data-boundary proof and ship:** `1a54fe9` (test), pushed to `main` and deployed by Vercel

## Files Created/Modified

See `key-files` in the frontmatter. The modified files also include `tests/e2e/responsive-shell.spec.ts` and `eslint.config.mjs` (see deviations).

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

**1. [Rule 1 - Bug] WebKit lost text typed before hydration**
- **Found during:** Task 1 e2e
- **Issue:** On tablet-webkit and phone-webkit, the title typed before React hydrated was reset to empty, so the save failed with "Escreva um título…". A real phone on a slow network would hit the same problem.
- **Fix:** All form fields sit in a `<fieldset disabled>` that `useSyncExternalStore` enables once the form hydrates (no hydration mismatch).
- **Files:** src/components/recipe-form.tsx
- **Verification:** recipes.spec.ts passes in all four viewport projects. **Commit:** be85107

**2. [Rule 3 - Blocking] `shadcn add textarea` would install the rejected `cn` package**
- **Issue:** The registry JSON for textarea still lists `cn` as a dependency (T-01-SC).
- **Fix:** Copied the component from the registry JSON with `cn` from `@/lib/utils`, following 01-15/01-16. No package was installed. **Commit:** be85107

**3. [Rule 3 - Blocking] ESLint scanned the Playwright HTML report**
- **Issue:** After any e2e run, `npm run lint` failed with about 3,000 problems from the gitignored `playwright-report/` bundle.
- **Fix:** Added `playwright-report/**` and `test-results/**` to `globalIgnores`. **Commit:** be85107

**4. [Rule 1 - Coupled test] responsive-shell.spec assumed an empty cookbook**
- **Issue:** Once the list shows recipes, the empty-state assertion fails whenever recipes.spec runs first.
- **Fix:** The spec now checks the "Nova receita" link instead. The empty state is still checked right after owner setup in owner-setup.spec. **Commit:** b908922

**5. [User decision carried from 01-17] The ship loop used DEV**
- `db:push:prod` / `db:status:prod` ran as `db:status:dev`, because no PRODUCTION Supabase project exists yet. The recipes migration was already applied to DEV.

---

**Total deviations:** 2 bug fixes, 2 blocking fixes, 1 carried user decision. **Impact:** none on scope; the hydration fix also benefits real users on slow phones.

## Issues Encountered

- Task 3's RLS tests passed on their first run because the policies shipped in Task 1, so the planned follow-up migration was not needed.
- `/{locale}/sign-in` still returns 404 until plan 01-11 (known from 01-17).
- Running the integration tests or the local e2e setup wipes the DEV database that the live demo uses (accepted in 01-17).

## Verification

- `npm run db:status:dev` → 20261021120000 and 20261021120100 are applied remotely
- `npm run test:unit` → 12 passed; `npm run test:integration` → 20 passed (4 files)
- `npx playwright test` → 64 passed (setup + four viewport projects)
- `npm run typecheck`, `npm run lint`, `npm run build` → exit 0; `npm run check:secrets` → 16 files, no secret material
- Vercel deployment of `1a54fe9` succeeded; `npm run test:e2e:prod` → 6 passed
- Acceptance greps: no `for delete` policy, no `dangerouslySetInnerHTML`, no normalize/case calls in schema.ts, no `recipe_creators` in src, `randomUUID` only in the new-recipe page, no delete/remover/eliminar wording under the recipes route

## Next Phase Readiness

Ready for 01-11. Invited members (01-11/01-12) can use these recipe pages unchanged. The removal review (01-13) can read `recipe_creators` as the owner.

## Self-Check: PASSED
