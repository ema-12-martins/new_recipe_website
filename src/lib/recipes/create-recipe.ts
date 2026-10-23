import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { PHOTO_BUCKET } from "@/lib/photos/limits";
import { photoPath } from "@/lib/photos/paths";

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

export type CreateWithPhotosResult =
  | CreateRecipeResult
  | { ok: false; reason: "photos_missing" };

/**
 * Saves a recipe together with its already-uploaded photos. Order matters for retries: the
 * uploaded files are checked first (nothing is written if one is missing), the recipe insert is
 * idempotent, and only photo rows that do not exist yet are inserted, so repeating the same
 * request converges to one recipe with one row per photo.
 */
export async function createRecipeWithPhotos(
  client: SupabaseClient,
  cookbookId: string,
  input: RecipeInput,
  photoIds: string[],
  /** Reads the bucket listing; members cannot list it, so callers pass a service-role client. */
  storageClient: SupabaseClient = client,
): Promise<CreateWithPhotosResult> {
  if (photoIds.length > 0) {
    const { data: files, error: listError } = await storageClient.storage
      .from(PHOTO_BUCKET)
      .list(`${cookbookId}/${input.id}`, { limit: 100 });
    if (listError) return { ok: false, reason: "error" };
    const present = new Set((files ?? []).map((file) => file.name));
    if (photoIds.some((id) => !present.has(`${id}.jpg`))) {
      return { ok: false, reason: "photos_missing" };
    }
  }

  const created = await createRecipe(client, cookbookId, input);
  if (!created.ok || photoIds.length === 0) return created;

  const { data: existing, error: existingError } = await client
    .from("recipe_photos")
    .select("id")
    .eq("recipe_id", input.id);
  if (existingError) return { ok: false, reason: "error" };

  const have = new Set(existing.map((row) => row.id as string));
  const rows = photoIds
    .map((id, index) => ({
      id,
      recipe_id: input.id,
      cookbook_id: cookbookId,
      position: index + 1,
      object_path: photoPath(cookbookId, input.id, id),
    }))
    .filter((row) => !have.has(row.id));

  if (rows.length > 0) {
    const { error: insertError } = await client.from("recipe_photos").insert(rows);
    if (insertError) return { ok: false, reason: "error" };
  }
  return created;
}
