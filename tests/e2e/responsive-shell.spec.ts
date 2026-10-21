import { expect, test } from "@playwright/test";

import pt from "../../src/i18n/messages/pt.json";

test.describe("signed-in cookbook page", () => {
  test("shows the cookbook and does not scroll horizontally", async ({ page }) => {
    await page.goto("/pt/recipes");
    expect(new URL(page.url()).pathname).toBe("/pt/recipes");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Family cookbook");
    await expect(page.getByText(pt.recipes.empty)).toBeVisible();

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });
});
