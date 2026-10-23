---
quick_id: 261023-h1n
slug: apply-sketch-001-winner-a-kraft-paper-de
status: complete
date: 2026-10-23
commit: 5e139fd
key-files:
  - src/app/globals.css
  - src/app/[locale]/layout.tsx
  - src/components/app-header.tsx
  - src/app/[locale]/(app)/recipes/page.tsx
  - src/app/[locale]/(app)/recipes/[id]/page.tsx
  - src/components/photo-gallery.tsx
  - src/components/ui/button.tsx
  - src/components/ui/input.tsx
  - src/components/ui/textarea.tsx
  - .planning/phases/02-handwritten-recipe-capture/02-UI-SPEC.md
---

# Quick 261023-h1n Summary: kraft paper look from sketch 001

## What changed
- **Theme:** shadcn tokens in `globals.css` now carry the sketch A palette (kraft `#c8a679`,
  paper `#fbf4e4`, terracotta `#b5532f`, cream accents, `--radius: .5rem`) with a paper-fibre
  texture; a dark "espresso kraft" set keeps dark mode following the system setting.
- **Fonts:** self-hosted via `next/font/google`: Nunito Sans body, Zilla Slab for `h1`/`h2`
  (`font-display`), Caveat for small handwritten notes (`font-hand`).
- **Header:** full-width cream label band with a pinking-shears edge; only pulls to the top
  when no offline notice is shown above it.
- **Recipe list:** display-font cookbook name, the existing tagline in the hand font, recipes
  as slightly tilted index cards (red rule under the title, faint blue lines).
- **Recipe page:** taped notebook sheet with a red margin line, terracotta section headings,
  dashed ingredient rules, numbered terracotta step circles; photos as polaroids.
- **Inputs and outline buttons:** paper fill so they read on the kraft background; all other
  pages inherit the palette and fonts without code changes.
- **Phase 2 UI-SPEC:** design-system font and colour sections now describe the kraft theme.

## Not built (sketch-only ideas)
Ingredient ticking, current-step highlight, search, list|recipe split view and per-recipe
counts on the list.

## Verification
- `tsc --noEmit` clean; ESLint clean on changed files; 86/86 unit tests pass.
- `next build` succeeds; `check:secrets` OK (42 client files).
- Local production server against DEV, signed in as the existing owner (read-only): sign-in,
  recipe list and recipe page screenshotted at 390px and 1280px, light and dark. Fonts resolve
  to Zilla Slab / Nunito Sans, no horizontal scroll, no page errors.
- Playwright e2e deliberately not run: it resets the shared DEV database.
- Not visually checked: polaroid thumbnails (no DEV recipe currently has photos) and the
  Phase 2 capture screens.
