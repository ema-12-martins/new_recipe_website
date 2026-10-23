import { expect, test, type Page } from "@playwright/test";

import pt from "../../src/i18n/messages/pt.json";
import { PHOTO_BUCKET } from "../../src/lib/photos/limits";
import { adminClient } from "../helpers/supabase-admin";
import { pngFile } from "../helpers/images";

const { capture, photos } = pt;
const { form } = pt.recipes;
const fill = (template: string, n: number) => template.replace("{n}", String(n));

test.use({ locale: "pt-PT" });

const photoList = (page: Page) => page.getByRole("list", { name: capture.photosList });

async function addPhotos(page: Page, count: number) {
  const files = Array.from({ length: count }, (_, i) =>
    pngFile(`page-${i + 1}.png`, 400 + i * 40, 600, [40 * (i + 1), 90, 160]),
  );
  await page.getByTestId("photo-input").setInputFiles(files);
  await expect(
    photoList(page).getByRole("listitem").filter({ has: page.locator("img") }),
  ).toHaveCount(Math.min(count, 6), { timeout: 20_000 });
}

async function photoIdsInOrder(page: Page): Promise<string[]> {
  return photoList(page)
    .getByRole("listitem")
    .evaluateAll((items) => items.map((item) => item.getAttribute("data-photo-id") ?? ""));
}

async function typeRecipe(page: Page, title: string) {
  await page.getByLabel(form.title, { exact: true }).fill(title);
  await page.getByLabel(fill(form.ingredientLine, 1), { exact: true }).fill("2 ovos");
  await page.getByLabel(fill(form.stepLabel, 1), { exact: true }).fill("Misturar tudo.");
}

test.describe("photo capture", () => {
  test("choose, reorder and remove photos, type the recipe, save, and see the originals", async ({
    page,
  }) => {
    await page.goto("/pt/recipes/capture");
    await expect(page.getByRole("heading", { name: capture.emptyHeading })).toBeVisible();

    await addPhotos(page, 3);
    const chosen = await photoIdsInOrder(page);
    expect(chosen).toHaveLength(3);

    await page.getByRole("button", { name: fill(capture.moveDown, 1) }).click();
    await page.getByRole("button", { name: fill(capture.removePage, 3) }).click();
    const finalOrder = await photoIdsInOrder(page);
    expect(finalOrder).toEqual([chosen[1], chosen[0]]);

    await page.getByRole("button", { name: capture.skip }).click();
    const title = `Bolo de fotografias ${Date.now()}`;
    await typeRecipe(page, title);
    await page.getByRole("button", { name: form.save }).click();

    await expect(page).toHaveURL(/\/pt\/recipes\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByRole("heading", { name: photos.heading })).toBeVisible();

    const images = page.locator("img[data-photo-id]");
    await expect(images).toHaveCount(2);
    expect(await images.evaluateAll((all) => all.map((img) => img.getAttribute("data-photo-id")))).toEqual(
      finalOrder,
    );
    for (let i = 0; i < 2; i++) {
      await expect
        .poll(() => images.nth(i).evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth))
        .toBeGreaterThan(0);
    }

    await images.first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: photos.next }).click();
    await page.getByRole("button", { name: photos.close }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("a recipe typed without photos shows no original photos section", async ({ page }) => {
    await page.goto("/pt/recipes/new");
    await page.getByLabel(form.title, { exact: true }).fill(`Sem fotografias ${Date.now()}`);
    await page.getByRole("button", { name: form.save }).click();
    await expect(page).toHaveURL(/\/pt\/recipes\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { name: photos.heading })).toHaveCount(0);
  });

  test("a seventh photo shows the limit message and keeps the six chosen photos", async ({
    page,
  }) => {
    await page.goto("/pt/recipes/capture");
    await addPhotos(page, 7);
    await expect(page.getByRole("alert").filter({ hasText: capture.tooMany })).toBeVisible();
    await expect(photoList(page).getByRole("listitem")).toHaveCount(6);
  });

  test("leaving with chosen photos asks first, keeps them on 'continue', and stores nothing on discard", async ({
    page,
  }) => {
    const folderCount = async () => {
      const { data: cookbook } = await adminClient().from("cookbooks").select("id").single();
      const { data } = await adminClient().storage.from(PHOTO_BUCKET).list(cookbook!.id);
      return data?.length ?? 0;
    };
    const before = await folderCount();

    await page.goto("/pt/recipes/capture");
    await addPhotos(page, 2);

    const toCookbook = page.getByRole("link", { name: pt.recipes.backToCookbook });
    await toCookbook.click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog.getByText(capture.leave.title)).toBeVisible();
    await dialog.getByRole("button", { name: capture.leave.stay }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/pt\/recipes\/capture$/);
    await expect(photoList(page).getByRole("listitem")).toHaveCount(2);

    await toCookbook.click();
    await page.getByRole("alertdialog").getByRole("button", { name: capture.leave.confirm }).click();
    await expect(page).toHaveURL(/\/pt\/recipes$/);

    expect(await folderCount()).toBe(before);
  });

  test("a page with nothing chosen or typed can be left without a warning", async ({ page }) => {
    await page.goto("/pt/recipes/capture");
    await page.getByRole("link", { name: pt.recipes.backToCookbook }).click();
    await expect(page).toHaveURL(/\/pt\/recipes$/);
  });

  test("an unsupported file shows its message and keeps the photos already chosen", async ({
    page,
  }) => {
    await page.goto("/pt/recipes/capture");
    await addPhotos(page, 1);

    await page.getByTestId("photo-input").setInputFiles({
      name: "notas.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not an image"),
    });
    await expect(page.getByRole("alert").filter({ hasText: capture.unsupported })).toBeVisible();
    await expect(photoList(page).getByRole("listitem")).toHaveCount(1);
  });
});
