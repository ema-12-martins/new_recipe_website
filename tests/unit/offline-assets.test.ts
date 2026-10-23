import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const constantsPath = path.join(root, "src", "lib", "offline", "constants.ts");
const offlineScriptPath = path.join(root, "public", "offline.js");
const workerPath = path.join(root, "public", "sw.js");

describe("offline assets", () => {
  it("keeps the offline reader and application on the same IndexedDB schema", () => {
    const constants = readFileSync(constantsPath, "utf8");
    const offlineScript = readFileSync(offlineScriptPath, "utf8");

    for (const key of ["OFFLINE_DB_NAME", "OFFLINE_DB_VERSION", "RECIPES_STORE", "PHOTOS_STORE"]) {
      const value = constants.match(
        new RegExp(`export const ${key} = (?:'([^']+)'|"([^"]+)"|(\\d+))`),
      );
      expect(value, `${key} is declared in the application`).not.toBeNull();
      const expected = value?.[1] ?? value?.[2] ?? value?.[3];
      expect(offlineScript, `${key} matches in offline.js`).toContain(
        `${key} = ${typeof expected === "string" && /^\d+$/.test(expected) ? expected : `"${expected}"`}`,
      );
    }
  });

  it("replaces the cached reader when the database schema changes", () => {
    const constants = readFileSync(constantsPath, "utf8");
    const worker = readFileSync(workerPath, "utf8");

    const appCache = constants.match(/export const STATIC_CACHE = "([^"]+)"/)?.[1];
    expect(appCache, "STATIC_CACHE is declared in the application").toBeDefined();
    expect(worker).toContain(`const STATIC_CACHE = "${appCache}"`);

    // A reader cached before photos existed opens the database at version 1 and would fail.
    const version = Number(constants.match(/export const OFFLINE_DB_VERSION = (\d+)/)?.[1]);
    expect(version).toBeGreaterThanOrEqual(2);
    expect(appCache).not.toBe("cookbook-static-v1");
  });

  it("does not declare or link an installable web app manifest", () => {
    for (const filename of [
      "manifest.json",
      "manifest.webmanifest",
      "site.webmanifest",
    ]) {
      expect(existsSync(path.join(root, "public", filename))).toBe(false);
    }
    expect(existsSync(path.join(root, "src", "app", "manifest.ts"))).toBe(false);

    const sourceFiles = readdirSync(path.join(root, "src"), {
      recursive: true,
      encoding: "utf8",
    });
    for (const sourceFile of sourceFiles) {
      const fullPath = path.join(root, "src", sourceFile);
      if (!/\.(?:ts|tsx|js|jsx)$/.test(sourceFile)) continue;
      expect(readFileSync(fullPath, "utf8")).not.toContain('rel="manifest"');
    }
  });

  it("caches only static build assets at runtime", () => {
    const worker = readFileSync(workerPath, "utf8");
    expect(worker).toContain("/offline.html");
    expect(worker.match(/cache\.put\(/g)).toHaveLength(1);

    const staticBranchStart = worker.indexOf('if (url.pathname.startsWith("/_next/static/"))');
    expect(staticBranchStart).toBeGreaterThanOrEqual(0);
    const staticBranch = worker.slice(staticBranchStart);
    expect(staticBranch).toContain("cache.put(");
  });

  it("renders recipe data as text rather than HTML", () => {
    const offlineScript = readFileSync(offlineScriptPath, "utf8");
    expect(offlineScript).not.toContain("innerHTML");
    expect(offlineScript.match(/textContent/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
  });
});
