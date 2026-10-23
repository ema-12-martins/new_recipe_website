import { describe, expect, it } from "vitest";

import { missingParts } from "@/lib/recipes/missing";

const complete = { title: "Bolo", ingredients: ["2 ovos"], steps: ["Bater."] };

describe("missingParts", () => {
  it("is empty for a recipe with a title, an ingredient and a step", () => {
    expect(missingParts(complete)).toEqual([]);
  });

  it("lists every missing part in form order", () => {
    expect(missingParts({ title: "", ingredients: [], steps: [] })).toEqual([
      "title",
      "ingredients",
      "steps",
    ]);
  });

  it("treats whitespace-only text as missing", () => {
    expect(missingParts({ title: "  ", ingredients: ["\t", ""], steps: [" \n "] })).toEqual([
      "title",
      "ingredients",
      "steps",
    ]);
  });

  it("needs only one line with text in each list", () => {
    expect(missingParts({ ...complete, ingredients: ["", "sal"], steps: [" ", "Ferver."] })).toEqual(
      [],
    );
    expect(missingParts({ ...complete, steps: [""] })).toEqual(["steps"]);
  });
});
