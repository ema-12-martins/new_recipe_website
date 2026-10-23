---
phase: 02-handwritten-recipe-capture
plan: 04
subsystem: recognition
tags: [ocr, tesseract, route-handler, nextjs, vercel, draft-review, playwright, vitest]

requires:
  - 02-01 (02-PROVIDER-DECISION.md: Tesseract approved, D-10 thresholds)
  - 02-02 (CaptureFlow, PhotoPicker, RecipeForm upload-on-save, leave guard)
provides:
  - POST /api/recipes/read (membership-checked, 4 MB budget, writes nothing)
  - src/lib/recognition (provider interface, Tesseract and stub providers, text parser, sanitiser, D-10 quality gate)
  - "Read recipe" on the capture screen with reading, failure and draft states
affects: [phase verification, 02 UAT]

actuals:
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "The browser sends smaller reading copies (1600 px, JPEG 0.80, fallback 1200/0.70) under a 4 MB budget; the full photos are kept for Save"
    - "Recognition output is only ever a draft that pre-fills the existing RecipeForm; nothing is stored until Save recipe"
    - "tesseract.js is a server external package; its worker files, all its dependencies and the bundled language data are added to the function trace from its package.json"

key-files:
  created:
    - src/app/api/recipes/read/route.ts
    - src/lib/recognition/{types,config,index,provider-approved,stub,tesseract,parse-text,draft,quality,limits}.ts
    - src/lib/photos/read-recipe.ts
    - tests/unit/recognition-{draft,route,provider}.test.ts
    - tests/e2e/recipe-draft.spec.ts
  modified:
    - src/components/capture-flow.tsx
    - src/app/[locale]/(app)/recipes/capture/page.tsx
    - src/i18n/messages/{pt,en}.json (new recognition namespace)
    - next.config.ts, playwright.config.ts, .env.example

key-decisions:
  - "RECOGNITION_PROVIDER unset means Tesseract (approved, credential-free), 'stub' for tests, anything else hides Read recipe"
  - "Providers return { draft, confidence }; the route applies the D-10 gate (confidence >= 65, >= 20 characters, a title, one line)"
  - "The draft reuses the single manual RecipeForm instance (remounted with the draft as initial values) instead of a second form"

requirements-completed: [CAPT-02, CAPT-03, CAPT-04]
completed: 2026-10-23
---

# Phase 2 Plan 04: Read recipe -> draft -> Save — Summary

Members can now press **Ler receita** after choosing photos. The photos are read by Tesseract in
our own function, and the recipe form opens pre-filled under a "Rascunho – ainda não guardado"
banner. Nothing is stored until **Guardar receita**. A poor read shows the failure screen with
**Tentar novamente** and **Escrever manualmente**, and the photos are kept.

## What was built

- **Endpoint** `POST /api/recipes/read`: 401 without membership, 503 on an outage or when
  reading is off, 413 over 4 MB, 400 for anything but 1–6 JPEGs. It reads with the provider under a
  55 s abort and returns `{ draft }` or `{ failure }` with `no-store`. It never touches the database
  or Storage (test grep gate).
- **Recognition layer:** `draftFromText` splits title, ingredients and steps at headings,
  tolerating a misread first letter ("Wodo de preparação"), and uses numbered lines as steps when
  there is no heading. `sanitiseDraft` drops blank lines and enforces the recipe limits without
  rewording. `draftProblem` applies D-10.
- **Tesseract provider:** reuses one worker, gives up if it cannot start within 20 s, and is
  terminated on abort; language data is bundled.
- **Capture flow:** reading state (Loader2, "A ler a receita…", Stop reading, thumbnails visible
  and inert, aria-live), failure alert (focused, role alert), and a draft banner (focused) with
  "Descartar e tentar novamente" and "Escrever manualmente". Read recipe is primary once photos
  exist, and is disabled offline with the offline note.

## Verification

- Unit: 114/114 (25 new: draft, quality, parser, route with mocked membership and provider,
  provider selection). tsc and ESLint clean; `next build` OK; `check:secrets` OK.
- E2E, run in isolation without the database-resetting setup project, against the existing
  owner, server with `RECOGNITION_PROVIDER=stub`: the new `recipe-draft.spec.ts` (read → draft
  → edit → save with 2 photos; discard/manual keep photos; failure stores nothing; leaving a
  draft discards it) plus photo-capture, photo-edit and offline-photos on desktop Chromium and
  Pixel 7: **27/27 passed**.
- **Live on Vercel** with real Tesseract, signed in as the owner, nothing saved: a readable page
  became a draft in about 3.2 s, a two-page recipe in about 2.8 s, and the most cursive sample
  showed the failure screen (`low_quality`).

## Deviations from plan

- **[Owner decision] Provider is Tesseract, not Document AI + Gemini;** text-to-recipe
  structure comes from `parse-text.ts` rules instead of model-structured output.
- **[Rule 2 - correctness] Provider output includes confidence,** so the D-10 gate can reject
  noise; the plan's interface returned only the draft.
- **[Rule 1 - bug] Empty RECOGNITION_PROVIDER disabled reading** (`??` vs `||`); fixed before
  commit and covered by a test.
- **[Rule 3 - blocking] Tesseract hung on Vercel.** The worker thread could not load zlibjs,
  bmp-js, wasm-feature-detect and idb-keyval (not followed by file tracing), so `createWorker`
  never resolved and the connection dropped after about 37 s. A temporary diagnostic route found
  it (deployed, then removed); `next.config.ts` now traces tesseract.js with every dependency, and
  start-up fails after 20 s instead of hanging.
- **[Rule 1 - tuning] D-10 confidence threshold 50 → 65.** Measured on the browser's own reading
  copies: readable synthetic pages 70–94, the cursive sample 61 (it produced a noisy draft live at
  the old threshold). Recorded in 02-PROVIDER-DECISION.md.
- **[Design] One RecipeForm for manual and draft entry,** remounted with the draft, to avoid two
  forms with the same field ids on the page.
- **Task 2 checkpoint** was satisfied by the owner's explicit choice (option A) and the
  package check recorded in 02-PROVIDER-DECISION.md; no credentials were needed.

## Known limits

- Real handwriting is untested; expect many cursive pages to fail the gate. Then the family
  types the recipe with the photos attached.
- Correction effort on synthetic pages: about 4 ingredient and 2.6 step edits per recipe, typical
  errors `g`→`9`, `1 1/2`→`11/2`.
