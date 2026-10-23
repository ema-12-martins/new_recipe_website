import "server-only";

import { createClient } from "@/lib/supabase/server";

import { parseRecipeRow, type RecipeRecord } from "./schema";

export type RecipeListItem = {
  id: string;
  title: string;
  /** Used only to search; the card shows a count. */
  ingredients: string[];
  ingredientCount: number;
  stepCount: number;
  photoCount: number;
};

type RecipeListRow = {
  id: string;
  title: string;
  ingredients: string[] | null;
  steps: string[] | null;
  recipe_photos: { count: number }[] | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Every recipe the signed-in member can read (RLS), alphabetically by title, with card counts. */
export async function listRecipes(locale: string): Promise<RecipeListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("id, title, ingredients, steps, recipe_photos(count)")
    .order("title");
  if (error) throw error;

  const items = (data as RecipeListRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    ingredients: row.ingredients ?? [],
    ingredientCount: row.ingredients?.length ?? 0,
    stepCount: row.steps?.length ?? 0,
    photoCount: row.recipe_photos?.[0]?.count ?? 0,
  }));

  // The database collation may sort by byte order; family members expect dictionary order.
  const collator = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
  return items.sort((a, b) => collator.compare(a.title, b.title));
}

/** One recipe under RLS, or null when it does not exist or is not visible. */
export async function getRecipe(id: string): Promise<RecipeRecord | null> {
  if (!UUID.test(id)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("id, title, ingredients, steps, version, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? parseRecipeRow(data) : null;
}
