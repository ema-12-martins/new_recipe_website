---
quick_id: 261023-mof
mode: quick
description: Add a search bar at the top of the recipe list page
files_modified:
  - src/lib/recipes/search.ts
  - src/components/recipe-list.tsx
  - src/app/[locale]/(app)/recipes/page.tsx
  - src/lib/recipes/queries.ts
  - src/i18n/messages/pt.json
  - src/i18n/messages/en.json
  - tests/unit/recipe-search.test.ts
  - tests/e2e/search.spec.ts
---

# Quick 261023-mof: Search bar on the recipe list

User (en): "Can you add a search bar on the top of the page that has the list of recipes".

Scope note: SRCH-01 (find by name and ingredient) is planned for Phase 3, which also covers categories
(SRCH-02/03). This task delivers only the name + ingredient search the user asked for; categories and
any server-side or fuzzy search remain Phase 3. At family scale the page already loads every recipe, so
the filter runs in the browser (also works offline for the cached list).

## Tasks

1. `src/lib/recipes/search.ts`: `foldText` (case + accent insensitive), `searchableText` (title +
   ingredients), `matchesQuery` (every word must appear). Unit tests.
2. `RecipeList` client component: search box on top (clear button, Escape clears, disabled until
   hydrated), then the page's action buttons, a status line ("N receitas encontradas" / none-found
   message), then the cards. `listRecipes` also returns the ingredient lines for matching.
3. pt/en messages; e2e test that seeds two recipes, searches by name, ingredient (accent-free), no
   match and clear, then deletes its data.

## Verify

typecheck, eslint, unit tests, build, e2e on desktop + phone via `_pw-isolated.config.ts`, screenshots.
