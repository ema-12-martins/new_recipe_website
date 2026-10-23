import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { MAX_PHOTOS, PHOTO_BUCKET } from "./limits";
import { photoPath } from "./paths";

export type PhotoChangeResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "photos_missing" | "error" };

type ApplyPhotoChanges = {
  /** The member's own client: every row change runs under RLS. */
  client: SupabaseClient;
  /** Service-role client, used only to check and delete files (members cannot read the bucket). */
  admin: SupabaseClient;
  cookbookId: string;
  recipeId: string;
  /** The final photo list in page order: existing ids to keep plus newly uploaded ids. */
  order: string[];
};

/**
 * Deletes files uploaded for a save that did not go through. Only files with no photo row are
 * removed, so a photo the recipe already has is never touched. Members cannot delete through
 * the bucket after the read policy was dropped, so this runs on the server.
 */
export async function discardUnrecordedUploads({
  client,
  admin,
  cookbookId,
  recipeId,
  ids,
}: Omit<ApplyPhotoChanges, "order"> & { ids: string[] }): Promise<void> {
  if (ids.length === 0) return;
  const { data } = await client
    .from("recipe_photos")
    .select("id")
    .eq("recipe_id", recipeId)
    .in("id", ids);
  const recorded = new Set((data ?? []).map((row) => row.id as string));
  const orphans = ids.filter((id) => !recorded.has(id));
  if (orphans.length === 0) return;
  await admin.storage
    .from(PHOTO_BUCKET)
    .remove(orphans.map((id) => photoPath(cookbookId, recipeId, id)));
}

/**
 * Makes a recipe's photos match `order`: photos not listed are removed, new ones are recorded and
 * everything is renumbered. Repeating the same request ends in the same state.
 */
export async function applyPhotoChanges({
  client,
  admin,
  cookbookId,
  recipeId,
  order,
}: ApplyPhotoChanges): Promise<PhotoChangeResult> {
  if (order.length > MAX_PHOTOS || new Set(order).size !== order.length) {
    return { ok: false, reason: "invalid" };
  }

  const { data: rows, error: readError } = await client
    .from("recipe_photos")
    .select("id, position")
    .eq("recipe_id", recipeId);
  if (readError) return { ok: false, reason: "error" };

  const existing = new Map(rows.map((row) => [row.id as string, row.position as number]));
  const wanted = new Set(order);
  const removed = [...existing.keys()].filter((id) => !wanted.has(id));
  const added = order.filter((id) => !existing.has(id));

  if (added.length > 0) {
    const { data: files, error: listError } = await admin.storage
      .from(PHOTO_BUCKET)
      .list(`${cookbookId}/${recipeId}`, { limit: 100 });
    if (listError) return { ok: false, reason: "error" };
    const present = new Set((files ?? []).map((file) => file.name));
    if (added.some((id) => !present.has(`${id}.jpg`))) {
      return { ok: false, reason: "photos_missing" };
    }
  }

  if (removed.length > 0) {
    const { error } = await client.from("recipe_photos").delete().in("id", removed);
    if (error) return { ok: false, reason: "error" };
  }

  if (added.length > 0) {
    // Positions are unique per recipe, so new rows take free slots and are renumbered below.
    const used = new Set([...existing].filter(([id]) => !removed.includes(id)).map(([, p]) => p));
    const free = Array.from({ length: MAX_PHOTOS }, (_, i) => i + 1).filter((p) => !used.has(p));
    const { error } = await client.from("recipe_photos").insert(
      added.map((id, index) => ({
        id,
        recipe_id: recipeId,
        cookbook_id: cookbookId,
        position: free[index],
        object_path: photoPath(cookbookId, recipeId, id),
      })),
    );
    if (error) return { ok: false, reason: "error" };
  }

  if (order.length > 0) {
    const { error } = await client.rpc("set_recipe_photo_order", {
      p_recipe_id: recipeId,
      p_photo_ids: order,
    });
    if (error) return { ok: false, reason: "error" };
  }

  if (removed.length > 0) {
    // The rows are gone, so a file that fails to delete here is unreachable, not exposed.
    await admin.storage
      .from(PHOTO_BUCKET)
      .remove(removed.map((id) => photoPath(cookbookId, recipeId, id)));
  }

  return { ok: true };
}
