import { existsSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;
// Written by the setup project (owner-setup.spec.ts); viewport projects start signed in as the owner.
const ownerStorageState = "tests/e2e/.auth/owner.json";

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
    // A page that always answers 200 (the root now redirects onward).
    url: `${baseURL}/pt/setup`,
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
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
        storageState: ownerStorageState,
      },
    },
    {
      name: "tablet-webkit",
      testIgnore: viewportIgnore,
      dependencies: ["setup"],
      use: { ...devices["iPad (gen 7)"], storageState: ownerStorageState },
    },
    {
      name: "phone-chromium",
      testIgnore: viewportIgnore,
      dependencies: ["setup"],
      use: { ...devices["Pixel 7"], storageState: ownerStorageState },
    },
    {
      name: "phone-webkit",
      testIgnore: viewportIgnore,
      dependencies: ["setup"],
      use: { ...devices["iPhone 13"], storageState: ownerStorageState },
    },
  ],
});
