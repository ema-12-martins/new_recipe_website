import { describe, expect, it } from "vitest";

import { foldText, matchesQuery, searchableText } from "@/lib/recipes/search";

const bolo = searchableText({
  title: "Bolo de Laranja da Avó",
  ingredients: ["½ chávena de açúcar", "3 ovos", "Sumo de 2 laranjas"],
});

describe("foldText", () => {
  it("ignores case and accents", () => {
    expect(foldText("Ábacaxi AÇÚCAR")).toBe("abacaxi acucar");
  });
});

describe("matchesQuery", () => {
  it("matches the title, ignoring case and accents", () => {
    expect(matchesQuery("bolo", bolo)).toBe(true);
    expect(matchesQuery("AVO", bolo)).toBe(true);
  });

  it("matches an ingredient", () => {
    expect(matchesQuery("acucar", bolo)).toBe(true);
    expect(matchesQuery("ovos", bolo)).toBe(true);
  });

  it("needs every word, in any order, across title and ingredients", () => {
    expect(matchesQuery("laranja ovos", bolo)).toBe(true);
    expect(matchesQuery("ovos bolo", bolo)).toBe(true);
    expect(matchesQuery("bolo chocolate", bolo)).toBe(false);
  });

  it("matches everything for a blank query and nothing unrelated", () => {
    expect(matchesQuery("", bolo)).toBe(true);
    expect(matchesQuery("   ", bolo)).toBe(true);
    expect(matchesQuery("farinha", bolo)).toBe(false);
  });
});
