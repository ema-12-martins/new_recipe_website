import { expect, test, type Browser, type BrowserContextOptions, type Page, type TestInfo } from "@playwright/test";

import pt from "../../src/i18n/messages/pt.json";
import { pngFile } from "../helpers/images";
import { createTestUser } from "../helpers/supabase-admin";

const { capture, photos } = pt;
const { form } = pt.recipes;
const password = "Receitas-Familia-2026";

test.use({ locale: "pt-PT" });

test.beforeEach(({ browserName }) => {
  test.skip(browserName !== "chromium", "service-worker offline emulation is verified on Chromium");
});

function device(testInfo: TestInfo): BrowserContextOptions {
  const use = testInfo.project.use;
  return {
    viewport: use.viewport,
    userAgent: use.userAgent,
    deviceScaleFactor: use.deviceScaleFactor,
    isMobile: use.isMobile,
    hasTouch: use.hasTouch,
  };
}

async function openMember(browser: Browser, baseURL: string | undefined, testInfo: TestInfo) {
  const email = `photos-${testInfo.project.name}-${Date.now()}@example.com`;
  await createTestUser({ email, password, role: "member" });
  const context = await browser.newContext({
    ...device(testInfo),
    baseURL,
    locale: "pt-PT",
    storageState: { cookies: [], origins: [] },
  });
  const page = await context.newPage();
  await page.goto("/pt/sign-in");
  await page.getByLabel(pt.auth.signIn.email, { exact: true }).fill(email);
  await page.getByLabel(pt.auth.signIn.password, { exact: true }).fill(password);
  await page.getByRole("button", { name: pt.auth.signIn.submit, exact: true }).click();
  await page.waitForURL("**/pt/recipes");
  return { context, page };
}

async function createWithPhotos(page: Page, title: string, count: number): Promise<string> {
  await page.goto("/pt/recipes/capture");
  await page.getByTestId("photo-input").setInputFiles(
    Array.from({ length: count }, (_, i) => pngFile(`p${i}.png`, 420 + i * 30, 600, [60 * (i + 1), 80, 150])),
  );
  await expect(
    page.getByRole("list", { name: capture.photosList }).getByRole("listitem"),
  ).toHaveCount(count, { timeout: 20_000 });
  await page.getByRole("button", { name: capture.skip }).click();
  await page.getByLabel(form.title, { exact: true }).fill(title);
  await page.getByRole("button", { name: form.save, exact: true }).click();
  await page.waitForURL(/\/pt\/recipes\/[0-9a-f-]{36}$/);
  return page.url();
}

async function waitForServiceWorker(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
}

/** Photos kept on this device (read without a version so a newer schema still opens). */
async function storedPhotos(page: Page): Promise<{ id: string; recipeId: string }[]> {
  return page.evaluate(
    () =>
      new Promise<{ id: string; recipeId: string }[]>((resolve, reject) => {
        const request = indexedDB.open("cookbook-offline");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains("photos")) {
            db.close();
            resolve([]);
            return;
          }
          const all = db.transaction("photos", "readonly").objectStore("photos").getAll();
          all.onsuccess = () => {
            db.close();
            resolve(all.result.map((p: { id: string; recipeId: string }) => ({ id: p.id, recipeId: p.recipeId })));
          };
          all.onerror = () => {
            db.close();
            reject(all.error);
          };
        };
      }),
  );
}

test.describe("offline photos", () => {
  test("photos of an opened recipe are shown offline; a recipe never opened has none", async ({
    browser,
    baseURL,
  }, testInfo) => {
    const member = await openMember(browser, baseURL, testInfo);
    const { page, context } = member;

    const openedUrl = await createWithPhotos(page, `Com fotografias ${Date.now()}`, 2);
    const openedId = new URL(openedUrl).pathname.split("/").at(-1)!;

    // A second recipe written on a device with no service worker is never opened on this one.
    const other = await browser.newContext({
      ...device(testInfo),
      baseURL,
      locale: "pt-PT",
      storageState: { cookies: [], origins: [] },
      serviceWorkers: "block",
    });
    const otherPage = await other.newPage();
    await otherPage.goto("/pt/sign-in");
    const email = `photos-second-${testInfo.project.name}-${Date.now()}@example.com`;
    await createTestUser({ email, password, role: "member" });
    await otherPage.getByLabel(pt.auth.signIn.email, { exact: true }).fill(email);
    await otherPage.getByLabel(pt.auth.signIn.password, { exact: true }).fill(password);
    await otherPage.getByRole("button", { name: pt.auth.signIn.submit, exact: true }).click();
    await otherPage.waitForURL("**/pt/recipes");
    const unopenedUrl = await createWithPhotos(otherPage, `Nunca aberta ${Date.now()}`, 1);
    const unopenedId = new URL(unopenedUrl).pathname.split("/").at(-1)!;
    await other.close();

    await page.goto(openedUrl);
    await waitForServiceWorker(page);
    await expect.poll(async () => (await storedPhotos(page)).length).toBe(2);

    const stored = await storedPhotos(page);
    expect(stored.every((photo) => photo.recipeId === openedId)).toBe(true);
    expect(stored.some((photo) => photo.recipeId === unopenedId)).toBe(false);

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole("status")).toContainText("Está sem ligação");
    await expect(page.getByRole("heading", { name: photos.heading })).toBeVisible();

    const images = page.locator("img[data-photo-id]");
    await expect(images).toHaveCount(2);
    for (let i = 0; i < 2; i++) {
      await expect
        .poll(() => images.nth(i).evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth))
        .toBeGreaterThan(0);
    }

    const listPage = await context.newPage();
    await listPage.goto("/pt/recipes");
    await expect(listPage.getByText("Nunca aberta", { exact: false })).toHaveCount(0);
    await context.close();
  });

  test("signing out leaves no photos on the device", async ({ browser, baseURL }, testInfo) => {
    const { page, context } = await openMember(browser, baseURL, testInfo);
    const url = await createWithPhotos(page, `Para limpar ${Date.now()}`, 2);

    await page.goto(url);
    await waitForServiceWorker(page);
    await expect.poll(async () => (await storedPhotos(page)).length).toBe(2);

    await page.getByRole("button", { name: pt.auth.signOut, exact: true }).click();
    await page.waitForURL("**/pt/sign-in");
    expect(await storedPhotos(page)).toEqual([]);

    await context.setOffline(true);
    await page.goto(url);
    await expect(page.locator("img[data-photo-id]")).toHaveCount(0);
    await context.close();
  });
});
