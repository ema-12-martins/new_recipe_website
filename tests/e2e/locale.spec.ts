import { expect, test, type Browser, type BrowserContextOptions } from "@playwright/test";

import { LOCALE_NAMES } from "../../src/i18n/config";
import en from "../../src/i18n/messages/en.json";
import pt from "../../src/i18n/messages/pt.json";

const messages = { pt, en } as const;

function keyPaths(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return [prefix];
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return [prefix];
  return entries.flatMap(([key, child]) => keyPaths(child, prefix ? `${prefix}.${key}` : key)).sort();
}

async function openRoot(
  browser: Browser,
  baseURL: string | undefined,
  options: BrowserContextOptions,
  path = "/",
) {
  const context = await browser.newContext({ ...options, baseURL });
  const page = await context.newPage();
  await page.goto(path);
  return { context, page };
}

test.describe("locale routing", () => {
  for (const { browserLocale, expected } of [
    { browserLocale: "pt-PT", expected: "pt" },
    { browserLocale: "en-US", expected: "en" },
    { browserLocale: "de-DE", expected: "pt" },
  ] as const) {
    test(`${browserLocale} browser lands on /${expected}`, async ({ browser, baseURL }) => {
      const { context, page } = await openRoot(browser, baseURL, { locale: browserLocale });
      expect(new URL(page.url()).pathname).toMatch(new RegExp(`^/${expected}(/|$)`));
      await expect(page.locator("html")).toHaveAttribute("lang", expected);
      await context.close();
    });
  }

  test("weighted Accept-Language picks the highest supported tag", async ({ browser, baseURL }) => {
    const { context, page } = await openRoot(browser, baseURL, {
      extraHTTPHeaders: { "Accept-Language": "fr;q=1, en;q=0.5" },
    });
    expect(new URL(page.url()).pathname).toMatch(/^\/en(\/|$)/);
    await context.close();
  });

  test("a valid NEXT_LOCALE cookie wins over the browser language", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ locale: "pt-PT", baseURL });
    await context.addCookies([{ name: "NEXT_LOCALE", value: "en", url: baseURL! }]);
    const page = await context.newPage();
    await page.goto("/");
    expect(new URL(page.url()).pathname).toMatch(/^\/en(\/|$)/);
    await context.close();
  });

  test("an unknown first segment is redirected under the detected locale", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({ locale: "pt-PT", baseURL });
    const page = await context.newPage();
    const response = await page.request.get("/xx-unknown/path", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(new URL(response.headers()["location"], baseURL).pathname).toBe("/pt/xx-unknown/path");
    await context.close();
  });
});

test.describe("home page", () => {
  for (const locale of ["pt", "en"] as const) {
    test(`/${locale} shows the appName from ${locale}.json and does not scroll horizontally`, async ({
      page,
    }) => {
      await page.goto(`/${locale}`);
      const heading = page.getByRole("heading", { level: 1 });
      await expect(heading).toHaveText(messages[locale].common.appName);
      await expect(heading).not.toHaveText(LOCALE_NAMES[locale]);
      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflows).toBe(false);
    });
  }

  test("pt and en message files have identical namespaces and keys", () => {
    expect(Object.keys(pt).sort()).toEqual(["auth", "common", "members", "offline", "recipes"]);
    expect(keyPaths(en)).toEqual(keyPaths(pt));
    expect(pt.common.appName).not.toBe(en.common.appName);
  });
});
