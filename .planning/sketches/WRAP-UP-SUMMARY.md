# Sketch Wrap-Up Summary

**Date:** 2026-10-23
**Sketches processed:** 1
**Design areas:** Colour & typography, Paper components, Ideas for later
**Skill output:** `./.github/skills/sketch-findings-new_recipe_website/`

## Included Sketches
| # | Name | Winner | Design Area |
|---|------|--------|-------------|
| 001 | rustic-list-and-recipe | A: Papel kraft | Colour & typography; Paper components; Ideas for later (sketch-only interactions) |

## Excluded Sketches
| # | Name | Reason |
|---|------|--------|
| — | — | None |

## Design Direction
Warm, homey rustic café/bakery look on kraft paper. Texture and decoration stay on the
background and edges; ingredients and steps are read on plain cream paper in a clean
sans-serif. Implemented on the live site by quick task 261023-h1n (commit 5e139fd).

## Key Decisions
- **Palette:** kraft `#c8a679`, paper `#fbf4e4`, terracotta `#b5532f`, cream `#f3e7cf`,
  olive `#6b7a3a`; dark mode is a system-driven espresso variant; tokens only.
- **Typography:** Nunito Sans (body), Zilla Slab (titles), Caveat (short notes only);
  self-hosted with `next/font/google`.
- **Components:** cream header band with a pinking-shears edge, index-card recipe list,
  taped notebook recipe sheet with numbered terracotta steps, polaroid photos, paper inputs.
- **Layout:** centred single column, one screen at a time on phones, 44px touch targets.
- **Rejected:** chalkboard (B: decorative font hard to read, dark by default) and bakery
  cream (C: initial-letter plate tiles waste space without photos).
- **Deferred ideas:** ingredient ticking, current-step highlight, search, wide-screen split
  view, counts on cards.
