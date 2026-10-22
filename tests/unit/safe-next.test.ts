import { describe, expect, it } from "vitest";

import { safeNextPath, withLocale } from "@/lib/auth/safe-next";

describe("safeNextPath", () => {
  it("keeps a same-site path under a locale", () => {
    expect(safeNextPath("/pt/recipes/x", "pt")).toBe("/pt/recipes/x");
    expect(safeNextPath("/en/recipes/new?draft=1", "pt")).toBe("/en/recipes/new?draft=1");
  });

  it.each([
    ["absolute URL", "https://evil.example"],
    ["protocol-relative URL", "//evil.example"],
    ["backslash trick", "/\\evil"],
    ["backslash after locale", "/pt/\\evil.example"],
    ["scheme inside the path", "/pt/x?u=https://evil.example"],
    ["no locale segment", "/recipes"],
    ["unsupported locale", "/fr/recipes"],
    ["bare locale without trailing slash", "/pt"],
    ["javascript scheme", "javascript:alert(1)"],
    ["control character", "/pt/\tx"],
    ["empty string", ""],
  ])("rejects %s", (_name, next) => {
    expect(safeNextPath(next, "en")).toBe("/en/recipes");
  });

  it("falls back to the cookbook for null or undefined", () => {
    expect(safeNextPath(null, "pt")).toBe("/pt/recipes");
    expect(safeNextPath(undefined, "en")).toBe("/en/recipes");
  });
});

describe("withLocale", () => {
  it("replaces only the first segment", () => {
    expect(withLocale("/pt/recipes/abc", "en")).toBe("/en/recipes/abc");
    expect(withLocale("/en/recipes/pt/x", "pt")).toBe("/pt/recipes/pt/x");
  });
});
