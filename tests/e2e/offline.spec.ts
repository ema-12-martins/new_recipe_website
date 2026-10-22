import { expect, test, type Page } from "@playwright/test";

import pt from "../../src/i18n/messages/pt.json";

const form = pt.recipes.form;

test.use({ locale: "pt-PT" });

async function createRecipe(page: Page, title: string) {
  await page.goto("/pt/recipes/new");
  await page.getByLabel(form.title, { exact: true }).fill(title);
  await page.getByLabel("Ingrediente 1", { exact: true }).fill("1 chávena de farinha");
  await page.getByLabel("Passo 1", { exact: true }).fill("Misturar bem.");
  await page.getByRole("button", { name: form.save }).click();
  await page.waitForURL(/\/pt\/recipes\/[0-9a-f-]{36}$/);
}

async function waitForServiceWorker(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
}

async function waitForSavedRecipe(page: Page, id: string) {
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
}

test.describe("offline reading", () => {
  test("the offline notice appears and clears without reloading", async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium" && process.env.OFFLINE_WEBKIT !== "1",
      "service-worker offline emulation is best-effort outside Chromium",
    );

    await page.goto("/pt/recipes");
    await context.setOffline(true);
    await expect(page.getByRole("status")).toContainText("Está sem ligação");

    await context.setOffline(false);
    await expect(page.getByRole("status")).toHaveCount(0);
  });

  test("the new recipe form cannot submit while offline", async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium" && process.env.OFFLINE_WEBKIT !== "1",
      "service-worker offline emulation is best-effort outside Chromium",
    );

    await page.goto("/pt/recipes/new");
    let postRequests = 0;
    page.on("request", (request) => {
      if (request.method() === "POST") postRequests += 1;
    });

    await context.setOffline(true);
    await expect(page.getByRole("status")).toContainText("Está sem ligação");
    await expect(page.getByText("A edição precisa de ligação à internet.")).toBeVisible();
    await expect(page.getByRole("button", { name: form.save })).toBeDisabled();
    expect(postRequests).toBe(0);
  });

  test("the edit form cannot submit while offline", async ({
    page,
    context,
    browserName,
  }, testInfo) => {
    test.skip(
      browserName !== "chromium" && process.env.OFFLINE_WEBKIT !== "1",
      "service-worker offline emulation is best-effort outside Chromium",
    );

    await createRecipe(page, `Offline edit ${testInfo.project.name}-${Date.now()}`);
    const recipeId = new URL(page.url()).pathname.split("/").at(-1);
    if (!recipeId) throw new Error("Expected the recipe URL to include its id.");
    await page.goto(`/pt/recipes/${recipeId}/edit`);
    await context.setOffline(true);

    await expect(page.getByText("A edição precisa de ligação à internet.")).toBeVisible();
    await expect(page.getByRole("button", { name: form.save })).toBeDisabled();
  });

  test("an opened recipe survives reload offline while an unopened recipe is unavailable", async ({
    page,
    browser,
    context,
    baseURL,
    browserName,
  }, testInfo) => {
    test.skip(
      browserName !== "chromium" && process.env.OFFLINE_WEBKIT !== "1",
      "service-worker offline emulation is best-effort outside Chromium",
    );

    const tag = `${testInfo.project.name}-${Date.now()}`;
    await createRecipe(page, `Offline recipe ${tag}`);
    const openedUrl = page.url();

    const otherDevice = await browser.newContext({
      baseURL,
      storageState: "tests/e2e/.auth/owner.json",
      serviceWorkers: "block",
    });
    const otherDevicePage = await otherDevice.newPage();
    await createRecipe(otherDevicePage, `Unopened recipe ${tag}`);
    const unopenedUrl = otherDevicePage.url();
    await otherDevice.close();

    await page.goto(openedUrl);
    await waitForServiceWorker(page);
    const recipeId = new URL(openedUrl).pathname.split("/").at(-1);
    if (!recipeId) throw new Error("Expected the opened recipe URL to include its id.");
    await waitForSavedRecipe(page, recipeId);
    await context.setOffline(true);
    await page.reload();

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Offline recipe ${tag}`);
    await expect(page.getByText("1 chávena de farinha")).toBeVisible();
    await expect(page.getByText("Misturar bem.")).toBeVisible();
    await expect(page.getByRole("status")).toContainText("Está sem ligação");

    const listPage = await context.newPage();
    await listPage.goto("/pt/recipes");
    await expect(
      listPage.getByRole("link", { name: `Offline recipe ${tag}`, exact: true }),
    ).toBeVisible();
    await expect(listPage.getByText(`Unopened recipe ${tag}`, { exact: true })).toHaveCount(0);
    await listPage.close();

    const unopenedPage = await context.newPage();
    await unopenedPage.goto(unopenedUrl);
    await expect(unopenedPage.getByText("Esta receita não está disponível offline.")).toBeVisible();
    await expect(unopenedPage.getByText(`Unopened recipe ${tag}`, { exact: true })).toHaveCount(0);

    await unopenedPage.close();
    const onlineReload = page.waitForNavigation({ waitUntil: "domcontentloaded" });
    await context.setOffline(false);
    await onlineReload;
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Offline recipe ${tag}`);
  });
});
