import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { draftFromText } from "../../scripts/ocr-benchmark/providers/shared.mjs";
import { extractCriticalTokens, scoreDraft } from "../../scripts/ocr-benchmark/score.mjs";

const recipe = {
  title: "Bolo de laranja",
  ingredients: ["2 ovos", "1 1/2 chávena de açúcar", "100 g de manteiga"],
  steps: ["Misturar tudo.", "Assar a 180 °C durante 40 minutos.", "Servir frio."],
};

const withIngredients = (ingredients: string[]) => ({ ...recipe, ingredients });
const withSteps = (steps: string[]) => ({ ...recipe, steps });

describe("scoreDraft", () => {
  it("scores a perfect match as zero edits everywhere", () => {
    const score = scoreDraft(recipe, structuredClone(recipe));
    expect(score.totalEdits).toBe(0);
    expect(score.title.distance).toBe(0);
    expect(score.critical.total).toBe(0);
  });

  it("counts a missing, an extra and a changed ingredient line once each", () => {
    expect(scoreDraft(recipe, withIngredients(recipe.ingredients.slice(0, 2))).ingredients).toMatchObject({
      missing: 1,
      extra: 0,
      edits: 1,
    });
    expect(
      scoreDraft(recipe, withIngredients([...recipe.ingredients, "1 pitada de sal"])).ingredients,
    ).toMatchObject({ missing: 0, extra: 1, edits: 1 });
    expect(
      scoreDraft(recipe, withIngredients(["2 ovos", "1 1/2 chávena de açúcar", "100 g de manteig"])).ingredients,
    ).toMatchObject({ changed: 1, missing: 0, extra: 0, edits: 1 });
  });

  it("treats two swapped steps as an order error, not as changed lines", () => {
    const score = scoreDraft(recipe, withSteps([recipe.steps[1], recipe.steps[0], recipe.steps[2]]));
    expect(score.steps.orderErrors).toBe(1);
    expect(score.steps.changed).toBe(0);
    expect(score.critical.stepOrder).toBe(1);
  });

  it("flags a changed fraction, and compares fractions exactly as written", () => {
    const changed = scoreDraft(recipe, withIngredients(["2 ovos", "1 1/3 chávena de açúcar", "100 g de manteiga"]));
    expect(changed.critical.quantities).toBe(1);

    const other = scoreDraft(
      { ...recipe, ingredients: ["½ chávena de leite"] },
      { ...recipe, ingredients: ["1/2 chávena de leite"] },
    );
    expect(other.critical.quantities).toBe(1);
  });

  it("flags a changed temperature without also counting its number as a quantity", () => {
    const score = scoreDraft(recipe, withSteps(["Misturar tudo.", "Assar a 170 °C durante 40 minutos.", "Servir frio."]));
    expect(score.critical.temperatures).toBe(1);
    expect(score.critical.quantities).toBe(0);
    expect(score.critical.units).toBe(0);
  });

  it("compares accents exactly: açúcar versus acucar is a correction", () => {
    const score = scoreDraft(
      { ...recipe, ingredients: ["1 chávena de açúcar"] },
      { ...recipe, ingredients: ["1 chavena de acucar"] },
    );
    expect(score.ingredients.changed).toBe(1);
    expect(score.critical.units).toBe(1);
  });
});

describe("extractCriticalTokens", () => {
  it("finds quantities, units and temperatures as written", () => {
    const tokens = extractCriticalTokens(
      "2 colheres de sopa de açúcar, 1 1/2 chávena de leite, forno a 180 °C por 40 minutos",
    );
    expect(tokens.quantities).toEqual(["2", "1 1/2", "40"]);
    expect(tokens.units).toEqual(["colheres", "chávena", "minutos"]);
    expect(tokens.temperatures).toEqual(["180 °C"]);
  });

  it("does not read units out of the middle of words", () => {
    expect(extractCriticalTokens("farinha grande, limão, sal").units).toEqual([]);
  });
});

describe("benchmark harness", () => {
  function runBenchmark(args: string[], samples: string, out: string) {
    return spawnSync(
      process.execPath,
      ["scripts/ocr-benchmark/run.mjs", ...args, "--samples", samples, "--out", out],
      { encoding: "utf8" },
    );
  }

  it("runs end to end on synthetic samples with the built-in stub and reports zero edits", () => {
    const root = mkdtempSync(join(tmpdir(), "ocr-benchmark-"));
    try {
      const samples = join(root, "samples");
      for (const name of ["bolo", "sopa"]) {
        mkdirSync(join(samples, name), { recursive: true });
        writeFileSync(join(samples, name, "page-1.jpg"), Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
        writeFileSync(join(samples, name, "expected.json"), JSON.stringify({ language: "pt", ...recipe }));
      }

      const run = runBenchmark(["--stub"], samples, join(root, "out"));
      expect(run.status).toBe(0);
      const result = JSON.parse(run.stdout.trim().split("\n").at(-1)!.replace("RESULT ", ""));
      expect(result).toEqual({ recipes: 2, failures: 0, totalEdits: 0, critical: 0 });
      // Neither the summary nor the log repeats recipe text.
      expect(run.stdout).not.toContain("Bolo de laranja");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("refuses a provider name that could point outside the providers folder", () => {
    const run = runBenchmark(["../score"], tmpdir(), tmpdir());
    expect(run.status).not.toBe(0);
  });
});

describe("draftFromText", () => {
  it("reads the first line as the title and splits ingredients from steps at headings", () => {
    const draft = draftFromText(
      "Bolo de laranja\nIngredientes\n2 ovos\n1 chávena de açúcar\nModo de preparação\n1. Misturar tudo.\n2) Assar a 180 °C.",
    );
    expect(draft).toEqual({
      title: "Bolo de laranja",
      ingredients: ["2 ovos", "1 chávena de açúcar"],
      steps: ["Misturar tudo.", "Assar a 180 °C."],
    });
  });
});

describe("synthetic samples", () => {
  it.runIf(process.platform === "win32")(
    "renders every made-up recipe as JPEG pages with a matching answer file the harness accepts",
    () => {
      const root = mkdtempSync(join(tmpdir(), "ocr-synthetic-"));
      try {
        const samples = join(root, "samples");
        const make = spawnSync(process.execPath, ["scripts/ocr-benchmark/synthetic/make.mjs", "--out", samples], {
          encoding: "utf8",
        });
        expect(make.status, make.stderr).toBe(0);

        const data = JSON.parse(readFileSync("scripts/ocr-benchmark/synthetic/recipes.json", "utf8"));
        let pages = 0;
        for (const recipe of data.recipes) {
          const folder = join(samples, recipe.folder);
          const expected = JSON.parse(readFileSync(join(folder, "expected.json"), "utf8"));
          expect(expected).toEqual({
            language: recipe.language,
            title: recipe.title,
            ingredients: recipe.ingredients,
            steps: recipe.steps,
          });
          for (const file of readdirSync(folder).filter((name) => name.endsWith(".jpg"))) {
            const bytes = readFileSync(join(folder, file));
            expect([bytes[0], bytes[1]], `${recipe.folder}/${file}`).toEqual([0xff, 0xd8]);
            pages++;
          }
        }
        expect(pages).toBe(data.recipes.length + 1); // one recipe spans two pages

        const run = spawnSync(
          process.execPath,
          ["scripts/ocr-benchmark/run.mjs", "--stub", "--samples", samples, "--out", join(root, "out")],
          { encoding: "utf8" },
        );
        expect(run.status).toBe(0);
        expect(run.stdout).toContain(`"recipes":${data.recipes.length},"failures":0`);
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    },
    60_000,
  );
});

describe("benchmark privacy guard", () => {
  it("keeps family samples and raw results out of git", () => {
    for (const path of [
      ".planning/phases/02-handwritten-recipe-capture/benchmark/samples/bolo/page-1.jpg",
      ".planning/phases/02-handwritten-recipe-capture/benchmark/samples/bolo/expected.json",
      "scripts/ocr-benchmark/results/document-ai-2026.json",
    ]) {
      expect(spawnSync("git", ["check-ignore", "-q", path]).status, path).toBe(0);
    }
  });
});
