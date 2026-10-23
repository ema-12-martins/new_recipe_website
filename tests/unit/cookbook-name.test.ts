import { describe, expect, it } from "vitest";

import { DEFAULT_COOKBOOK_NAME, displayCookbookName } from "@/lib/cookbook-name";

describe("displayCookbookName", () => {
  it("shows the localised app name while the cookbook keeps the database default", () => {
    expect(displayCookbookName(DEFAULT_COOKBOOK_NAME, "Livro de Receitas da Família")).toBe(
      "Livro de Receitas da Família",
    );
  });

  it("keeps a name the family chose", () => {
    expect(displayCookbookName("Receitas da Avó", "Livro de Receitas da Família")).toBe(
      "Receitas da Avó",
    );
  });

  it("falls back to the app name for a blank name", () => {
    expect(displayCookbookName("   ", "Family Recipe Cookbook")).toBe("Family Recipe Cookbook");
  });
});
