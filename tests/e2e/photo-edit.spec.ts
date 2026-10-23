import { expect, test, type Browser, type Page } from "@playwright/test";

import pt from "../../src/i18n/messages/pt.json";
import { adminClient } from "../helpers/supabase-admin";
import { pngFile } from "../helpers/images";
import { PHOTO_BUCKET } from "../../src/lib/photos/limits";

const { capture, photos } = pt;
const { form, errors } = pt.recipes;
const fill = (template: string, n: number) => template.replace("{n}", String(n));

test.use({ locale: "pt-PT" });

const photoList = (page: Page) => page.getByRole("list", { name: capture.photosList });
const thumbs = (page: Page) => photoList(page).getByRole("listitem");

async function addPhotos(page: Page, count: number, offset = 0) {
  const before = await thumbs(page).count();
  const files = Array.from({ length: count }, (_, i) =>
    pngFile(`page-${offset + i + 1}.png`, 400 + (offset + i) * 40, 600, [40 * (offset + i + 1), 90, 160]),
  );
  await page.getByTestId("photo-input").setInputFiles(files);
  await expect(thumbs(page)).toHaveCount(before + count, { timeout: 20_000 });
}

async function order(page: Page): Promise<string[]> {
  return thumbs(page).evaluateAll((items) => items.map((item) => item.getAttribute("data-photo-id") ?? ""));
}

async function savedOrder(page: Page): Promise<string[]> {
  return page
    .locator("img[data-photo-id]")
    .evaluateAll((all) => all.map((img) => img.getAttribute("data-photo-id") ?? ""));
}

/** A recipe created through the capture screen with `count` photos; ends on its page. */
async function createWithPhotos(page: Page, count: number): Promise<string> {
  await page.goto("/pt/recipes/capture");
  await addPhotos(page, count);
  await page.getByRole("button", { name: capture.skip }).click();
  await page.getByLabel(form.title, { exact: true }).fill(`Com fotografias ${Date.now()}`);
  await page.getByRole("button", { name: form.save }).click();
  await expect(page).toHaveURL(/\/pt\/recipes\/[0-9a-f-]{36}$/);
  return page.url();
}

async function openEdit(page: Page) {
  await page.getByRole("link", { name: pt.recipes.edit }).click();
  await expect(page).toHaveURL(/\/edit$/);
  await expect(page.getByLabel(form.title, { exact: true })).toBeVisible();
}

async function save(page: Page) {
  await page.getByRole("button", { name: form.save }).click();
}

test.describe("editing a recipe's photos", () => {
  test("adds a photo, moves it first and keeps the new order", async ({ page }) => {
    await createWithPhotos(page, 2);
    const original = await savedOrder(page);
    await openEdit(page);
    await expect(thumbs(page)).toHaveCount(2);

    await addPhotos(page, 1, 2);
    await page.getByRole("button", { name: fill(capture.moveUp, 3) }).click();
    await page.getByRole("button", { name: fill(capture.moveUp, 2) }).click();
    const wanted = await order(page);
    expect(wanted).toHaveLength(3);
    expect(wanted.slice(1)).toEqual(original);

    await save(page);
    await expect(page).toHaveURL(/\/pt\/recipes\/[0-9a-f-]{36}$/);
    await expect(page.locator("img[data-photo-id]")).toHaveCount(3);
    expect(await savedOrder(page)).toEqual(wanted);
  });

  test("removing a saved photo asks first; keeping it leaves the recipe unchanged", async ({
    page,
  }) => {
    await createWithPhotos(page, 2);
    const original = await savedOrder(page);
    await openEdit(page);

    await page.getByRole("button", { name: fill(capture.removePage, 2) }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog.getByText(fill(photos.remove.title, 2))).toBeVisible();
    await dialog.getByRole("button", { name: photos.remove.keep }).click();
    await expect(dialog).toBeHidden();
    await expect(thumbs(page)).toHaveCount(2);

    await page.getByRole("button", { name: fill(capture.removePage, 2) }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: photos.remove.confirm }).click();
    await expect(thumbs(page)).toHaveCount(1);

    await save(page);
    await expect(page).toHaveURL(/\/pt\/recipes\/[0-9a-f-]{36}$/);
    await expect(page.locator("img[data-photo-id]")).toHaveCount(1);
    expect(await savedOrder(page)).toEqual([original[0]]);
  });

  test("adds photos to a recipe that was typed without any", async ({ page }) => {
    await page.goto("/pt/recipes/new");
    await page.getByLabel(form.title, { exact: true }).fill(`Escrita à mão ${Date.now()}`);
    await save(page);
    await expect(page).toHaveURL(/\/pt\/recipes\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { name: photos.heading })).toHaveCount(0);

    await openEdit(page);
    await expect(page.getByRole("heading", { name: photos.editEmptyHeading })).toBeVisible();
    await addPhotos(page, 2);
    await save(page);

    await expect(page).toHaveURL(/\/pt\/recipes\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { name: photos.heading })).toBeVisible();
    await expect(page.locator("img[data-photo-id]")).toHaveCount(2);
  });

  test("a save that lost to someone else's edit shows the conflict and applies no photo change", async ({
    page,
    browser,
  }) => {
    const recipeUrl = await createWithPhotos(page, 2);
    await openEdit(page);
    await addPhotos(page, 1, 2);

    await saveElsewhere(browser, recipeUrl);
    await save(page);

    await expect(page.getByRole("alert").filter({ hasText: errors.conflict })).toBeVisible();
    await expect(thumbs(page)).toHaveCount(3);

    const recipeId = recipeUrl.split("/").pop()!;
    const { count } = await adminClient()
      .from("recipe_photos")
      .select("id", { count: "exact", head: true })
      .eq("recipe_id", recipeId);
    expect(count).toBe(2);

    // The file uploaded for the lost save is removed again.
    const { data: cookbook } = await adminClient().from("cookbooks").select("id").single();
    await expect
      .poll(async () => {
        const { data } = await adminClient()
          .storage.from(PHOTO_BUCKET)
          .list(`${cookbook!.id}/${recipeId}`);
        return data?.length ?? 0;
      })
      .toBe(2);
  });
});

/** Another browser saves a text change to the same recipe first. */
async function saveElsewhere(browser: Browser, recipeUrl: string) {
  const other = await browser.newContext({
    locale: "pt-PT",
    storageState: "tests/e2e/.auth/owner.json",
  });
  const page = await other.newPage();
  await page.goto(`${recipeUrl}/edit`);
  await page.getByLabel(form.title, { exact: true }).fill(`Alterada por outra pessoa ${Date.now()}`);
  await save(page);
  await expect(page).toHaveURL(/\/pt\/recipes\/[0-9a-f-]{36}$/);
  await other.close();
}
