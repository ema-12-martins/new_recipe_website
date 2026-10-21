import { existsSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const baseURL = process.env.PRODUCTION_URL;
if (!baseURL) {
  throw new Error("PRODUCTION_URL is not set (expected in .env.local)");
}

// Read-only smoke test against the deployed site; no local web server.
export default defineConfig({
  testDir: "tests/e2e",
  testMatch: /prod-smoke\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL, trace: "retain-on-failure" },
  projects: [
    { name: "prod-desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "prod-phone-chromium", use: { ...devices["Pixel 7"] } },
  ],
});
