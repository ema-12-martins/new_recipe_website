import { describe, expect, it } from "vitest";

import { sanitiseDraft } from "@/lib/recognition/draft";
import { draftFromText } from "@/lib/recognition/parse-text";
import { draftProblem, isUsableDraft, RECOGNITION_QUALITY } from "@/lib/recognition/quality";
import { RECIPE_LIMITS } from "@/lib/recipes/schema";

const good = {
  title: "Bolo de laranja",
  ingredients: ["1/2 chávena de açúcar", "  ", "Sumo de 2 laranjas"],
  steps: ["Levar ao forno a 180 °C durante 40 minutos.", ""],
};

describe("sanitiseDraft", () => {
  it("drops blank lines and keeps accents, fractions and temperatures byte-identical", () => {
    expect(sanitiseDraft(good)).toEqual({
      title: "Bolo de laranja",
      ingredients: ["1/2 chávena de açúcar", "Sumo de 2 laranjas"],
      steps: ["Levar ao forno a 180 °C durante 40 minutos."],
    });
  });

  it("does not trim or rewrite non-blank lines", () => {
    const draft = { title: " 100 9 de manteiga ", ingredients: ["11/2 chávena "], steps: [] };
    expect(sanitiseDraft(draft)).toEqual(draft);
  });

  it("rejects a draft that would break the recipe limits", () => {
    expect(sanitiseDraft({ ...good, title: "a".repeat(RECIPE_LIMITS.titleMax + 1) })).toBeNull();
    const many = Array.from({ length: RECIPE_LIMITS.stepsMax + 1 }, (_, i) => `passo ${i}`);
    expect(sanitiseDraft({ ...good, steps: many })).toBeNull();
  });
});

describe("draft quality (D-10)", () => {
  const usable = sanitiseDraft(good)!;

  it("accepts a draft at the confidence threshold", () => {
    expect(isUsableDraft(usable, RECOGNITION_QUALITY.minConfidence)).toBe(true);
    expect(isUsableDraft(usable, null)).toBe(true);
  });

  it("rejects low confidence, an empty read, too little text, no title or no lines", () => {
    expect(draftProblem(usable, RECOGNITION_QUALITY.minConfidence - 1)).toBe("low_quality");
    expect(draftProblem({ title: "", ingredients: [], steps: [] }, 90)).toBe("empty");
    expect(draftProblem({ title: "Bolo", ingredients: ["ovos"], steps: [] }, 90)).toBe("low_quality");
    expect(draftProblem({ ...usable, title: "" }, 90)).toBe("low_quality");
    expect(draftProblem({ ...usable, ingredients: [], steps: [] }, 90)).toBe("low_quality");
  });
});

describe("draftFromText", () => {
  it("splits title, ingredients and steps at headings and removes step numbers only", () => {
    const text = [
      "Bolo de laranja da tia Rosa",
      "Ingredientes",
      "4 ovos",
      "100 9 de manteiga",
      "",
      "Modo de preparação",
      "1. Bater os ovos.",
      "2) Levar ao forno a 180 °C.",
    ].join("\n");
    expect(draftFromText(text)).toEqual({
      title: "Bolo de laranja da tia Rosa",
      ingredients: ["4 ovos", "100 9 de manteiga"],
      steps: ["Bater os ovos.", "Levar ao forno a 180 °C."],
    });
  });

  it("recognises headings whose first letter was misread", () => {
    expect(draftFromText("Bolo\nlngredientes\n4 ovos\nWodo de preparação\n1. Bater.")).toEqual({
      title: "Bolo",
      ingredients: ["4 ovos"],
      steps: ["Bater."],
    });
  });

  it("takes numbered lines as steps when there is no steps heading", () => {
    expect(draftFromText("Scones\n225 g flour\n1. Rub in.\n2. Bake.")).toEqual({
      title: "Scones",
      ingredients: ["225 g flour"],
      steps: ["Rub in.", "Bake."],
    });
  });

  it("keeps numbered ingredient lines as ingredients once a steps heading exists", () => {
    expect(draftFromText("Pão\n1. farinha\nMethod\nMix.").ingredients).toEqual(["1. farinha"]);
  });
});
