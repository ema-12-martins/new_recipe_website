import { expect, test, type Page } from "@playwright/test";

import pt from "../../src/i18n/messages/pt.json";
import { PHOTO_BUCKET } from "../../src/lib/photos/limits";
import { pngFile } from "../helpers/images";
import { adminClient } from "../helpers/supabase-admin";

// The web server runs with RECOGNITION_PROVIDER=stub (playwright.config.ts), which always reads
// "Bolo de laranja" with three ingredients and three steps.
const { capture, recognition } = pt;
const { form } = pt.recipes;
const fill = (template: string, n: number) => template.replace("{n}", String(n));
const STUB_INGREDIENTS = ["4 ovos", "1/2 chávena de açúcar", "Sumo de 2 laranjas"];

test.use({ locale: "pt-PT" });

const photoItems = (page: Page) =>
  page.getByRole("list", { name: capture.photosList }).getByRole("listitem");

async function addPhotos(page: Page, count: number) {
  const files = Array.from({ length: count }, (_, i) =>
    pngFile(`page-${i + 1}.png`, 500 + i * 40, 700, [60 * (i + 1), 120, 90]),
  );
  await page.getByTestId("photo-input").setInputFiles(files);
  await expect(photoItems(page).filter({ has: page.locator("img") })).toHaveCount(count, {
    timeout: 20_000,
  });
}

async function storedPhotoCount(recipeId: string) {
  const admin = adminClient();
  const { data: cookbook } = await admin.from("cookbooks").select("id").single();
  const { data } = await admin.storage.from(PHOTO_BUCKET).list(`${cookbook!.id}/${recipeId}`);
  return data?.length ?? 0;
}

async function recipeExists(recipeId: string) {
  const { data } = await adminClient().from("recipes").select("id").eq("id", recipeId);
  return (data ?? []).length > 0;
}

const recipeIdOnPage = (page: Page) =>
  page.locator('form input[name="id"]').first().inputValue();

test.describe("read recipe into a draft", () => {
  test("reading fills an unsaved draft; only Save recipe stores it with the photos", async ({
    page,
  }, testInfo) => {
    await page.goto("/pt/recipes/capture");
    await expect(page.getByRole("button", { name: recognition.read })).toHaveCount(0);
    await addPhotos(page, 2);

    await page.getByRole("button", { name: recognition.read }).click();
    await expect(page.getByText(recognition.draftTitle)).toBeVisible();
    await expect(page.getByText(recognition.draftTitle)).toBeFocused();
    await expect(page.getByLabel(form.title, { exact: true })).toHaveValue("Bolo de laranja");
    await expect(page.getByLabel(fill(form.ingredientLine, 2), { exact: true })).toHaveValue(
      "1/2 chávena de açúcar",
    );

    const recipeId = await recipeIdOnPage(page);
    expect(await recipeExists(recipeId)).toBe(false);
    expect(await storedPhotoCount(recipeId)).toBe(0);

    const title = `Bolo lido ${testInfo.project.name} ${Date.now()}`;
    await page.getByLabel(form.title, { exact: true }).fill(title);
    await page.getByRole("button", { name: form.save }).click();

    await page.waitForURL(`**/pt/recipes/${recipeId}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.locator("article ul.recipe-ingredients > li")).toHaveText(STUB_INGREDIENTS);
    await expect(page.getByRole("heading", { name: pt.photos.heading })).toBeVisible();
    expect(await storedPhotoCount(recipeId)).toBe(2);
  });

  test("discard and try again, and enter manually, keep the photos", async ({ page }) => {
    await page.goto("/pt/recipes/capture");
    await addPhotos(page, 2);

    await page.getByRole("button", { name: recognition.read }).click();
    await expect(page.getByText(recognition.draftTitle)).toBeVisible();
    await page.getByRole("button", { name: recognition.discardAndRetry }).click();
    await expect(photoItems(page)).toHaveCount(2);
    await expect(page.getByRole("button", { name: recognition.read })).toBeVisible();

    await page.getByRole("button", { name: recognition.read }).click();
    await expect(page.getByText(recognition.draftTitle)).toBeVisible();
    await page.getByRole("button", { name: recognition.enterManually }).click();
    await expect(page.getByText(recognition.draftTitle)).toHaveCount(0);
    await expect(page.getByLabel(form.title, { exact: true })).toHaveValue("");

    await page.getByRole("button", { name: capture.backToPhotos }).click();
    await expect(photoItems(page)).toHaveCount(2);
  });

  test("a failed read shows Try again and Enter it manually and stores nothing", async ({
    page,
  }) => {
    await page.route("**/api/recipes/read", (route) =>
      route.fulfill({ json: { failure: "low_quality" } }),
    );
    await page.goto("/pt/recipes/capture");
    await addPhotos(page, 1);
    const recipeId = await recipeIdOnPage(page);

    await page.getByRole("button", { name: recognition.read }).click();
    await expect(page.getByRole("alert").filter({ hasText: recognition.failureTitle })).toBeVisible();
    await expect(page.getByText(recognition.failureTitle)).toBeFocused();
    await expect(page.getByRole("button", { name: recognition.tryAgain })).toBeVisible();

    await page.getByRole("button", { name: recognition.enterManually }).click();
    await expect(page.getByLabel(form.title, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: capture.backToPhotos }).click();
    await expect(photoItems(page)).toHaveCount(1);

    expect(await recipeExists(recipeId)).toBe(false);
    expect(await storedPhotoCount(recipeId)).toBe(0);
  });

  test("leaving a draft asks first and then discards it", async ({ page }) => {
    await page.goto("/pt/recipes/capture");
    await addPhotos(page, 1);
    await page.getByRole("button", { name: recognition.read }).click();
    await expect(page.getByText(recognition.draftTitle)).toBeVisible();
    const recipeId = await recipeIdOnPage(page);

    await page.getByRole("link", { name: pt.recipes.backToCookbook }).click();
    await expect(page.getByRole("alertdialog")).toContainText(capture.leave.title);
    await page.getByRole("button", { name: capture.leave.confirm }).click();
    await page.waitForURL("**/pt/recipes");

    expect(await recipeExists(recipeId)).toBe(false);
    expect(await storedPhotoCount(recipeId)).toBe(0);
  });
});
