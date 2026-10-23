// Usage: node scripts/ocr-benchmark/synthetic/make.mjs [--out <dir>]
//
// Writes the made-up benchmark recipes as samples: expected.json from recipes.json and page
// images rendered in handwriting-style fonts (render.ps1, Windows only). These pages are a SETUP
// CHECK: they show whether a provider, its region, cost and latency work, but they are printed
// fonts, not handwriting, so they cannot approve a provider (roadmap Phase 2 decision gate).

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUT = join(here, "..", "..", "..", ".planning", "phases", "02-handwritten-recipe-capture", "benchmark", "synthetic");

const outIndex = process.argv.indexOf("--out");
const out = resolve(outIndex >= 0 ? process.argv[outIndex + 1] : DEFAULT_OUT);

if (process.platform !== "win32") {
  console.error("Rendering uses Windows fonts and System.Drawing; run this on Windows.");
  process.exit(2);
}

const data = JSON.parse(readFileSync(join(here, "recipes.json"), "utf8"));
for (const recipe of data.recipes) {
  const folder = join(out, recipe.folder);
  mkdirSync(folder, { recursive: true });
  const expected = {
    language: recipe.language,
    title: recipe.title,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
  };
  writeFileSync(join(folder, "expected.json"), `${JSON.stringify(expected, null, 2)}\n`);
}

const render = spawnSync(
  "powershell.exe",
  ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", join(here, "render.ps1"), "-Recipes", join(here, "recipes.json"), "-Out", out],
  { encoding: "utf8" },
);
process.stdout.write(render.stdout ?? "");
if (render.status !== 0) {
  process.stderr.write(render.stderr ?? "");
  process.exit(render.status ?? 1);
}
console.log(`${data.recipes.length} synthetic recipes written to ${out}`);
