---
quick_id: 261023-lhq
mode: quick
description: Move cookbook title and tagline from recipe list page top into the header
files_modified:
  - src/components/app-header.tsx
  - src/app/[locale]/(app)/recipes/page.tsx
---

# Quick 261023-lhq: Cookbook title and tagline live in the header

User request (pt): "tira isto do topo da pagina da lista de receitas e coloca antes no header" — the
"Family Recipe Cookbook" name and the handwritten tagline ("Our family's recipes, carefully kept and
easy to find.") should leave the top of the recipe list page and appear in the header instead.

## Task 1: Header shows the cookbook name and tagline

- **files:** `src/components/app-header.tsx`
- **action:** Replace the small header name with the display-size name plus the `font-hand` tagline,
  wrapped in a link back to `/{locale}/recipes`. Use spans (not a heading) so each page keeps a single
  `<h1>`. On phones the controls (Members, language, sign out) sit on their own row above the name;
  from `sm` up the name leads and the controls sit to the right.
- **verify:** `npm run typecheck`; `npx eslint src/components/app-header.tsx`
- **done:** Every member page header shows the name and tagline; no horizontal overflow on phones.

## Task 2: Recipe list page drops its visible title block

- **files:** `src/app/[locale]/(app)/recipes/page.tsx`
- **action:** Remove the visible `<h1>` + tagline block; keep an `sr-only` `<h1>` with the cookbook
  name (page outline and existing e2e `heading level 1` assertions) and keep the "Add from photos" /
  "New recipe" actions, right-aligned from `sm` up.
- **verify:** `npm run typecheck`; `npx eslint "src/app/[locale]/(app)/recipes/page.tsx"`
- **done:** The list page no longer repeats the title/tagline visually; the h1 still names the cookbook.
