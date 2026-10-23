---
name: sketch-findings-new_recipe_website
description: Validated design decisions, CSS patterns, and visual direction from sketch experiments (warm "Papel kraft" theme, paper components). Auto-loaded during UI implementation on new_recipe_website.
---

<context>
## Project: new_recipe_website (Family Recipe Cookbook)

Warm and homey, like a rustic café or bakery menu: kraft-paper background, cream paper,
terracotta and olive accents, a characterful slab serif for titles, and a handwritten touch for
small notes. Decoration must never cost readability: ingredient amounts and steps stay in a
clean, highly readable font on plain paper, comfortable on a phone while cooking.

Reference points: rustic café / bakery menu boards; handwritten family recipe index cards.

Sketch sessions wrapped: 2026-10-23
</context>

<design_direction>
## Overall Direction

- **Palette:** kraft `#c8a679` page with fibre texture; paper `#fbf4e4` surfaces; terracotta
  `#b5532f` primary; cream `#f3e7cf` header/hover; olive `#6b7a3a` secondary accent; dark mode
  is a system-driven espresso variant. All through shadcn tokens in `src/app/globals.css`.
- **Typography:** Nunito Sans for everything read (default `font-sans`); Zilla Slab for titles
  (`h1`/`h2`, `font-display`); Caveat for short handwritten notes only (`font-hand`).
  Self-hosted via `next/font/google` in `src/app/[locale]/layout.tsx`.
- **Surfaces:** decoration on background and edges; reading areas are plain paper.
- **Components:** `paper-label` header band, `index-card` list items, `recipe-sheet` with
  `recipe-ingredients` and `recipe-steps`, `polaroid` photos; inputs on `bg-card`.
- **Layout:** centred `max-w-3xl` column; one screen at a time on phones; 44px touch targets.
- **Motion:** subtle tilt and hover lift only; respect `prefers-reduced-motion`.
</design_direction>

<findings_index>
## Design Areas

| Area | Reference | Key Decision |
|------|-----------|--------------|
| Colour & typography | references/colour-and-typography.md | Kraft + paper + terracotta tokens (light/dark); Nunito Sans / Zilla Slab / Caveat |
| Paper components | references/paper-components.md | Shared `paper-label`, `index-card`, `recipe-sheet`, `recipe-steps`, `polaroid` classes |
| Ideas for later | references/ideas-for-later.md | Ticking ingredients, current step, search, split view: NOT built, need their own plan |

## Theme

The winning theme file is at `sources/themes/default.css` (sketch tokens). The production
implementation is `src/app/globals.css`; prefer it as the source of truth.

## Source Files

Original sketch HTML (all three variants, A marked ★) is preserved in
`sources/001-rustic-list-and-recipe/`; open `index.html` in a browser.
</findings_index>

<metadata>
## Processed Sketches

- 001-rustic-list-and-recipe
</metadata>
