import {
  expect,
  test,
  type Browser,
  type BrowserContextOptions,
  type Page,
  type TestInfo,
} from "@playwright/test";

import pt from "../../src/i18n/messages/pt.json";
import { adminClient, createTestUser } from "../helpers/supabase-admin";

const signIn = pt.auth.signIn;
const form = pt.recipes.form;
const password = "Receitas-Familia-2026";

test.use({ locale: "pt-PT" });

function unique(testInfo: TestInfo, prefix: string) {
  return `${prefix}-${testInfo.project.name}-${Date.now()}`;
}

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

async function openMember(
  browser: Browser,
  baseURL: string | undefined,
  testInfo: TestInfo,
  email: string,
) {
  const context = await browser.newContext({
    ...projectDevice(testInfo),
    baseURL,
    locale: "pt-PT",
    storageState: { cookies: [], origins: [] },
  });
  const page = await context.newPage();
  await signInMember(page, email);
  return { context, page };
}

async function signInMember(page: Page, email: string) {
  await page.goto("/pt/sign-in");
  await page.getByLabel(signIn.email, { exact: true }).fill(email);
  await page.getByLabel(signIn.password, { exact: true }).fill(password);
  await page.getByRole("button", { name: signIn.submit, exact: true }).click();
  await page.waitForURL("**/pt/recipes");
}

async function createAndCacheRecipe(page: Page, title: string) {
  await page.goto("/pt/recipes/new");
  await page.getByLabel(form.title, { exact: true }).fill(title);
  await page.getByLabel("Ingrediente 1", { exact: true }).fill("1 chávena de farinha");
  await page.getByLabel("Passo 1", { exact: true }).fill("Misturar bem.");
  await page.getByRole("button", { name: form.save, exact: true }).click();
  await page.waitForURL(/\/pt\/recipes\/[0-9a-f-]{36}$/);

  const url = page.url();
  const id = new URL(url).pathname.split("/").at(-1);
  if (!id) throw new Error("Expected the recipe URL to include its id.");

  await page.goto(url);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.waitForFunction(
    async (recipeId) =>
      new Promise<boolean>((resolve) => {
        const request = indexedDB.open("cookbook-offline", 1);
        request.onerror = () => resolve(false);
        request.onsuccess = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains("recipes")) {
            db.close();
            resolve(false);
            return;
          }
          const transaction = db.transaction("recipes", "readonly");
          const getRequest = transaction.objectStore("recipes").get(recipeId);
          getRequest.onsuccess = () => {
            db.close();
            resolve(Boolean(getRequest.result));
          };
          getRequest.onerror = () => {
            db.close();
            resolve(false);
          };
        };
      }),
    id,
  );
  return { id, title, url };
}

async function expectRecipePurged(page: Page, recipeId: string) {
  await page.waitForFunction(
    async (id) =>
      new Promise<boolean>((resolve) => {
        const request = indexedDB.open("cookbook-offline", 1);
        request.onerror = () => resolve(false);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains("recipes")) {
            db.createObjectStore("recipes", { keyPath: "id" });
          }
          if (!db.objectStoreNames.contains("meta")) {
            db.createObjectStore("meta", { keyPath: "key" });
          }
        };
        request.onsuccess = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains("recipes")) {
            db.close();
            resolve(true);
            return;
          }
          const transaction = db.transaction("recipes", "readonly");
          const getRequest = transaction.objectStore("recipes").get(id);
          getRequest.onsuccess = () => {
            db.close();
            resolve(!getRequest.result);
          };
          getRequest.onerror = () => {
            db.close();
            resolve(false);
          };
        };
      }),
    recipeId,
  );
}

async function createMember(testInfo: TestInfo, prefix = "offline-member") {
  const email = `${unique(testInfo, prefix)}@example.com`;
  const user = await createTestUser({ email, password, role: "member" });
  return { email, user };
}

async function prepareRecipe(
  browser: Browser,
  baseURL: string | undefined,
  testInfo: TestInfo,
  title: string,
) {
  const { email, user } = await createMember(testInfo);
  const member = await openMember(browser, baseURL, testInfo, email);
  const recipe = await createAndCacheRecipe(member.page, title);
  return { ...member, email, user, recipe };
}

test.describe("offline privacy and reauthorization", () => {
  test.beforeEach(({ browserName }) => {
    test.skip(browserName !== "chromium", "offline privacy reauthorization is verified on Chromium");
  });

  test("signing out clears a previously opened recipe before it can be read offline", async ({
    browser,
    baseURL,
  }, testInfo) => {
    const { email } = await createMember(testInfo);
    const member = await openMember(browser, baseURL, testInfo, email);
    const title = unique(testInfo, "Sign-out recipe");
    const recipe = await createAndCacheRecipe(member.page, title);

    await member.page.getByRole("button", { name: pt.auth.signOut, exact: true }).click();
    await member.page.waitForURL("**/pt/sign-in");
    await member.context.setOffline(true);
    await member.page.goto(recipe.url);

    await expect(member.page.getByText("Esta receita não está disponível offline.")).toBeVisible();
    await expect(member.page.getByText(title, { exact: true })).toHaveCount(0);
    await member.context.close();
  });

  test("the sign-in page clears cached recipes after membership is removed", async ({
    browser,
    baseURL,
  }, testInfo) => {
    const member = await prepareRecipe(
      browser,
      baseURL,
      testInfo,
      unique(testInfo, "Removed-member recipe"),
    );
    const { error } = await adminClient().auth.admin.deleteUser(member.user.id);
    if (error) throw error;

    await member.page.goto("/pt/sign-in");
    await expect(member.page.getByRole("heading", { level: 1, name: signIn.heading })).toBeVisible();
    await expectRecipePurged(member.page, member.recipe.id);
    await member.context.setOffline(true);
    await member.page.goto(member.recipe.url);

    await expect(member.page.getByText("Esta receita não está disponível offline.")).toBeVisible();
    await expect(member.page.getByText(member.recipe.title, { exact: true })).toHaveCount(0);
    await member.context.close();
  });

  test("a second member sees no recipes cached for the first member", async ({
    browser,
    baseURL,
  }, testInfo) => {
    const first = await createMember(testInfo, "offline-first");
    const second = await createMember(testInfo, "offline-second");
    const member = await openMember(browser, baseURL, testInfo, first.email);
    const title = unique(testInfo, "Account-switch recipe");
    await createAndCacheRecipe(member.page, title);

    await member.page.getByRole("button", { name: pt.auth.signOut, exact: true }).click();
    await member.page.waitForURL("**/pt/sign-in");
    await signInMember(member.page, second.email);
    await member.context.setOffline(true);
    await member.page.goto("/pt/recipes");

    await expect(member.page.getByText("Ainda não há receitas guardadas neste dispositivo.")).toBeVisible();
    await expect(member.page.getByText(title, { exact: true })).toHaveCount(0);
    await member.context.close();
  });

  test("revoked access on reconnect clears cached recipes and returns to sign-in", async ({
    browser,
    baseURL,
  }, testInfo) => {
    const member = await prepareRecipe(
      browser,
      baseURL,
      testInfo,
      unique(testInfo, "Revoked recipe"),
    );
    await member.context.setOffline(true);
    await expect(member.page.getByRole("status")).toContainText("Está sem ligação");
    const { error } = await adminClient().auth.admin.deleteUser(member.user.id);
    if (error) throw error;

    const signInNavigation = member.page.waitForURL(/\/pt\/sign-in\?reason=no-access$/);
    await member.context.setOffline(false);
    await signInNavigation;
    await expect(member.page.getByText(signIn.errors.noAccess)).toBeVisible();
    await expectRecipePurged(member.page, member.recipe.id);
    await member.context.close();
  });

  test("a valid member stays on the recipe and refreshes after reconnect", async ({
    browser,
    baseURL,
  }, testInfo) => {
    const member = await prepareRecipe(
      browser,
      baseURL,
      testInfo,
      unique(testInfo, "Reconnected recipe"),
    );
    let checks = 0;
    await member.page.route("**/api/session", async (route) => {
      checks += 1;
      await route.continue();
    });

    await member.context.setOffline(true);
    await expect(member.page.getByRole("status")).toContainText("Está sem ligação");
    await member.context.setOffline(false);
    await expect.poll(() => checks).toBeGreaterThan(0);
    await expect(member.page).toHaveURL(member.recipe.url);
    await expect(member.page.getByRole("heading", { level: 1 })).toHaveText(member.recipe.title);
    await member.context.close();
  });

  for (const mode of ["503", "network failure"] as const) {
    test(`a ${mode} during reconnect keeps cached data and shows a retry notice`, async ({
      browser,
      baseURL,
    }, testInfo) => {
      const member = await prepareRecipe(
        browser,
        baseURL,
        testInfo,
        unique(testInfo, `Unavailable ${mode} recipe`),
      );
      const originalUrl = member.page.url();
      await member.page.route("**/api/session", async (route) => {
        if (mode === "503") {
          await route.fulfill({
            status: 503,
            contentType: "application/json",
            body: JSON.stringify({ ok: false, reason: "unavailable" }),
          });
          return;
        }
        await route.abort();
      });

      await member.context.setOffline(true);
      await member.context.setOffline(false);
      await expect(member.page.getByText(pt.common.unavailable.body)).toBeVisible();
      await expect(
        member.page.getByRole("button", { name: pt.common.unavailable.retry }),
      ).toBeVisible();
      await expect(member.page).toHaveURL(originalUrl);
      await expect(member.page.getByRole("heading", { level: 1 })).toHaveText(member.recipe.title);
      expect(
        await member.page.evaluate(async (id) => {
          const db = await new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open("cookbook-offline", 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
          });
          try {
            return await new Promise<boolean>((resolve, reject) => {
              const request = db.transaction("recipes", "readonly").objectStore("recipes").get(id);
              request.onerror = () => reject(request.error);
              request.onsuccess = () => resolve(Boolean(request.result));
            });
          } finally {
            db.close();
          }
        }, member.recipe.id),
      ).toBe(true);
      await member.context.close();
    });
  }

  test("the session endpoint is private and distinguishes anonymous from member requests", async ({
    browser,
    baseURL,
  }, testInfo) => {
    const anonymousContext = await browser.newContext({
      ...projectDevice(testInfo),
      baseURL,
      storageState: { cookies: [], origins: [] },
    });
    const anonymousPage = await anonymousContext.newPage();
    const anonymousResponse = await anonymousPage.request.get("/api/session");
    expect(anonymousResponse.status()).toBe(401);
    expect(anonymousResponse.headers()["cache-control"]).toContain("no-store");
    await anonymousContext.close();

    const { email, user } = await createMember(testInfo, "session-member");
    const member = await openMember(browser, baseURL, testInfo, email);
    const response = await member.page.request.get("/api/session");
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(await response.json()).toEqual({ ok: true, userId: user.id });
    await member.context.close();
  });
});
