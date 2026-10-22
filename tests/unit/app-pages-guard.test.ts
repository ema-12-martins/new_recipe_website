import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// A soft navigation re-renders only the page, not the shared layout, so every member page must
// run the membership guard itself (T-01-43). New pages cannot silently drop it.
const APP_DIR = path.join(process.cwd(), "src", "app", "[locale]", "(app)");

const pages = readdirSync(APP_DIR, { recursive: true, encoding: "utf8" })
  .filter((file) => path.basename(file) === "page.tsx")
  .map((file) => path.join(APP_DIR, file));

describe("(app) membership guard", () => {
  it("finds every member page", () => {
    expect(pages.length).toBeGreaterThanOrEqual(6);
  });

  it.each([path.join(APP_DIR, "layout.tsx"), ...pages].map((file) => [
    path.relative(APP_DIR, file),
    file,
  ]))("%s calls requireMembership", (_name, file) => {
    expect(readFileSync(file, "utf8")).toContain("requireMembership(");
  });
});
