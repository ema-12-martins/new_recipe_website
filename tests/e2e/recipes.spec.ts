import { expect, test, type Page } from "@playwright/test";

import pt from "../../src/i18n/messages/pt.json";
import { adminClient } from "../helpers/supabase-admin";

const form = pt.recipes.form;
const fill = (template: string, n: number) => template.replace("{n}", String(n));

test.use({ locale: "pt-PT" });

async function ownerEmail(): Promise<string> {
  const { data, error } = await adminClient()
    .from("memberships")
    .select("email")
    .eq("role", "owner")
    .single();
  if (error) throw error;
  return data.email;
}

async function countRecipesTitled(title: string): Promise<number> {
  const { count, error } = await adminClient()
    .from("recipes")
    .select("*", { count: "exact", head: true })
    .eq("title", title);
  if (error) throw error;
  return count ?? 0;
}

type SeedRecipe = { title: string; ingredients?: string[]; steps?: string[] };

async function seedRecipe(recipe: SeedRecipe): Promise<string> {
  const admin = adminClient();
  const { data: cookbook, error: cookbookError } = await admin
    .from("cookbooks")
    .select("id")
    .single();
  if (cookbookError) throw cookbookError;
  const { data, error } = await admin
    .from("recipes")
    .insert({
      cookbook_id: cookbook.id,
      title: recipe.title,
      ingredients: recipe.ingredients ?? ["1 ovo"],
      steps: recipe.steps ?? ["Bater."],
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function storedRecipe(id: string) {
  const { data, error } = await adminClient()
    .from("recipes")
    .select("title, ingredients, steps")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

async function fillLines(page: Page, label: string, addButton: string, lines: string[]) {
  for (const [index, text] of lines.entries()) {
    if (index > 0) await page.getByRole("button", { name: addButton, exact: true }).click();
    await page.getByLabel(fill(label, index + 1), { exact: true }).fill(text);
  }
}

test.describe("manual recipes", () => {
  test("a member creates a recipe and sees it exactly as typed", async ({ page }, testInfo) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    const title = `Bolo de Laranja da Avó ${testInfo.project.name}`;
    const ingredients = ["½ chávena de açúcar", "1 1/2 cups flour", "3 ovos"];
    const steps = ["Pré-aquecer o forno a 180 °C.", "Misturar tudo."];

    await page.goto("/pt/recipes/new");
    await page.getByLabel(form.title, { exact: true }).fill(title);
    await fillLines(page, form.ingredientLine, form.addIngredient, ingredients);
    await fillLines(page, form.stepLabel, form.addStep, steps);
    await page.getByRole("button", { name: form.save }).click();

    await page.waitForURL(/\/pt\/recipes\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.locator("article ul > li")).toHaveText(ingredients);
    await expect(page.locator("article ol > li")).toHaveText(steps);

    const text = await page.locator("body").innerText();
    expect(text).not.toContain(await ownerEmail());
    expect(text.toLowerCase()).not.toContain("added by");
    expect(text.toLowerCase()).not.toContain("adicionado por");

    expect(consoleErrors.filter((message) => /hydrat/i.test(message))).toEqual([]);

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });

  test("double-clicking save creates exactly one recipe", async ({ page }, testInfo) => {
    const title = `Duplo clique ${testInfo.project.name} ${Date.now()}`;

    await page.goto("/pt/recipes/new");
    await page.getByLabel(form.title, { exact: true }).fill(title);
    await page.getByLabel(fill(form.ingredientLine, 1), { exact: true }).fill("1 limão");
    await page.getByLabel(fill(form.stepLabel, 1), { exact: true }).fill("Espremer.");
    await page.getByRole("button", { name: form.save }).dblclick();

    await page.waitForURL(/\/pt\/recipes\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    // Give a possible second submission time to land before counting.
    await page.waitForTimeout(1500);
    expect(await countRecipesTitled(title)).toBe(1);
  });

  test("a recipe without ingredients or steps is not saved", async ({ page }, testInfo) => {
    const title = `Incompleta ${testInfo.project.name} ${Date.now()}`;
    const { errors } = pt.recipes;

    await page.goto("/pt/recipes/new");
    await page.getByLabel(form.title, { exact: true }).fill(title);
    await page.getByLabel(fill(form.ingredientLine, 1), { exact: true }).fill("   ");
    await page.getByRole("button", { name: form.save }).click();

    // The warning sits next to the save button and names what is missing.
    const warning = page.getByRole("alert").filter({ hasText: errors.incomplete });
    await expect(warning).toBeVisible();
    await expect(warning.getByRole("listitem")).toHaveText([
      errors.ingredientsRequired,
      errors.stepsRequired,
    ]);
    expect(new URL(page.url()).pathname).toBe("/pt/recipes/new");
    await expect(page.getByLabel(form.title, { exact: true })).toHaveValue(title);
    expect(await countRecipesTitled(title)).toBe(0);
  });

  test("the cookbook lists recipes alphabetically with a New recipe button", async ({
    page,
  }, testInfo) => {
    const tag = `${testInfo.project.name}-${Date.now()}`;
    // Inserted out of order; dictionary order ignores case and accents.
    for (const title of [`Zeta ${tag}`, `arroz ${tag}`, `Ábacaxi ${tag}`]) {
      await seedRecipe({ title });
    }

    await page.goto("/pt/recipes");
    await expect(page.getByRole("link", { name: pt.recipes.newRecipe })).toHaveAttribute(
      "href",
      "/pt/recipes/new",
    );
    const titles = page.getByRole("listitem").getByRole("link").filter({ hasText: tag });
    await expect(titles).toHaveText([`Ábacaxi ${tag}`, `arroz ${tag}`, `Zeta ${tag}`]);

    await titles.first().click();
    await page.waitForURL(/\/pt\/recipes\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Ábacaxi ${tag}`);
  });

  test("a member edits text, lines and step order of a saved recipe", async ({
    page,
  }, testInfo) => {
    const id = await seedRecipe({
      title: `Sopa ${testInfo.project.name}`,
      ingredients: ["2 cenouras", "1 cebola", "sal q.b."],
      steps: ["Descascar.", "Cozer 20 minutos.", "Lavar os legumes."],
    });

    await page.goto(`/pt/recipes/${id}`);
    await expect(page.getByRole("button", { name: /eliminar|apagar|delete/i })).toHaveCount(0);
    await page.getByRole("link", { name: pt.recipes.edit }).click();
    await page.waitForURL(`**/pt/recipes/${id}/edit`);
    await expect(page.getByRole("button", { name: /eliminar|apagar|delete/i })).toHaveCount(0);

    const newTitle = `Sopa de legumes ${testInfo.project.name}`;
    await page.getByLabel(form.title, { exact: true }).fill(newTitle);
    await page.getByRole("button", { name: fill(form.removeIngredient, 2), exact: true }).click();
    await page.getByRole("button", { name: form.addIngredient, exact: true }).click();
    await page.getByLabel(fill(form.ingredientLine, 3), { exact: true }).fill("1 fio de azeite");
    await page.getByLabel(fill(form.stepLabel, 2), { exact: true }).fill("Cozer 25 minutos.");
    await page.getByRole("button", { name: fill(form.moveStepUp, 3), exact: true }).click();
    await page.getByRole("button", { name: fill(form.moveStepUp, 2), exact: true }).click();
    await page.getByRole("button", { name: form.save }).click();

    await page.waitForURL(`**/pt/recipes/${id}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(newTitle);
    await expect(page.locator("article ul > li")).toHaveText([
      "2 cenouras",
      "sal q.b.",
      "1 fio de azeite",
    ]);
    await expect(page.locator("article ol > li")).toHaveText([
      "Lavar os legumes.",
      "Descascar.",
      "Cozer 25 minutos.",
    ]);
  });

  test("a stale save shows a conflict and keeps the member's edits", async ({
    page,
    context,
  }, testInfo) => {
    const id = await seedRecipe({
      title: `Pudim ${testInfo.project.name}`,
      ingredients: ["4 ovos"],
      steps: ["Bater os ovos."],
    });
    const pageB = await context.newPage();
    await page.goto(`/pt/recipes/${id}/edit`);
    await pageB.goto(`/pt/recipes/${id}/edit`);

    const titleA = `Pudim A ${testInfo.project.name}`;
    await page.getByLabel(form.title, { exact: true }).fill(titleA);
    await page.getByRole("button", { name: form.save }).click();
    await page.waitForURL(`**/pt/recipes/${id}`);

    const titleB = `Pudim B ${testInfo.project.name}`;
    await pageB.getByLabel(form.title, { exact: true }).fill(titleB);
    await pageB.getByLabel(fill(form.ingredientLine, 1), { exact: true }).fill("5 ovos");
    await pageB.getByRole("button", { name: form.save }).click();

    await expect(
      pageB.getByRole("alert").filter({ hasText: pt.recipes.errors.conflict }),
    ).toBeVisible();
    await expect(pageB.getByRole("link", { name: pt.recipes.errors.reloadLatest })).toHaveAttribute(
      "href",
      `/pt/recipes/${id}/edit`,
    );
    expect(new URL(pageB.url()).pathname).toBe(`/pt/recipes/${id}/edit`);
    await expect(pageB.getByLabel(form.title, { exact: true })).toHaveValue(titleB);
    await expect(pageB.getByLabel(fill(form.ingredientLine, 1), { exact: true })).toHaveValue(
      "5 ovos",
    );

    expect(await storedRecipe(id)).toEqual({
      title: titleA,
      ingredients: ["4 ovos"],
      steps: ["Bater os ovos."],
    });
    await pageB.close();
  });
});
