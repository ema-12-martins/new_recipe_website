---
quick_id: 261023-l4j
slug: use-groq-vision-qwen3-8-27b-to-read-reci
status: complete
date: 2026-10-23
key-files:
  - src/lib/recognition/groq.ts
  - src/lib/recognition/config.ts
  - src/lib/recognition/index.ts
  - src/lib/recognition/limits.ts
  - src/app/api/recipes/read/route.ts
  - src/i18n/messages/pt.json
  - src/i18n/messages/en.json
  - scripts/check-client-bundle.mjs
  - .env.example
  - tests/unit/recognition-groq.test.ts
  - tests/unit/recognition-provider.test.ts
  - .planning/phases/02-handwritten-recipe-capture/02-PROVIDER-DECISION.md
---

# Quick 261023-l4j Summary: read recipe photos with Groq vision

## What changed
- **`groq.ts`:** server-only provider calling `qwen/qwen3.8-27b` with JSON mode and hidden
  reasoning. Up to 3 pages per request, in order; chunks are merged (first title, ingredients and
  steps appended); the JSON shape is validated. On 429 it waits as Groq asks (header or "try
  again in Xs") and retries, up to 8 times or until the read's deadline aborts.
- **Selection:** `RECOGNITION_PROVIDER` unset → Groq when `GROQ_API_KEY` is set, otherwise
  Tesseract; `groq`, `tesseract`, `stub` or off can be forced.
- **Timeouts:** server 110 s, client 120 s, `maxDuration` 120 (Vercel Hobby allows 300 s).
  Reading hint: "Normalmente demora poucos segundos; receitas com muitas páginas podem demorar até
  dois minutos."
- **Secrets:** `GROQ_API_KEY` is server-only; `check:secrets` now also fails on `gsk_` keys and on
  the configured key value.
- **Decision record:** Groq is the default reader, with retention, EEA, cost and limits verified
  and training and processing region recorded as unresolved.

## Verification
- Unit 122/122 (8 new for Groq: request shape, base64 order, chunking/merge, repeated 429 waits,
  abort, errors, malformed JSON, missing key; provider selection updated). tsc and ESLint clean;
  `next build` OK; `check:secrets` OK.
- Local production build with the owner's key, real UI, owner session, nothing saved: Salpicão
  (15 ingredients), Bolo de chocolate (7/6) and Bolo de cenoura (10/3) became drafts in about 1-1.3 s;
  four photos as one recipe (two chunks) waited for the per-minute limit and finished in about 61 s.
  The first run's Bolo de mel failure came from a single rate-limit retry being refused again,
  fixed by repeated waits.
- Live Vercel: pending the owner adding `GROQ_API_KEY` to the Vercel Production environment and
  redeploying.

## Notes
- The owner accepts that consecutive reads can hit the free per-minute limit and show the failure
  screen; "Tentar novamente" works a minute later.
