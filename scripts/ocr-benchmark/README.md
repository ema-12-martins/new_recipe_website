# OCR provider benchmark (Phase 2)

Measures how much a person would have to correct a draft read from the family's own handwriting.
It is the evidence for the provider decision in `02-PROVIDER-DECISION.md`. No provider is approved
until it has been run here.

## Never commit family material

Family photos, typed transcripts and raw results are private. They live only in git-ignored
folders on your machine:

- `.planning/phases/02-handwritten-recipe-capture/benchmark/` (samples)
- `scripts/ocr-benchmark/results/` (results; recipes are named `recipe-01`, `recipe-02`, … and no
  recipe text is stored)

Check before committing: `git check-ignore -v .planning/phases/02-handwritten-recipe-capture/benchmark/x`
must print a rule. Only counts and aggregate scores belong in `02-PROVIDER-DECISION.md`. Never commit
a token, a provider response, or a photo.

## Samples

One folder per recipe under `.planning/phases/02-handwritten-recipe-capture/benchmark/samples/`:

```
bolo/
  page-1.jpg
  page-2.jpg
  expected.json
```

`expected.json` is the recipe typed exactly as written (same wording, accents, quantities, units):

```json
{ "language": "pt", "title": "…", "ingredients": ["…"], "steps": ["…"] }
```

Aim for 15–20 pages with different handwriting, Portuguese and English, different layouts and
photo quality (including poor light).

## Running

```
node scripts/ocr-benchmark/run.mjs --stub                 # no credentials; checks the harness
node scripts/ocr-benchmark/run.mjs document-ai
node scripts/ocr-benchmark/run.mjs gemini
```

Credentials go in the shell only, never in a file:

| Provider | Variables |
|----------|-----------|
| `document-ai` | `DOCUMENT_AI_ENDPOINT` (EU processor URL ending in `:process`), `GCP_ACCESS_TOKEN` |
| `gemini` | `GEMINI_ENDPOINT` (EU Vertex AI model URL ending in `:generateContent`), `GCP_ACCESS_TOKEN` |

Get a short-lived token with `gcloud auth print-access-token` and set it for the session
(`$env:GCP_ACCESS_TOKEN = "..."` in PowerShell). Use endpoints in an EU region only.

## Reading the result

For each provider the run prints the mean number of corrections per recipe (title, ingredient
lines, steps), the recipe-critical errors (quantities, fractions, units, temperatures, step order),
and latency. Comparison is exact: no case folding and no accent stripping.

Another candidate? Add `providers/<name>.mjs` exporting `recognize({ images, language })` that
returns `{ title, ingredients, steps }`, and run it by name.
