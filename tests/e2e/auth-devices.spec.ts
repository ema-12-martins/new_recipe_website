import {
  expect,
  test,
  type Browser,
  type BrowserContext,
  type BrowserContextOptions,
  type Page,
  type TestInfo,
} from "@playwright/test";

import pt from "../../src/i18n/messages/pt.json";
import { createTestUser } from "../helpers/supabase-admin";

const signIn = pt.auth.signIn;
const PASSWORD = "Receitas-Membro-2026";

test.use({ locale: "pt-PT" });

/** The project's device settings. */
function projectDevice(testInfo: TestInfo): BrowserContextOptions {
  const use = testInfo.project.use;
  return {
    viewport: use.viewport,
    userAgent: use.userAgent,
    deviceScaleFactor: use.deviceScaleFactor,
    isMobile: use.isMobile,
    hasTouch: use.hasTouch,
  };
}

const DESKTOP: BrowserContextOptions = { viewport: { width: 1280, height: 800 } };

async function openDevice(
  browser: Browser,
  baseURL: string | undefined,
  options: BrowserContextOptions,
): Promise<{ context: BrowserContext; page: Page }> {
  // Playwright applies the project's `use` (including the owner's storageState) to new contexts.
  const context = await browser.newContext({
    ...options,
    locale: "pt-PT",
    baseURL,
    storageState: { cookies: [], origins: [] },
  });
  return { context, page: await context.newPage() };
}

async function signInThroughUi(page: Page, email: string, password: string) {
  await page.goto("/pt/sign-in");
  await page.getByLabel(signIn.email, { exact: true }).fill(email);
  await page.getByLabel(signIn.password, { exact: true }).fill(password);
  await page.getByRole("button", { name: signIn.submit, exact: true }).click();
}

function uniqueEmail(testInfo: TestInfo, prefix: string): string {
  return `${prefix}-${testInfo.project.name}-${Date.now()}@example.com`;
}

test.describe("signing in on several devices", () => {
  test("a member sees the same cookbook on two devices and signs out on one only", async ({
    browser,
    baseURL,
  }, testInfo) => {
    // Two browser contexts and several navigations; WebKit phones are the slowest.
    test.setTimeout(60_000);
    const email = uniqueEmail(testInfo, "member");
    await createTestUser({ email, password: PASSWORD, role: "member" });

    const deviceA = await openDevice(browser, baseURL, projectDevice(testInfo));
    const deviceB = await openDevice(browser, baseURL, DESKTOP);

    await signInThroughUi(deviceA.page, email, PASSWORD);
    await deviceA.page.waitForURL("**/pt/recipes");
    await signInThroughUi(deviceB.page, email, PASSWORD);
    await deviceB.page.waitForURL("**/pt/recipes");

    const title = `Sopa ${testInfo.project.name} ${Date.now()}`;
    await deviceA.page.goto("/pt/recipes/new");
    await deviceA.page.getByLabel(pt.recipes.form.title, { exact: true }).fill(title);
    await deviceA.page
      .getByLabel(pt.recipes.form.ingredientLine.replace("{n}", "1"), { exact: true })
      .fill("2 cenouras");
    await deviceA.page.getByRole("button", { name: pt.recipes.form.save }).click();
    await deviceA.page.waitForURL(/\/pt\/recipes\/[0-9a-f-]{36}$/);

    await deviceB.page.reload();
    await expect(deviceB.page.getByRole("link", { name: title })).toBeVisible();

    await deviceA.page.getByRole("button", { name: pt.auth.signOut, exact: true }).click();
    await deviceA.page.waitForURL("**/pt/sign-in");
    await deviceA.page.goto("/pt/recipes");
    expect(new URL(deviceA.page.url()).pathname).toBe("/pt/sign-in");

    await deviceB.page.goto("/pt/recipes");
    expect(new URL(deviceB.page.url()).pathname).toBe("/pt/recipes");
    await expect(deviceB.page.getByRole("link", { name: title })).toBeVisible();

    await deviceA.context.close();
    await deviceB.context.close();
  });

  test("wrong credentials show one generic message and stay on sign-in", async ({
    browser,
    baseURL,
  }, testInfo) => {
    const email = uniqueEmail(testInfo, "wrong");
    await createTestUser({ email, password: PASSWORD, role: "member" });
    const { context, page } = await openDevice(browser, baseURL, projectDevice(testInfo));

    await signInThroughUi(page, email, "Not-the-password-1");
    await expect(page.getByRole("alert").filter({ hasText: signIn.errors.invalid })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe("/pt/sign-in");

    await signInThroughUi(page, uniqueEmail(testInfo, "nobody"), PASSWORD);
    await expect(page.getByRole("alert").filter({ hasText: signIn.errors.invalid })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe("/pt/sign-in");

    await context.close();
  });

  test("the sign-in page offers no password reset and explains what to do instead", async ({
    browser,
    baseURL,
  }, testInfo) => {
    const { context, page } = await openDevice(browser, baseURL, projectDevice(testInfo));
    await page.goto("/pt/sign-in");

    await expect(page.getByText(signIn.forgotHelp)).toBeVisible();
    await expect(page.getByRole("link", { name: /forgot|esqueceu|reset|recuperar/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /forgot|esqueceu|reset|recuperar/i })).toHaveCount(
      0,
    );

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
    await context.close();
  });

  test("an absolute next value is ignored after sign-in", async ({ browser, baseURL }, testInfo) => {
    const email = uniqueEmail(testInfo, "next");
    await createTestUser({ email, password: PASSWORD, role: "member" });
    const { context, page } = await openDevice(browser, baseURL, projectDevice(testInfo));

    await page.goto("/pt/sign-in?next=https://evil.example/pt/recipes");
    await page.getByLabel(signIn.email, { exact: true }).fill(email);
    await page.getByLabel(signIn.password, { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: signIn.submit, exact: true }).click();
    await page.waitForURL("**/pt/recipes");
    expect(new URL(page.url()).origin).toBe(new URL(baseURL!).origin);

    await context.close();
  });
});
