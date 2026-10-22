import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { RecipeInput } from "./schema";

export type CreateRecipeResult =
  | { ok: true; id: string; created: boolean }
  | { ok: false; reason: "error" };

/**
 * Inserts a recipe with the id issued when its form was rendered. Re-submitting the same
 * form (double click, retried request) hits the primary key: Postgres reports 23505 and
 * the existing recipe is returned instead of a second row.
 */
export async function createRecipe(
  client: SupabaseClient,
  cookbookId: string,
  input: RecipeInput,
): Promise<CreateRecipeResult> {
  const { error } = await client.from("recipes").insert({
    id: input.id,
    cookbook_id: cookbookId,
    title: input.title,
    ingredients: input.ingredients,
    steps: input.steps,
  });

  if (!error) return { ok: true, id: input.id, created: true };
  if (error.code === "23505" && error.message.includes("recipes_pkey")) {
    return { ok: true, id: input.id, created: false };
  }
  return { ok: false, reason: "error" };
}
