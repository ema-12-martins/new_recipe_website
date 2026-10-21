import { expect, test } from "@playwright/test";

import pt from "../../src/i18n/messages/pt.json";
import { listAllUsers, requireEnv, resetDatabase } from "../helpers/supabase-admin";

const OWNER_STORAGE_STATE = "tests/e2e/.auth/owner.json";

const setup = pt.auth.setup;
const ownerEmail = `owner-${Date.now()}@example.com`;
const ownerPassword = "Receitas-2026";

test.use({ locale: "pt-PT" });
test.describe.configure({ mode: "serial" });

test.describe("owner setup", () => {
  test.beforeAll(async () => {
    await resetDatabase();
  });

  test("a wrong setup code shows an error and creates no account", async ({ page }) => {
    await page.goto("/pt/setup");
    await page.getByLabel(setup.code).fill("not-the-setup-code");
    await page.getByLabel(setup.email).fill(ownerEmail);
    await page.getByLabel(setup.password).fill(ownerPassword);
    await page.getByRole("button", { name: setup.submit }).click();

    await expect(page.getByRole("alert").filter({ hasText: setup.errors.invalid_code })).toBeVisible();
    await expect(page.getByLabel(setup.email)).toHaveValue(ownerEmail);
    expect(await listAllUsers()).toHaveLength(0);
  });

  test("the first person with the code becomes the owner and lands on the cookbook", async ({
    page,
  }) => {
    await page.goto("/pt/setup");
    await page.getByLabel(setup.code).fill(requireEnv("OWNER_SETUP_CODE"));
    await page.getByLabel(setup.email).fill(ownerEmail);
    await page.getByLabel(setup.password).fill(ownerPassword);
    await page.getByRole("button", { name: setup.submit }).click();

    await page.waitForURL("**/pt/recipes");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Family cookbook");
    await expect(page.getByText(pt.recipes.empty)).toBeVisible();

    await page.context().storageState({ path: OWNER_STORAGE_STATE });
  });

  test("setup cannot be repeated once the cookbook exists", async ({ page }) => {
    await page.goto("/pt/setup");
    await expect(page.getByText(setup.alreadySetUp)).toBeVisible();
    await expect(page.getByRole("link", { name: setup.signInLink })).toHaveAttribute(
      "href",
      "/pt/sign-in",
    );
    await expect(page.getByLabel(setup.code)).toHaveCount(0);
  });

  test("visitors without a membership are sent to sign-in", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();
    await page.goto("/pt/recipes");
    expect(new URL(page.url()).pathname).toBe("/pt/sign-in");
    await context.close();
  });
});
