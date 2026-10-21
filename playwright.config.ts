import { existsSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

// Specs that must not run in the viewport projects (setup/prod-only).
const viewportIgnore = ["**/owner-setup.spec.ts", "**/prod-smoke.spec.ts"];

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
  },
  projects: [
    {
      name: "setup",
      testMatch: /owner-setup\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "desktop-chromium",
      testIgnore: viewportIgnore,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "tablet-webkit",
      testIgnore: viewportIgnore,
      use: { ...devices["iPad (gen 7)"] },
    },
    {
      name: "phone-chromium",
      testIgnore: viewportIgnore,
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "phone-webkit",
      testIgnore: viewportIgnore,
      use: { ...devices["iPhone 13"] },
    },
  ],
});
