import { expect, test } from "@playwright/test";

import pt from "../../src/i18n/messages/pt.json";
import { adminClient } from "../helpers/supabase-admin";

const { search } = pt.recipes;
const seeded: string[] = [];

async function seed(title: string, ingredients: string[]) {
  const admin = adminClient();
  const { data: cookbook, error: cookbookError } = await admin
    .from("cookbooks")
    .select("id")
    .single();
  if (cookbookError) throw cookbookError;
  const { data, error } = await admin
    .from("recipes")
    .insert({ cookbook_id: cookbook.id, title, ingredients, steps: ["Misturar."] })
    .select("id")
    .single();
  if (error) throw error;
  seeded.push(data.id);
}

test.afterAll(async () => {
  if (seeded.length === 0) return;
  const { error } = await adminClient().from("recipes").delete().in("id", seeded);
  if (error) throw error;
});

test.describe("recipe search", () => {
  test("filters the list by name and ingredient and can be cleared", async ({ page }, testInfo) => {
    const tag = `t${Date.now()}${testInfo.project.name.replace(/\W/g, "")}`.toLowerCase();
    await seed(`Pudim ${tag}`, ["½ chávena de açúcar", "4 ovos"]);
    await seed(`Sopa ${tag}`, ["2 cenouras", "1 cebola"]);

    await page.goto("/pt/recipes");
    const box = page.getByRole("searchbox", { name: search.label });
    const card = (name: string) => page.getByRole("link", { name: `${name} ${tag}`, exact: true });

    await box.fill(tag);
    await expect(card("Pudim")).toBeVisible();
    await expect(card("Sopa")).toBeVisible();
    await expect(page.getByRole("status")).toHaveText(search.found.other.replace("{n}", "2"));

    // Name, ignoring case.
    await box.fill(`PUDIM ${tag}`);
    await expect(card("Pudim")).toBeVisible();
    await expect(card("Sopa")).toHaveCount(0);
    await expect(page.getByRole("status")).toHaveText(search.found.one.replace("{n}", "1"));

    // Ingredient, ignoring accents.
    await box.fill(`${tag} acucar`);
    await expect(card("Pudim")).toBeVisible();
    await expect(card("Sopa")).toHaveCount(0);
    await box.fill(`${tag} cenoura`);
    await expect(card("Sopa")).toBeVisible();
    await expect(card("Pudim")).toHaveCount(0);

    // Nothing matches.
    await box.fill(`${tag} chocolate`);
    await expect(page.getByRole("status")).toHaveText(
      search.none.replace("{query}", `${tag} chocolate`),
    );
    await expect(card("Pudim")).toHaveCount(0);

    await page.getByRole("button", { name: search.clear }).click();
    await expect(box).toHaveValue("");
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(page.getByRole("link", { name: `Pudim ${tag}`, exact: true })).toBeVisible();
  });
});
