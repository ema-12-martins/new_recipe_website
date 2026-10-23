// Usage: node scripts/remove-incomplete-recipes.mjs [--apply]
// Lists recipes with no ingredients or no steps in the project configured by .env.local
// (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY). Without --apply nothing is changed.
// With --apply each recipe's photo files are removed from Storage first, then the recipe row
// (its photo rows and creator row cascade). Never prints keys.
import { existsSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

const PHOTO_BUCKET = "recipe-photos";
const PAGE = 1000;

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set (.env.local).");
  process.exit(2);
}
const apply = process.argv.includes("--apply");

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function allRecipes() {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from("recipes")
      .select("id, cookbook_id, title, ingredients, steps")
      .order("created_at")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE) return rows;
  }
}

/** Every file under the recipe's folder, including uploads that never got a photo row. */
async function photoPaths(recipe) {
  const folder = `${recipe.cookbook_id}/${recipe.id}`;
  const { data, error } = await admin.storage.from(PHOTO_BUCKET).list(folder, { limit: 100 });
  if (error) throw error;
  return data.filter((item) => item.id !== null).map((item) => `${folder}/${item.name}`);
}

const blank = (lines) => lines.every((line) => line.trim() === "");

console.log(`Project: ${new URL(url).hostname}`);
console.log(apply ? "Mode: APPLY (deleting)" : "Mode: dry run (nothing is changed)");

const incomplete = (await allRecipes()).filter(
  (recipe) => blank(recipe.ingredients) || blank(recipe.steps),
);

if (incomplete.length === 0) {
  console.log("No recipes without ingredients or steps.");
  process.exit(0);
}

for (const recipe of incomplete) {
  const paths = await photoPaths(recipe);
  const missing = [
    blank(recipe.ingredients) ? "ingredients" : null,
    blank(recipe.steps) ? "steps" : null,
  ].filter(Boolean);
  console.log(
    `- ${JSON.stringify(recipe.title)} (${recipe.id}) missing ${missing.join(" + ")}; ${paths.length} photo file(s)`,
  );
  if (!apply) continue;

  if (paths.length > 0) {
    const { error } = await admin.storage.from(PHOTO_BUCKET).remove(paths);
    if (error) throw error;
  }
  const { error } = await admin.from("recipes").delete().eq("id", recipe.id);
  if (error) throw error;
}

console.log(
  apply
    ? `Deleted ${incomplete.length} recipe(s).`
    : `${incomplete.length} recipe(s) would be deleted. Re-run with --apply to delete them.`,
);
