import "server-only";

import { createClient } from "@/lib/supabase/server";

import { parseRecipeRow, type RecipeRecord } from "./schema";

export type RecipeListItem = { id: string; title: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Every recipe the signed-in member can read (RLS), alphabetically by title. */
export async function listRecipes(locale: string): Promise<RecipeListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("recipes").select("id, title").order("title");
  if (error) throw error;

  // The database collation may sort by byte order; family members expect dictionary order.
  const collator = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
  return [...data].sort((a, b) => collator.compare(a.title, b.title));
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
