# Tesseract language data

`por.traineddata.gz` and `eng.traineddata.gz` are the `4.0.0_best_int` LSTM models published as
`@tesseract.js-data/por` and `@tesseract.js-data/eng` (packaging MIT, repository
`github.com/naptha/tessdata`; the models come from `github.com/tesseract-ocr/tessdata`,
Apache-2.0). They are bundled so the read endpoint never downloads anything at runtime
(`.planning/phases/02-handwritten-recipe-capture/02-PROVIDER-DECISION.md`).

Downloaded 2026-10-23 from `https://cdn.jsdelivr.net/npm/@tesseract.js-data/<lang>/4.0.0_best_int/`.
SHA-256 prefixes: por `DACEBC1386DDAAF8`, eng `45B4CB346724AC17`.
