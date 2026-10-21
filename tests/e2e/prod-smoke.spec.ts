import { expect, test } from "@playwright/test";

import pt from "../../src/i18n/messages/pt.json";

// READ-ONLY: only GET navigations; never submits a form or writes data.
test.use({ extraHTTPHeaders: { "Accept-Language": "pt-PT,pt;q=0.9" } });

test.describe("deployed site smoke", () => {
  test("is served from a vercel.app address", async ({ baseURL }) => {
    expect(new URL(baseURL!).hostname.endsWith(".vercel.app")).toBe(true);
  });

  test("the root sends a Portuguese visitor under /pt/", async ({ page }) => {
    await page.goto("/");
    expect(new URL(page.url()).pathname).toMatch(/^\/pt\//);
    expect(new URL(page.url()).hostname.endsWith(".vercel.app")).toBe(true);
  });

  test("/pt/setup renders the form or the already-set-up message", async ({ page }) => {
    const response = await page.goto("/pt/setup");
    expect(response?.status()).toBe(200);
    expect(response?.headers()["referrer-policy"]).toBe("no-referrer");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(pt.common.appName);

    const form = page.getByLabel(pt.auth.setup.code);
    const alreadySetUp = page.getByText(pt.auth.setup.alreadySetUp);
    await expect(form.or(alreadySetUp)).toBeVisible();
  });
});
