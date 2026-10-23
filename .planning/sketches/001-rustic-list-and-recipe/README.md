---
sketch: 001
name: rustic-list-and-recipe
question: "Which warm, rustic café/bakery look works for the recipe list and the recipe page, on a phone and on a wider screen?"
winner: "A"
tags: [visual-identity, theme, recipe-list, recipe-page, mobile-first]
---

# Sketch 001: Rustic list and recipe

## Design Question
Which warm, homey, rustic café/bakery look works for the two screens families use most,
the recipe list and the recipe page, while staying easy to read on a phone in the kitchen?

## How to View
Open `.planning/sketches/001-rustic-list-and-recipe/index.html` in a browser.

Use the toolbar (bottom right) to switch Telemóvel / Tablet / Computador, toggle the empty
cookbook state, swap themes independently of the layout, and turn on annotations.

## Variants
- **A: Papel kraft (lead)**: kraft-paper background, cream index cards with a red rule,
  terracotta buttons, slab-serif titles, the recipe taped onto a notebook page, photos as polaroids.
- **B: Quadro de giz**: chalkboard menu with a wooden frame, letter-grouped menu rows with
  dotted leaders, mustard actions, and a cream paper recipe pinned to the board.
- **C: Creme de padaria**: light parchment, centred header with a herb doodle, round "plate"
  tiles, olive actions with terracotta details, and Fraunces serif headings.

## What to Look For
- Readability while cooking: ingredient amounts and steps at arm's length on a phone.
- Whether the list is easy to scan with 7 recipes and with a long title (Pudim de pão…).
- How each look carries from the list to the recipe page, and to the two-column wide layout.
- Whether the decoration (tape, pin, plates, doodles) feels warm or gets in the way.

## Notes
- **Winner: A (Papel kraft), chosen 2026-10-23.** Kraft background, cream index cards with
  a red rule, terracotta primary, olive accent, Zilla Slab titles, Nunito Sans body, Caveat for
  small handwritten notes, recipe on a taped notebook page, photos as polaroids.
- Content is made up. The structure mirrors the app: title, ingredient lines, steps, and photos
  of the original handwritten recipe. Recipes have no categories or author shown, as in the app.
- Sketch-only ideas, not in the app yet: search by name or ingredient, ticking off
  ingredients, and highlighting the current step.
- Each variant is a token-only theme in `../themes/`, matching how `src/app/globals.css`
  styles the real app, so the winner maps onto CSS variables plus a display font.
