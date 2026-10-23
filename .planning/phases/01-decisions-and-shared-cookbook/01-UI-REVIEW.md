# Phase 1 — UI Review

**Audited:** 2026-10-23 (after quick tasks 261023-h1n and 261023-irw)
**Scope:** every implemented page: sign-in, setup, join, unavailable, recipe list, recipe,
new/edit recipe, capture (Phase 2 page, included because the user asked for all pages),
members and member removal.
**Baseline:** Phase 1 has no UI-SPEC. Audited against the abstract 6-pillar standards plus
the validated sketch decisions (`.github/skills/sketch-findings-new_recipe_website/`) and
the typography and colour rules in `../02-handwritten-recipe-capture/02-UI-SPEC.md`, the
only design contract and the one Phase 2 screens must follow.
**Screenshots:** captured. Local production build (`next start -p 3000`) against the DEV
database, signed in as the existing owner, read-only. 31 captures at 375×812, 768×1024 and
1440×900, plus dark mode, in `.planning/ui-reviews/01-20261023-134452/` (gitignored).
**Interaction captures:** off (`workflow.ui_interaction_capture` is false). Interaction
findings come from the code and from scripted Playwright checks (tap-target measurement, the
header clipping check, and the tick/step toggles verified in quick task 261023-irw).

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Clear, specific Portuguese copy; the default cookbook name "Family cookbook" is English and leads the Portuguese recipe list and header |
| 2. Visuals | 3/4 | Strong, consistent paper metaphor; on a phone the header clips the cookbook name to "Family …", and the edit form has two terracotta CTAs |
| 3. Color | 3/4 | Tokens used everywhere and contrast passes AA in light and dark; three exceptions (sign-in purge error on kraft, olive stamp, hard-coded amber offline notice) |
| 4. Typography | 2/4 | 6 sizes and 3 weights against a 4-size, 2-weight contract; form section legends (`font-medium`) are weaker than nested headings |
| 5. Spacing | 3/4 | Clean 4 px scale with one intentional arbitrary value; control heights are inconsistent (inputs 36 px, buttons 44 px) |
| 6. Experience Design | 3/4 | Good pending, confirmation and live-region coverage; no `error.tsx`, `not-found.tsx` or `loading.tsx`, and 36 px inputs on the main phone flows |

**Overall: 17/24**

---

## Top 3 Priority Fixes

1. **English cookbook name on a Portuguese site, clipped on phones.** The database default
   `'Family cookbook'` (`supabase/migrations/20261021120000_cookbook_membership.sql:6`) is
   the `h1` of the recipe list and the header title. On a 375 px phone the header shows
   "Family …" (`app-header.tsx:25`, `truncate`; measured `scrollWidth > clientWidth`). It is
   the first thing every family member sees, and it mixes languages.
   **Fix:** when the name equals the default, show the localised `common.appName`
   ("Livro de Receitas da Família"). In the header, let the title wrap to two lines on narrow
   screens (`line-clamp-2`, not `truncate`), or show a short "Receitas" label below `sm`.
   Update `owner-setup.spec.ts:42`, which expects "Family cookbook". Optional: let the owner
   rename the cookbook on the Members page.
2. **Text inputs are 36 px tall on phones.** Measured on sign-in, members and the recipe
   form: `input` 303×36 (`src/components/ui/input.tsx`, `h-9`). Every button is 44 px
   (`h-11`). Typing a recipe on a phone is the core workflow (PROJECT constraint).
   **Fix:** `h-9` → `h-11` in `input.tsx`. Give the "Voltar…" back links `py-3` (measured
   36 px on recipe, new, capture and members) and the setup "Entrar" link `inline-block py-3`
   (measured 22 px).
3. **No error, not-found or loading screens.** `src/app` has no `error.tsx`,
   `not-found.tsx` or `loading.tsx`. If `listRecipes` or `getRecipe` throws
   (`queries.ts:32` and `:57` re-throw), people see Next's unstyled default error page in
   English. A bad recipe id gives the generic 404. Slow phone navigations show no feedback.
   **Fix:** add `[locale]/error.tsx` (client; paper panel, localised message, "Tentar
   novamente" via `reset()`), `[locale]/not-found.tsx` (paper panel with "Voltar ao livro de
   receitas") and `[locale]/(app)/loading.tsx` (a light paper skeleton or a hand-font
   "A carregar…").

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)
- ✅ Error copy is specific and actionable throughout ("Não foi possível guardar a receita.
  Tente novamente.", `pt.json:86`). The invite "unavailable" message reassures that the link
  was not invalidated (`pt.json:155`). No generic "OK", "Submit" or "Something went wrong".
- ✅ CTAs are verb-first and specific: "Criar link de convite", "Guardar receita",
  "Adicionar fotografias", "Criar conta e entrar".
- ⚠️ WARNING: the default cookbook name "Family cookbook" (see fix 1) appears in Portuguese
  pages at `recipes/page.tsx` (`h1`) and `app-header.tsx:25-27`.
- ⚠️ Minor: the empty state "Ainda não há receitas neste livro." (`pt.json`) does not tell
  people what to do next. Add "Comece por «Nova receita» ou fotografe uma receita."
- ℹ️ Test-data titles (e.g. "Ábacaxi desktop-chromium-1792748415454") are not a copy defect;
  they come from the shared DEV database.

### Pillar 2: Visuals (3/4)
- ✅ Each screen has a clear focal point: a Zilla Slab page title on kraft, then a single
  paper sheet. The recipe page's taped notebook, numbered terracotta steps and the
  tick/current-step states read well at 375 px (verified in 261023-irw).
- ✅ The list cards' "COM FOTOS" stamp and camera count render on recipes with photos
  (tablet capture), and empty counts collapse.
- ⚠️ WARNING: header title clipping on phones (fix 1). At 375 px the band holds the title,
  "Membros", PT, EN and "Sair", which leaves about 70 px for the name.
- ⚠️ Two primary (terracotta) CTAs on one screen: on the edit form (mobile-edit capture) and
  in the capture flow's manual step, "Adicionar fotografias" (`photo-picker.tsx:199`, default
  variant while there are no photos) competes with "Guardar receita". The 02-UI-SPEC allows
  one primary per screen. **Fix:** make the photo button `outline` inside `RecipeForm`.
- ℹ️ Cards for recipes with no ingredients or steps keep an empty 36 px meta strip
  (`.index-card-meta { min-height: 2.25rem }`). This is acceptable as part of the ruled-card
  look, but it could shrink to the ruling height when empty.

### Pillar 3: Color (3/4)
- ✅ Every component colour goes through theme tokens. The only hard-coded colours in `.tsx`
  are shadcn overlays (`bg-black/50`), the destructive button's `text-white`, and the offline
  notice.
- ✅ Measured WCAG contrast. Light: text on kraft 5.99, muted on kraft 4.68, muted on paper
  9.76, terracotta text on paper 4.52, button text on terracotta 4.69. Dark: text 13.80,
  muted 7.51, primary 4.68, button 5.52.
- ⚠️ `purge-offline-on-mount.tsx:22`: the `text-destructive` error renders on the sign-in
  page outside the paper panel, so it sits on kraft at **3.65:1**, below 4.5 for 14 px text.
  **Fix:** render it inside the panel, or as an `Alert` with `bg-card`.
- ⚠️ The olive "COM FOTOS" stamp (`.paper-stamp`, `--chart-2 #6b7a3a` on paper) is
  **4.29:1** at 12 px bold. It is `aria-hidden` and duplicated by the sr-only photo count,
  but still below AA for sighted users. **Fix:** darken the stamp colour to about `#56632c`.
- ⚠️ `offline-notice.tsx:14` hard-codes `amber-50/amber-950`, so it ignores dark mode and
  the kraft palette. **Fix:** use `bg-secondary text-secondary-foreground border-border`,
  or the shadcn `Alert`.
- ℹ️ Accent (`primary`) appears in 8 places. That fits the 02-UI-SPEC reserved list
  (primary CTA, focus ring, recipe section headings, step numbers), except the second CTA
  above and `variant="link"` buttons ("Saltar – escrever eu próprio", capture), which the
  spec excludes from accent. Make link buttons `text-foreground underline`.

### Pillar 4: Typography (2/4)
- Distribution in app code (excluding `ui/`): sizes `text-sm` ×48, `text-base` ×23,
  `text-3xl` ×13, `text-xl` ×8, `text-lg` ×6, `text-2xl` ×3. That is **6 sizes**. Weights:
  `font-bold` ×21, `font-medium` ×18, `font-semibold` ×5. That is **3 weights**. The
  02-UI-SPEC still declares 4 sizes and 2 weights (written before the kraft theme). The code
  has outgrown the contract.
- ⚠️ Inconsistent section-heading hierarchy inside forms: `recipe-form.tsx:205` and `:248`
  legends "Ingredientes" and "Passos" are `text-base font-medium` (Nunito). The photos
  legend at `:318` is `font-semibold`, and the nested empty-state heading
  `photo-picker.tsx:134` is an `h2` (Zilla Slab, `text-lg font-semibold`), so the nested
  heading outranks its section. On the recipe page, the same sections are
  `text-xl font-bold text-primary` Zilla Slab.
  **Fix:** give the legends the recipe-page section style
  (`font-display text-xl font-bold text-primary`), make the photo-picker empty heading a `p`
  with `font-semibold`, and drop `font-medium` from app code (the UI-SPEC rule).
- ⚠️ App-name sizes differ across the logged-out pages: `text-3xl` on sign-in and setup,
  `text-2xl` on join and unavailable. Pick one.
- **Fix the contract too:** update 02-UI-SPEC Typography to the kraft scale: body 16, label
  14, hand note 18–20 (Caveat), section 20 bold (Zilla), title 30 bold (Zilla); weights 400
  and 700 (plus 600 only inside shadcn primitives).

### Pillar 5: Spacing (3/4)
- ✅ Spacing classes follow the 4 px scale: top uses are `space-y-2` ×20, `space-y-6` ×16,
  `space-y-4` ×14, `gap-2` ×9, with no half-steps. The only arbitrary value is the
  intentional full-bleed header `mx-[calc(50%-50vw)]` (`app-header.tsx:23`), guarded by
  `overflow-x: clip`. No horizontal scroll was measured at 375, 768 or 1440 px.
- ✅ Paper panels pad consistently (20 px on phones, 32 px from `sm`).
- ⚠️ Control heights break the rhythm: inputs 36 px next to 44 px buttons in the same rows
  (ingredient line + remove ×; members label + "Criar link"). See fix 2.

### Pillar 6: Experience Design (3/4)
- ✅ Pending states on every form (`isPending` / `useFormStatus` in sign-in, join, setup,
  invite, revoke, removal, recipe form, sign-out). Destructive actions are confirmed with
  `AlertDialog` (revoke, member removal, remove photo, leave without saving). There are 25
  `role="status|alert"` and `aria-live` regions. Icon-only buttons are labelled (the e2e
  suites target them by accessible name).
- ✅ Empty states exist for the list, invites and photos, and the cooking aids (tick,
  current step) work without storing anything.
- ⚠️ WARNING: no `error.tsx`, `not-found.tsx` or `loading.tsx` (fix 3).
- ⚠️ WARNING: 36 px inputs and back links on phones (fix 2).
- ℹ️ The list has 98 recipes and no search. That is expected: search is Phase 3
  (SRCH requirements), so it is not scored as a gap here.
- ℹ️ Ticks and the current step reset on reload, by design (261023-irw). Revisit only if
  family members ask.

Registry audit: `components.json` exists, and only official shadcn components are installed
(no third-party registries in 02-UI-SPEC), so it was skipped.

---

## Files Audited
- `src/app/globals.css`, `src/app/[locale]/layout.tsx`
- `src/app/[locale]/sign-in/page.tsx`, `setup/page.tsx`, `join/[token]/page.tsx`,
  `unavailable/page.tsx`
- `src/app/[locale]/(app)/layout.tsx`, `recipes/page.tsx`, `recipes/[id]/page.tsx`,
  `recipes/new/page.tsx`, `recipes/[id]/edit/page.tsx`, `recipes/capture/page.tsx`,
  `members/page.tsx`, `members/[userId]/remove/page.tsx`
- `src/components/*.tsx` (app-header, recipe-checklist, recipe-form, photo-picker,
  photo-gallery, capture-flow, offline-notice, purge-offline-on-mount, sign-in-form,
  join-form, owner-setup-form, create-invite-form, invite-link-panel, revoke-invite-button,
  member-removal-form, sign-out-button, language-switcher)
- `src/components/ui/{button,input,textarea,label,alert,alert-dialog,dialog}.tsx`
- `src/i18n/messages/{pt,en}.json`, `src/lib/recipes/queries.ts`
- `supabase/migrations/20261021120000_cookbook_membership.sql`
