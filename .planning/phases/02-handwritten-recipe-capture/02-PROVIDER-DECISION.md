# Phase 2 — Recognition Provider Decision

**Date:** 2026-10-23
**Approver:** project owner (chat, 2026-10-23: chose option "A — Tesseract no nosso servidor")
**Decision:** **Approved: Tesseract (`tesseract.js` 7.0.0) running inside our own Vercel function.**
**Status of the evidence:** setup verified on synthetic samples; **real handwriting not tested**.
The owner accepted this risk in exchange for zero cost and no third-party processing.

## Why this provider

The owner asked for a server-side reader that costs nothing and needs no payment card.
No hosted API was found that is free, needs no card, meets D-17 (EU processing, no retention,
no training) and reads handwriting well at the same time:

| Candidate | Cost | Card | D-17 | Handwriting | Outcome |
|-----------|------|------|------|-------------|---------|
| Google Document AI + Vertex AI Gemini | cents | yes | pass (EU endpoints, paid terms) | good (expected) | Not chosen: payment card required |
| Gemini via Google AI Studio (free) | free | no | **fail**: free-tier data may be used to improve Google services | good | Rejected (D-17) |
| Azure AI Document Intelligence F0 | free (about 500 pages/month) | yes | pass (EU regions) | good (expected) | Not chosen: card required; remains the upgrade path |
| Google Cloud Vision free tier | free (about 1000 units/month) | yes | pass with EU config | good (expected) | Not chosen: card required |
| Unvetted free OCR APIs (e.g. OCR.space) | free | no | unknown | varies | Rejected: D-17 cannot be confirmed |
| **Tesseract in our function** | **free** | **no** | **pass**: photos never leave our function | weak on cursive | **Approved** |

Prices and free tiers are as known on 2026-10-23 and must be re-checked before any switch.

## Privacy verdict (D-17)

- **EU processing:** the read endpoint runs in Vercel region `fra1` (`vercel.json`).
- **No retention:** images are held in memory for the request only; nothing is written to
  Storage or the database by the read endpoint (CAPT-03); the Tesseract language cache is
  disabled (`cacheMethod: "none"`).
- **No training:** no third party receives the photos.
- The Portuguese and English language data (`4.0.0_best_int`, Apache-2.0 tessdata via
  `@tesseract.js-data`) are bundled with the app, so nothing is fetched at runtime.

## Supply chain (T-02-20)

`tesseract.js@7.0.0`, Apache-2.0, repository `github.com/naptha/tesseract.js`, about 2.26 M
weekly downloads, maintainers antimatter15, jeromewu, bijection, balearica. Its install script
(an Open Collective banner) is not run. Installed with `--save-exact`; the lockfile adds only
its declared dependencies.

## Results (synthetic samples only)

8 made-up recipes, 9 pages, rendered with handwriting-style fonts
(`scripts/ocr-benchmark/synthetic`), run with `node scripts/ocr-benchmark/run.mjs tesseract`:

| Measure | Value |
|---------|-------|
| Failures | 0 of 8 |
| Mean edits per recipe | title 0.50, ingredients 4.13, steps 2.63 |
| Total edits | 58 |
| Critical errors | 29 (quantities 12, units 17, temperatures 0, step order 0) |
| Latency (local, warm, bundled language data) | p50 404 ms, p95 768 ms per recipe |

Typical errors: `g` read as `9`, `1 1/2` as `11/2`, stray `.` after numbers. The most cursive
sample (`08-pancakes`) produced 32 characters at mean confidence 45. These numbers do **not**
predict real family handwriting, which is expected to be worse.

## Acceptance and the low-quality threshold (D-10)

**Acceptance target (D-16):** none agreed. The owner approved Tesseract on cost and privacy
grounds without a correction-effort target; set one (for example "at most N field edits and no
critical errors per recipe") when real handwritten pages are run.

A read is usable only when **all** hold (`src/lib/recognition/quality.ts`):

| Rule | Threshold | Basis |
|------|-----------|-------|
| Mean Tesseract confidence | ≥ 50 | Synthetic pages 75–92; cursive sample 45; random noise 13 |
| Non-space characters | ≥ 20 | Blank page 0 |
| Title | not empty | D-10 |
| Ingredient + step lines | ≥ 1 | D-10 |

Anything else shows the failure screen ("Try again" / "Enter it manually"). Every usable read
is still only a draft that the member must check and save (D-05 to D-08).

## Cost, quota and hosting

- Cost 0. Runs on the Vercel Hobby plan: function memory 2 GB, maximum duration 300 s
  (confirmed on vercel.com/docs/functions/limitations); the route uses `maxDuration = 60`.
- Request bodies are capped at 4.5 MB by Vercel, so the browser sends smaller reading copies
  (long edge 1600 px, total under 4 MB) in addition to the photos it keeps for saving.
- No credentials. `RECOGNITION_PROVIDER=tesseract` (server-only) turns reading on;
  unset hides "Read recipe".

## Open items

- Run the same harness on 5–10 real handwritten pages (the owner can copy made-up recipes by
  hand) and revisit this decision; D-15's 15–20 family pages were not used.
- If correction effort is too high, the upgrade path is Azure Document Intelligence F0 or Google
  Document AI behind the same `RecognitionProvider` interface (D-19).
