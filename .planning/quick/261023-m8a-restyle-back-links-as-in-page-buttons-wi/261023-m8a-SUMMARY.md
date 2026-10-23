---
quick_id: 261023-m8a
status: complete
commit: 79deb8c
key-files:
  created:
    - src/components/back-link.tsx
  modified:
    - src/components/capture-flow.tsx
    - src/app/[locale]/(app)/members/page.tsx
    - src/app/[locale]/(app)/recipes/[id]/page.tsx
    - src/app/[locale]/(app)/recipes/[id]/edit/page.tsx
    - src/app/[locale]/(app)/recipes/new/page.tsx
    - src/app/[locale]/(app)/recipes/capture/page.tsx
    - src/i18n/messages/pt.json
    - src/i18n/messages/en.json
---

# Quick 261023-m8a Summary: Back buttons inside the page

## What changed

- New `BackLink`: a cream paper pill with border, an arrow icon and a 44px tap height; the arrow
  nudges left on hover (not with reduced motion). The in-form "Voltar às fotografias" button uses the
  same classes.
- Each back button is now the first element inside the page's paper card instead of floating text on
  the kraft background: recipe sheet, new and edit recipe panels (the page title moved into the same
  panel), the members header card, and both capture panels.
- The edit page's back button says "Voltar à receita" (new `backToRecipe` message) instead of showing
  the recipe title as link text.
- On the capture form step both "back to photos" and "back to cookbook" show, as before.

## Verification

- typecheck, eslint, `vitest run tests/unit` (128 pass), production build.
- Browser: the 5 non-saving flows touching back links (capture leave dialog, nothing-typed leave,
  discard/enter manually, failed read, leave a draft) plus the incomplete-recipe warning test pass on
  desktop-chromium; the last also on phone-chromium.
- One regression found and fixed during this task: the cookbook link had moved into the photos step
  and disappeared on the form step; it now shows on both.
- Screenshots reviewed (desktop and phone): recipe, new, capture, members. The edit page and the
  English labels were not looked at.

## Notes

- Specs that save recipes (recipes, photo-edit, invites, ...) were not run: they would add test
  recipes to the live DEV data.
