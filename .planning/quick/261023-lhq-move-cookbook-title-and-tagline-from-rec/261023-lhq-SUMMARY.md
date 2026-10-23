---
quick_id: 261023-lhq
status: complete
commit: cb5740e
key-files:
  modified:
    - src/components/app-header.tsx
    - src/app/[locale]/(app)/recipes/page.tsx
---

# Quick 261023-lhq Summary: Cookbook title and tagline live in the header

## What changed

- **Header** ([app-header.tsx](../../../src/components/app-header.tsx)): the cookbook name (display
  font, `text-3xl`) and the handwritten tagline now sit in the cream header band on every member page,
  as a link back to the recipe list. Spans, not a heading, so pages keep one `<h1>`. On phones the
  Members / language / sign-out controls sit on their own row above the name; from `sm` up the name
  leads and the controls are on the right.
- **Recipe list** ([recipes/page.tsx](../../../src/app/[locale]/(app)/recipes/page.tsx)): the visible
  title + tagline block is gone; an `sr-only` `<h1>` keeps the cookbook name for screen readers and the
  existing e2e `heading level 1` assertions. "Add from photos" / "New recipe" stay, right-aligned from
  `sm` up.

## Verification

- `npm run typecheck` — pass.
- `npx eslint` on both files — pass.
- E2E suite not run: it wipes the shared DEV Supabase data behind the live demo. Existing specs
  (`responsive-shell`, `owner-setup`, `prod-smoke`) assert the h1 text, which the `sr-only` heading
  preserves.

## Notes

- The change was already present uncommitted in the working tree when this task started (an earlier
  interrupted attempt); it matched the request, was reviewed, verified, and committed as-is.
- Visual check on a phone and desktop is still advised (header height, wrapping of long cookbook
  names).
