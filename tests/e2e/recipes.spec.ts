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
    await page.getByRole("button", { name: form.save }).dblclick();

    await page.waitForURL(/\/pt\/recipes\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    // Give a possible second submission time to land before counting.
    await page.waitForTimeout(1500);
    expect(await countRecipesTitled(title)).toBe(1);
  });
});
