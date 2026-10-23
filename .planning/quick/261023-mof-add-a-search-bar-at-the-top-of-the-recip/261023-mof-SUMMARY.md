---
quick_id: 261023-mof
status: complete
commit: 177ce07
key-files:
  created:
    - src/lib/recipes/search.ts
    - src/components/recipe-list.tsx
    - tests/unit/recipe-search.test.ts
    - tests/e2e/search.spec.ts
  modified:
    - src/app/[locale]/(app)/recipes/page.tsx
    - src/lib/recipes/queries.ts
    - src/i18n/messages/pt.json
    - src/i18n/messages/en.json
---

# Quick 261023-mof Summary: Search bar on the recipe list

## What changed

- A search bar now sits at the top of the recipe list. It filters as you type by recipe name and
  ingredient, ignoring case and accents ("acucar" finds "açúcar"); every word typed must match
  somewhere in the title or ingredients. A clear (X) button and Escape empty it.
- Below it: "N receitas encontradas" while searching, or "Nenhuma receita encontrada para «…»".
- The action buttons ("Adicionar a partir de fotografias", "Nova receita") now sit under the search bar.
- The list rendering moved from the page to the `RecipeList` client component; `listRecipes` also
  returns the ingredient lines (used only for matching).

## Verification

- typecheck, eslint, unit tests (19 files, 133 pass, including `recipe-search` and pt/en parity),
  production build.
- E2E `recipe search` passes on desktop-chromium and phone-chromium; it seeds its own recipes and
  deletes them (0 leftovers confirmed). `responsive-shell` (no horizontal scroll) passes on both.
- Screenshots reviewed on desktop and phone.

## Not included (Phase 3)

Searching by category, category rename/add, server-side or fuzzy (typo-tolerant) search, ranking.
This does not by itself complete SRCH-01 in the roadmap: the requirement stays pending until Phase 3
is verified.
