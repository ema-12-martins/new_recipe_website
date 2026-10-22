import { describe, expect, it } from "vitest";

import { normalizeLines, readRecipeForm, recipeInputSchema } from "@/lib/recipes/schema";

const ID = "6f1c1d2e-3b4a-4c5d-8e9f-0a1b2c3d4e5f";

describe("normalizeLines", () => {
  it("keeps non-blank lines byte-identical and drops blank ones", () => {
    const kept = "  ½ chávena de açúcar ";
    expect(normalizeLines([kept, "   ", "", "\t", "1 1/2 cups flour"])).toEqual([
      kept,
      "1 1/2 cups flour",
    ]);
  });

  it("does not Unicode-normalize a decomposed accent", () => {
    const decomposed = "cafe\u0301 moi\u0301do";
    const [line] = normalizeLines([decomposed]);
    expect(line).toBe(decomposed);
    expect(line).not.toBe(decomposed.normalize("NFC"));
  });
});

describe("recipeInputSchema", () => {
  const valid = {
    id: ID,
    title: "Bolo de Laranja da Avó",
    ingredients: ["½ chávena de açúcar", "   ", "3 ovos"],
    steps: ["Pré-aquecer o forno a 180 °C.", "Misturar tudo."],
  };

  it("accepts a recipe and drops only the blank lines, leaving text as typed", () => {
    const parsed = recipeInputSchema.parse({ ...valid, title: " Bolo " });
    expect(parsed.title).toBe(" Bolo ");
    expect(parsed.ingredients).toEqual(["½ chávena de açúcar", "3 ovos"]);
    expect(parsed.steps).toEqual(valid.steps);
  });

  it("rejects a title of only spaces", () => {
    expect(recipeInputSchema.safeParse({ ...valid, title: "    " }).success).toBe(false);
  });

  it("rejects a title over 300 characters", () => {
    expect(recipeInputSchema.safeParse({ ...valid, title: "a".repeat(301) }).success).toBe(false);
    expect(recipeInputSchema.safeParse({ ...valid, title: "a".repeat(300) }).success).toBe(true);
  });

  it("rejects 201 ingredients", () => {
    const ingredients = Array.from({ length: 201 }, (_, i) => `ingrediente ${i}`);
    expect(recipeInputSchema.safeParse({ ...valid, ingredients }).success).toBe(false);
    expect(
      recipeInputSchema.safeParse({ ...valid, ingredients: ingredients.slice(0, 200) }).success,
    ).toBe(true);
  });

  it("rejects an over-long step and a non-uuid id", () => {
    expect(recipeInputSchema.safeParse({ ...valid, steps: ["x".repeat(4001)] }).success).toBe(
      false,
    );
    expect(recipeInputSchema.safeParse({ ...valid, id: "not-an-id" }).success).toBe(false);
  });
});

describe("readRecipeForm", () => {
  it("reads repeated fields in order and the optional version", () => {
    const formData = new FormData();
    formData.set("id", ID);
    formData.set("title", "Sopa");
    formData.append("ingredients[]", "água");
    formData.append("ingredients[]", "sal");
    formData.append("steps[]", "Ferver.");
    formData.set("version", "3");

    expect(readRecipeForm(formData)).toEqual({
      id: ID,
      title: "Sopa",
      ingredients: ["água", "sal"],
      steps: ["Ferver."],
      version: 3,
    });
    formData.delete("version");
    expect(readRecipeForm(formData).version).toBeUndefined();
  });
});
