---
quick_id: 261023-irw
slug: recipe-page-ticking-and-current-step-lis
mode: quick
type: execute
autonomous: true
requirements: []
files_modified:
  - src/components/recipe-checklist.tsx
  - src/app/[locale]/(app)/recipes/[id]/page.tsx
  - src/lib/recipes/queries.ts
  - src/app/[locale]/(app)/recipes/page.tsx
  - src/app/globals.css
  - src/i18n/messages/pt.json
  - src/i18n/messages/en.json
  - src/app/[locale]/sign-in/page.tsx
  - src/app/[locale]/setup/page.tsx
  - src/app/[locale]/join/[token]/page.tsx
  - src/app/[locale]/unavailable/page.tsx
  - src/app/[locale]/(app)/recipes/new/page.tsx
  - src/app/[locale]/(app)/recipes/[id]/edit/page.tsx
  - src/components/capture-flow.tsx
  - src/app/[locale]/(app)/members/page.tsx
  - src/app/[locale]/(app)/members/[userId]/remove/page.tsx
---

# Quick 261023-irw: sketch 001 extras and kraft style on every page

## Objective
The user chose "Todas" (all three follow-ups to sketch 001 / quick 261023-h1n): recipe-page
ticking and current step, counts and a photo stamp on the list cards, and the kraft paper look
on the remaining pages. Follow `.github/skills/sketch-findings-new_recipe_website/`.

## Constraints (from e2e tests and decisions)
- `recipes.spec.ts`: `article ul > li` and `article ol > li` must have exactly the stored
  ingredient/step text, so no extra text inside those `li`; the current-step label is CSS
  `content: attr(...)` only. The list link text must be exactly the title, so counts sit
  outside the `<Link>` (stretched-link card).
- Ticks and current step are in-memory per page view: no storage, nothing to purge on
  sign-out, recipe data unchanged (D-11).
- No new packages; native checkbox with `accent-color`.
- i18n: pt and en keep identical key sets (unit test).

## Tasks

### Task 1: Ticking ingredients and current step
- files: `src/components/recipe-checklist.tsx` (new client component),
  `src/app/[locale]/(app)/recipes/[id]/page.tsx`, `src/app/globals.css`, messages.
- action: ingredients become `<label><input type="checkbox"> <span>line</span></label>`;
  ticked lines are struck through and muted. Steps become toggle buttons (`aria-pressed`) in
  each `li`; the pressed step is highlighted with a terracotta bar and a handwritten
  "a fazer agora" via `data-current-label` + CSS. Hand-font hints under each heading.
- verify: tsc, eslint, unit tests; browser check of tick/untick and step toggle.

### Task 2: Counts and photo stamp on list cards
- files: `src/lib/recipes/queries.ts`, `src/app/[locale]/(app)/recipes/page.tsx`,
  `src/app/globals.css`, messages.
- action: `listRecipes` also selects ingredients, steps and `recipe_photos(count)` (RLS
  applies) and returns counts; cards show "N ingredientes · N passos" with plural rules, plus a
  camera count and an olive "com fotos" stamp when photos exist. Card becomes a container with
  a stretched title link.
- verify: tsc, unit tests, browser check that the card link's text is the title only.

### Task 3: Kraft look on remaining pages
- files: sign-in, setup, join, unavailable, new/edit recipe, capture flow, members, remove
  member; shared `paper-panel` class in `globals.css`.
- action: forms and content blocks on a `paper-panel` sheet; page titles `text-3xl font-bold`
  (Zilla Slab); sign-in/setup/join show the app name in the display font and the tagline in the
  hand font; members sections as panels with dashed dividers.
- verify: `npm run build`, `check:secrets`, local production screenshots of sign-in, recipe
  list, recipe page (ticked + current step), new recipe and members at 390px and 1280px.
  Do NOT run Playwright e2e (resets the shared DEV database).
