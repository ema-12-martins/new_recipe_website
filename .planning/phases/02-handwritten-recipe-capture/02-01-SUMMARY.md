---
phase: 02-handwritten-recipe-capture
plan: 01
subsystem: recognition-benchmark
tags: [ocr, benchmark, tesseract, privacy, decision-record]

requires: []
provides:
  - scripts/ocr-benchmark (scorer, runner, providers document-ai, gemini, tesseract)
  - synthetic made-up samples generator (scripts/ocr-benchmark/synthetic)
  - 02-PROVIDER-DECISION.md (Tesseract approved; real handwriting not tested)
affects: [02-04]

actuals:
  tasks: 3
  commits: 3

tech-stack:
  added:
    - tesseract.js 7.0.0 (Apache-2.0)
  patterns:
    - "Providers are plain modules with recognize({ images }) and an optional close() for local workers"
    - "Language data is bundled, never downloaded at runtime (cacheMethod none)"

key-files:
  created:
    - scripts/ocr-benchmark/providers/tesseract.mjs
    - src/lib/recognition/tessdata/{por,eng}.traineddata.gz, README.md
    - .planning/phases/02-handwritten-recipe-capture/02-PROVIDER-DECISION.md
  modified:
    - scripts/ocr-benchmark/run.mjs (calls provider.close())
    - package.json, package-lock.json

key-decisions:
  - "Approved provider: Tesseract inside our own Vercel function (fra1); free, no card, photos never leave the function"
  - "Low-quality threshold (D-10): mean confidence >= 50, >= 20 non-space characters, a title and at least one ingredient or step line"
  - "Real handwriting not tested; the owner accepted this risk; Azure Document Intelligence F0 or Google Document AI remain the upgrade path"

requirements-completed: []
duration: "Tasks 1-2 in the previous session; Task 3 resolved 2026-10-23"
completed: 2026-10-23
---

# Phase 2 Plan 01: OCR benchmark and provider decision — Summary

The benchmark harness from Tasks 1-2 (`f90660f`, `da4917c`) was used to resolve Task 3 without
Google Cloud: the owner asked for a free option without a payment card, and chose Tesseract
running on our own server (option A).

## Task 3 outcome

- `tesseract.js@7.0.0` verified (official repository, Apache-2.0, about 2.26 M weekly
  downloads) and installed exactly; only its declared dependencies were added.
- A Tesseract adapter was added to the harness. On the 8 synthetic recipes (9 pages): 0
  failures, 58 field edits, 29 critical errors (quantities 12, units 17), p50 404 ms.
- Confidence measured on samples (75-92), the most cursive sample (45), random noise (13) and a
  blank page (0) set the D-10 threshold at 50.
- Portuguese and English `best_int` language data (4.2 MB gzip) are bundled in
  `src/lib/recognition/tessdata`, so production never downloads models.
- `02-PROVIDER-DECISION.md` records the candidates, the D-17 verdicts, the results, the
  threshold, hosting limits (Vercel 4.5 MB request body, 300 s Hobby maximum duration, 2 GB) and
  the decision.

## Deviations from plan

- **[Owner decision] No real handwritten samples and no Google Cloud run.** The plan expected
  15-20 real family pages (D-15) and a Google benchmark. The owner chose the free option
  instead; the decision record states that handwriting is untested and lists the upgrade path.
- **[Rule 3 - blocking] Harness could not exit with a local worker.** `run.mjs` now calls an
  optional `provider.close()`.

## Next

Plan 02-04 builds the read endpoint, reading, draft and failure states on the stub provider and
then wires the Tesseract adapter.
