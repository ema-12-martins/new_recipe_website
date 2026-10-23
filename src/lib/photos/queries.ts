import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { PhotoRow } from "./schema";

/** A recipe's photos in page order, read under RLS (members of the cookbook only). */
export async function listRecipePhotos(recipeId: string): Promise<PhotoRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipe_photos")
    .select("id, position")
    .eq("recipe_id", recipeId)
    .order("position");
  if (error) throw error;
  return data;
}
