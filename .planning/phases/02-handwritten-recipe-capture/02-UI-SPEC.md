---
phase: "2"
slug: "handwritten-recipe-capture"
status: draft
shadcn_initialized: true
preset: none
created: "2026-10-23"
---

# Phase 2 — UI Design Contract

> Visual and interaction contract for Phase 2 (Handwritten Recipe Capture). Written inline from `02-CONTEXT.md` and the existing Phase 1 UI; the independent `gsd-ui-checker` subagent could not be run in this session (see Checker Sign-Off).

Locked inputs: `02-CONTEXT.md` D-01 to D-24. This contract adds no new behaviour; it fixes how those decisions look and read. Phase 1 screens are not restyled.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn (`components.json`, style `new-york`, base `radix`, Tailwind v4) |
| Preset | none (no preset code; neutral base colour, CSS variables in `src/app/globals.css`) |
| Component library | radix (`radix-ui` package) |
| Icon library | lucide (`lucide-react`) |
| Font | System stack from `--font-sans`: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif` |

Dark theme follows the system setting (existing behaviour; no toggle). Every colour below must be used through the theme tokens (`bg-background`, `text-muted-foreground`, `text-destructive`, …), never as raw values.

---

## Component Inventory

Enumerated by `ls src/components/ui/*.tsx` (cross-checked with `npx shadcn info`, which reports configuration only and no component count) — 4 components — shadcn@4.22.1 — 2026-10-23.

| Component | Import path | Notes |
|-----------|-------------|-------|
| Button | `@/components/ui/button` | Installed. Variants `default`, `outline`, `destructive`, `ghost`; use `className="h-11"` (or `size-11` for icon-only) for the 44 px touch target already used in `recipe-form.tsx`. |
| Input | `@/components/ui/input` | Installed. Not needed for the capture screen; reused by the existing form. |
| Label | `@/components/ui/label` | Installed. |
| Textarea | `@/components/ui/textarea` | Installed; reused by the existing form for draft review. |
| Alert | `@/components/ui/alert` | To add (official shadcn registry): draft banner, error and offline notices. |
| AlertDialog | `@/components/ui/alert-dialog` | To add (official shadcn registry): "Leave without saving?" and "Remove photo" confirmations. |
| Dialog | `@/components/ui/dialog` | To add (official shadcn registry): full-size photo viewer. |

Not an allowlist: other official shadcn components may be added when a task needs them. Icons come from lucide: `Camera`, `ImagePlus`, `ArrowUp`, `ArrowDown`, `X`, `Loader2`, `TriangleAlert`, `ChevronLeft`, `ChevronRight`.

---

## Spacing Scale

Declared values (all multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, badge padding |
| sm | 8px | Gap between buttons and between thumbnails |
| md | 16px | Default element spacing, card padding |
| lg | 24px | Gap between form sections and screen blocks |
| xl | 32px | Page padding on tablet and desktop |
| 2xl | 48px | Space before the primary action block on empty states |
| 3xl | 64px | Not used in this phase |

Exceptions: 44 px minimum height and width for every tappable control (`h-11`, `size-11`), matching the Phase 1 form. Thumbnails are fluid (CSS grid) with a 3:4 aspect ratio and no fixed pixel width.

---

## Typography

Four sizes and two weights, the same ones the existing recipe screens already use. New screens use regular and semibold only; they do not introduce `font-medium`.

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 | 1.5 |
| Label (helper text, field hints, page badge, error text) | 14px | 400 | 1.5 |
| Heading (section and banner titles, dialog titles, legends) | 18px | 600 | 1.3 |
| Display (screen title) | 24px | 600 | 1.2 |

---

## Color

The theme is neutral grey, so the "accent" is the near-black primary token.

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `--background` `#FFFFFF` (dark: `#0A0A0A`) | Page background and surfaces |
| Secondary (30%) | `--secondary` / `--muted` `#F5F5F5` (dark: `#262626`) | Thumbnail placeholders, banner background, dialog footers |
| Accent (10%) | `--primary` `#171717` (dark: `#E5E5E5`) | See reserved list below |
| Destructive | `--destructive` `#E7000B` (dark: `#FF6467`) | Destructive actions and error text only |

Accent reserved for: (1) the single primary button on each screen (see the screen contracts), (2) the focus ring. It is not used for thumbnails, badges, links, icons or banners. Destructive colour is used only for "Remove photo", "Leave and discard", and error messages.

---

## Screen Contracts

Mobile first: a single column on phones. On `sm` and wider the content is centred in a column of at most 672 px (`max-w-2xl`). Page content is always inside the existing `(app)` layout, and every new page calls `requireMembership(locale)` at the top.

### 1. Entry point (recipes list)
- Keep the existing "New recipe" button unchanged.
- Add a second button, **"Add from photos"**, next to it (`outline` variant, `h-11`, `Camera` icon). It links to the capture route.

### 2. Capture screen (D-01 to D-04, D-13)
- Title (Display): "Add a recipe from photos".
- Helper text (Label): "Add up to 6 pages. Put them in reading order."
- **No photos (empty):** dashed-border placeholder (secondary background) with the empty-state copy below. `Add photos` is the primary button; "Skip – type it myself" is a text link below it. `Read recipe` is not shown.
- **With photos:** thumbnail grid, 2 columns on phones and 3 on `sm`+, gap 8 px. `Read recipe` is the primary button (full width on phones). `Add photos` becomes `outline` and is disabled at 6 photos. "Skip – type it myself" stays visible.
- **Thumbnail card:** 3:4 image (`object-cover`), a "Page n" label (14 px) below it, and a row of three icon buttons (`ArrowUp`, `ArrowDown`, `X`), each `size-11` with an `aria-label` that includes the page number. Move up is disabled on the first page and move down on the last. Remove acts immediately (nothing is saved yet, so no confirmation).
- **Per-thumbnail processing:** while a photo is being resized, show `Loader2` over a muted placeholder; a failed photo shows the error copy in place and a remove button.
- The native picker is a visually hidden `<input type="file" accept="image/*" multiple>` triggered by the button; no custom camera UI.
- Needs a connection to read photos (D-04 and offline rules): when offline, show the offline notice, disable `Read recipe` and keep "Skip – type it myself" enabled.

### 3. Reading state (D-11)
- The thumbnail grid stays visible and non-interactive. Above it, an `Alert` with `Loader2` (`motion-reduce:animate-none`), the heading "Reading your recipe…" and the hint copy. A `Stop reading` outline button sits below it. After about 60 seconds the attempt becomes the failure state.
- The status region uses `aria-live="polite"`.

### 4. Failure state (D-10, D-12, D-14)
- `Alert` (destructive text colour on the heading only) with the failure copy. Primary button `Try again`; secondary `Enter it manually` (outline), which opens the manual form with the photos kept. Nothing has been saved; say so in the copy.
- Focus moves to the alert heading when the state appears. The alert has `role="alert"`.

### 5. Draft review (D-05 to D-09)
- Reuses `recipe-form.tsx` unchanged in layout, pre-filled, under an `Alert` banner (secondary background) with the heading "Draft – not saved yet" and the verification hint. No photo is shown (D-06) and no per-line confidence marks (D-07).
- Buttons, in order: **`Save recipe`** (primary, full width on phones, disabled while the title is empty or the request is pending), `Discard and try again` (outline), `Enter manually` (outline, photos kept).
- Leaving the page by any navigation shows the **Leave without saving?** AlertDialog. The browser's own beforeunload prompt covers tab close and reload.

### 6. Recipe page: original photos (D-20, D-23, D-24)
- A section below the steps with the heading "Original photos" (Heading style). Thumbnail grid as in the capture screen (no controls), in page order. The section is not rendered for recipes without photos.
- Tapping a thumbnail opens the **Dialog** viewer: image `object-contain` at most 100% of the viewport, "Photo n of N" caption, `ChevronLeft` and `ChevronRight` buttons (`size-11`, hidden when there is one photo), and a `Close photo` button. Escape closes it, and the arrow keys and buttons navigate (no swipe gesture required). Focus returns to the tapped thumbnail on close.
- Offline: a thumbnail whose image is not cached shows the muted placeholder with the "not available offline" copy.

### 7. Edit form: photos (D-21, D-22)
- A "Photos" fieldset in the existing edit form, after the steps. It lists the current photos with the same thumbnail card (move and remove controls), plus an `Add photos` button (limit of 6 in total). Adding to an existing recipe never triggers recognition. Removing a saved photo opens the **Remove photo** AlertDialog; removing a photo added during this edit (not yet saved) does not.
- Photo changes are applied by the same `Save` action as the other edits; unsaved changes are covered by the existing leave behaviour.

---

## Interaction and Accessibility Contract

- **Hydration:** every new client form wraps its fields in `<fieldset disabled={!hydrated}>` (the existing `useSyncExternalStore` pattern), so nothing typed before hydration is lost.
- **Controlled state:** the photo list and its order live in controlled state and survive a failed action.
- **Touch targets:** at least 44 × 44 px for every button, link and icon button.
- **Icon-only buttons** always carry an `aria-label` with the action and the page number, and a visible "Page n" label sits next to the group.
- **Alerts:** errors use `role="alert"`; progress uses `aria-live="polite"`. Alerts are matched by text in tests, never by role alone (route-announcer pitfall in `.continue-here.md`).
- **Dialogs:** focus is trapped, Escape closes them, and focus returns to the trigger. Destructive dialogs focus the non-destructive button first.
- **Motion:** spinners and transitions honour `prefers-reduced-motion`.
- **Image alt text:** thumbnails use `alt="Original photo {n} of {total}"` in the interface language; preview images before saving use "Photo {n}".
- **Language:** every string below exists in `src/i18n/messages/en.json` and `pt.json`; recipe content is never translated (D-11 of Phase 1).
- **Planner note:** HEIC files cannot be shown by every browser, so previews must be produced from the resized JPEG, not the original file.

---

## Copywriting Contract

English / Portuguese (European).

| Element | Copy |
|---------|------|
| Primary CTA (capture) | Add photos / Adicionar fotografias |
| Primary CTA (photos chosen) | Read recipe / Ler receita |
| Primary CTA (draft) | Save recipe / Guardar receita |
| Primary CTA (failure) | Try again / Tentar novamente |
| Entry button | Add from photos / Adicionar a partir de fotografias |
| Manual link | Skip – type it myself / Saltar – escrever eu próprio |
| Stop button | Stop reading / Parar leitura |
| Failure fallback | Enter it manually / Escrever manualmente |
| Draft secondary | Discard and try again / Descartar e tentar novamente |
| Empty state heading | No photos yet / Ainda sem fotografias |
| Empty state body | Take a photo of a handwritten recipe or choose one from your gallery. You can add up to 6 pages. / Tire uma fotografia a uma receita manuscrita ou escolha uma da sua galeria. Pode adicionar até 6 páginas. |
| Reading state | Reading your recipe… This can take up to a minute. / A ler a receita… Pode demorar até um minuto. |
| Error: could not read | We couldn't read this recipe. The photos may be blurry or too dark, or the service is unavailable. Nothing has been saved. Try again or type the recipe yourself. / Não conseguimos ler esta receita. As fotografias podem estar desfocadas ou escuras, ou o serviço pode estar indisponível. Nada foi guardado. Tente novamente ou escreva a receita. |
| Error: too many photos | You can add up to 6 photos. Remove one to add another. / Pode adicionar até 6 fotografias. Remova uma para adicionar outra. |
| Error: unsupported file | That file isn't a photo we can use. Choose a JPEG, PNG or HEIC image. / Esse ficheiro não é uma fotografia que possamos usar. Escolha uma imagem JPEG, PNG ou HEIC. |
| Error: photo could not be prepared | We couldn't prepare that photo. Remove it or try another one. / Não conseguimos preparar essa fotografia. Remova-a ou tente outra. |
| Offline notice (capture) | Reading photos needs an internet connection. You can still type the recipe yourself. / Ler fotografias precisa de ligação à internet. Pode escrever a receita à mesma. |
| Draft banner heading | Draft – not saved yet / Rascunho – ainda não guardado |
| Draft banner body | We read this from your photos. Check every line against the handwriting before saving; amounts and units may be wrong. / Lemos isto a partir das suas fotografias. Confira cada linha com a letra original antes de guardar; as quantidades e as unidades podem estar erradas. |
| Photos section heading | Original photos / Fotografias originais |
| Photos not cached offline | This photo isn't available offline. / Esta fotografia não está disponível sem ligação. |
| Viewer controls | Previous photo, Next photo, Close photo / Fotografia anterior, Fotografia seguinte, Fechar fotografia |
| Edit form, no photos | No original photos. Add photos of the handwritten recipe to keep them with it. / Sem fotografias originais. Adicione fotografias da receita manuscrita para as guardar com ela. |
| Destructive confirmation: leave | Leave without saving?: This draft and your photos will be discarded. Buttons: Leave and discard / Keep editing. / Sair sem guardar?: Este rascunho e as suas fotografias serão descartados. Botões: Sair e descartar / Continuar a editar. |
| Destructive confirmation: remove photo | Remove photo {n}?: The recipe stays. This photo will be deleted for everyone in the cookbook. Buttons: Remove photo / Keep photo. / Remover a fotografia {n}?: A receita mantém-se. Esta fotografia será eliminada para todos no livro de receitas. Botões: Remover fotografia / Manter fotografia. |

---

## UI Considerations

Rows below were filled in inline (the probe engine was not run). Empty-state and error copy lives in the Copywriting Contract above and is referenced here, not restated.

Applicable state considerations resolved: 7 covered, 2 backstop, 0 unresolved

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| empty | capture photo list | ✅ covered | With no photos, the capture screen shows the "No photos yet" copy and no `Read recipe` button |
| loading | recognition request | ✅ covered | Reading shows the progress alert with `Stop reading` and fails after about 60 seconds |
| error | recognition, photo processing, file type | ✅ covered | Each failure shows its documented message and a way forward without saving anything |
| partial | photos where one fails processing | ✅ covered | A failed photo shows its error and a remove button while the others stay usable |
| zero-one-many | recipe photo section | ✅ covered | The "Original photos" section is absent for zero photos; the viewer hides its previous and next buttons for one photo |
| overflow | 6-photo limit | ✅ covered | `Add photos` is disabled at 6 photos and the "too many photos" message appears if more are chosen |
| offline | capture, uncached photos | ✅ covered | Offline disables `Read recipe` and keeps manual entry; uncached thumbnails show the placeholder copy |
| long-text | draft ingredients and steps | 🧪 backstop | Long lines wrap (`break-words whitespace-pre-wrap`) without horizontal scroll at 320 px width |
| populated | thumbnail grid at 6 photos | 🧪 backstop | Six thumbnails fit 2 columns on 320 px and 3 on `sm`+ with the controls still 44 px |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | alert, alert-dialog, dialog | not required |

No third-party registries.

---

## Checker Sign-Off

The independent `gsd-ui-checker` could not be run in this session, so this is a self-check against the seven dimensions. Run `/gsd-ui-phase 2` again and choose "Skip" at the existing-spec prompt to get the independent verification.

- [x] Dimension 1 Copywriting: self-checked — no generic CTA labels ("Save recipe", "Stop reading"); empty, error and destructive copy defined
- [x] Dimension 2 Visuals: self-checked — one primary action per screen; icon-only buttons have labels
- [x] Dimension 3 Color: self-checked — accent list is explicit; destructive limited to listed uses
- [x] Dimension 4 Typography: self-checked — 4 sizes, 2 weights
- [x] Dimension 5 Spacing: self-checked — all values multiples of 4; 44 px exception stated
- [x] Dimension 6 Registry Safety: self-checked — official registry only
- [x] Dimension 7 Inventory Provenance: self-checked — command, count and version recorded

**Approval:** pending independent check (self-checked 2026-10-23)
