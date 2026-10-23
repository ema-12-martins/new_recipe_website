// Usage: node scripts/ocr-benchmark/run.mjs <provider> [--samples <dir>] [--out <dir>]
//        node scripts/ocr-benchmark/run.mjs --stub [--samples <dir>] [--out <dir>]
//
// Runs one recognition provider over every sample recipe and reports how much a person would
// have to correct (see score.mjs). Samples are one folder per recipe holding page-1.jpg,
// page-2.jpg, ... and expected.json ({ language, title, ingredients, steps }).
// The run never prints recipe text, and the results file names recipes by number only.

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { scoreDraft } from "./score.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_SAMPLES = join(
  here,
  "..",
  "..",
  ".planning",
  "phases",
  "02-handwritten-recipe-capture",
  "benchmark",
  "samples",
);

function parseArgs(argv) {
  const args = { provider: undefined, samples: DEFAULT_SAMPLES, out: join(here, "results"), stub: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--stub") args.stub = true;
    else if (arg === "--samples") args.samples = argv[++i];
    else if (arg === "--out") args.out = argv[++i];
    else if (!arg.startsWith("--") && !args.provider) args.provider = arg;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (args.stub) args.provider = "stub";
  if (!args.provider || !/^[a-z0-9-]+$/.test(args.provider)) {
    throw new Error("Name a provider (for example document-ai or gemini) or pass --stub.");
  }
  return args;
}

async function loadProvider(name) {
  if (name === "stub") {
    // Echoes the expected recipe, so the harness can be exercised without credentials.
    return { recognize: async ({ expected }) => structuredClone(expected) };
  }
  return import(pathToFileURL(join(here, "providers", `${name}.mjs`)).href);
}

function readSamples(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((name) => {
      const folder = join(directory, name);
      const expected = JSON.parse(readFileSync(join(folder, "expected.json"), "utf8"));
      const images = readdirSync(folder)
        .filter((file) => /^page-\d+\.(jpe?g|png|webp)$/i.test(file))
        .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
        .map((file) => ({ name: file, data: readFileSync(join(folder, file)) }));
      if (images.length === 0) throw new Error("A sample folder has no page-N image.");
      return { expected, images };
    });
}

const mean = (values) => (values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length);

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const provider = await loadProvider(args.provider);
  const samples = readSamples(args.samples);
  if (samples.length === 0) throw new Error("No sample recipes found.");

  const results = [];
  for (const [index, sample] of samples.entries()) {
    const label = `recipe-${String(index + 1).padStart(2, "0")}`;
    const started = performance.now();
    try {
      const draft = await provider.recognize({
        images: sample.images,
        language: sample.expected.language,
        expected: sample.expected,
      });
      results.push({
        recipe: label,
        failed: false,
        latencyMs: Math.round(performance.now() - started),
        score: scoreDraft(sample.expected, draft),
      });
    } catch (error) {
      results.push({
        recipe: label,
        failed: true,
        latencyMs: Math.round(performance.now() - started),
        errorKind: error?.kind ?? "error",
      });
    }
  }

  const scored = results.filter((result) => !result.failed);
  const latencies = results.map((result) => result.latencyMs);
  const summary = {
    recipes: results.length,
    failures: results.length - scored.length,
    totalEdits: scored.reduce((sum, r) => sum + r.score.totalEdits, 0),
    meanEdits: {
      title: mean(scored.map((r) => (r.score.title.distance > 0 ? 1 : 0))),
      ingredients: mean(scored.map((r) => r.score.ingredients.edits)),
      steps: mean(scored.map((r) => r.score.steps.edits)),
    },
    critical: {
      quantities: scored.reduce((sum, r) => sum + r.score.critical.quantities, 0),
      units: scored.reduce((sum, r) => sum + r.score.critical.units, 0),
      temperatures: scored.reduce((sum, r) => sum + r.score.critical.temperatures, 0),
      stepOrder: scored.reduce((sum, r) => sum + r.score.critical.stepOrder, 0),
    },
    latencyMs: { p50: percentile(latencies, 50), p95: percentile(latencies, 95) },
  };
  summary.critical.total =
    summary.critical.quantities + summary.critical.units + summary.critical.temperatures + summary.critical.stepOrder;

  mkdirSync(args.out, { recursive: true });
  const file = join(args.out, `${args.provider}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(file, JSON.stringify({ provider: args.provider, summary, recipes: results }, null, 2));

  console.log(`provider: ${args.provider}`);
  console.log(`recipes: ${summary.recipes} (failures: ${summary.failures})`);
  console.log(
    `mean edits per recipe: title ${summary.meanEdits.title.toFixed(2)}, ingredients ${summary.meanEdits.ingredients.toFixed(2)}, steps ${summary.meanEdits.steps.toFixed(2)}`,
  );
  console.log(
    `critical errors: ${summary.critical.total} (quantities ${summary.critical.quantities}, units ${summary.critical.units}, temperatures ${summary.critical.temperatures}, step order ${summary.critical.stepOrder})`,
  );
  console.log(`latency ms: p50 ${summary.latencyMs.p50}, p95 ${summary.latencyMs.p95}`);
  console.log(`results written to ${file}`);
  console.log(`RESULT ${JSON.stringify({ recipes: summary.recipes, failures: summary.failures, totalEdits: summary.totalEdits, critical: summary.critical.total })}`);
}

main().catch((error) => {
  console.error(error?.message ?? error);
  process.exit(1);
});
