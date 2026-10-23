---
quick_id: 261023-irw
slug: recipe-page-ticking-and-current-step-lis
status: complete
date: 2026-10-23
commit: c351171
key-files:
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

# Quick 261023-irw Summary: sketch 001 extras and kraft style on every page

## What changed
1. **Recipe page (`RecipeChecklist` client component):** each ingredient has a native checkbox;
   ticked lines are struck through with CSS `:has(:checked)`. Each step is a toggle button
   (`aria-pressed`); the current step gets a terracotta bar and a handwritten "a fazer agora"
   from `content: attr(data-current-label)`. Hand-font hints under both headings. State is
   in-memory only: nothing stored, nothing to purge on sign-out, recipe text unchanged (D-11).
2. **List cards:** `listRecipes` selects ingredients, steps and `recipe_photos(count)` (RLS)
   and returns counts. Cards show "N ingredientes · N passos" (pt-PT plural rules), a camera
   count with screen-reader text, and an olive "com fotos" stamp. The title is a stretched
   link over the card, so the link text stays exactly the title. The empty state is a paper
   panel in the hand font.
3. **Remaining pages:** new shared `paper-panel` class. Sign-in, setup, join and unavailable
   show the app name in Zilla Slab (setup keeps it as the `h1`) with the tagline in Caveat, and
   their content on a paper panel. New/edit recipe, capture, members (both sections) and member
   removal sit on paper panels; all page titles are `text-3xl font-bold`, section headings
   terracotta.

## Verification
- `tsc --noEmit` clean; `eslint src` clean; 86/86 unit tests pass (pt/en key parity included).
- `next build` succeeds; `check:secrets` OK (42 client files).
- Local production server against DEV, signed in as the existing owner (read-only):
  - e2e contracts held: `article ul > li` / `article ol > li` text equals the stored lines
    before and after marking a step; card link text equals the title; setup `h1` is the app
    name; sign-in `h1` is "Entrar".
  - Ticking an ingredient and toggling a step work (`aria-pressed=true`); tapping a card's
    count line opens the recipe; no horizontal scroll; no page or hydration errors.
  - Screenshots at 390px and 1280px: sign-in, list, recipe, new recipe, members.
- Playwright e2e deliberately not run: it resets the shared DEV database.
- Not visually checked: the "com fotos" stamp and camera count (no DEV recipe has photos),
  join and unavailable pages, and the capture flow.
