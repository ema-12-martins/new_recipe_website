import { createBrowserSupabase } from "@/lib/supabase/browser";

import { PHOTO_BUCKET } from "./limits";
import { photoPath } from "./paths";

export type UploadablePhoto = { id: string; blob: Blob };

function alreadyExists(error: { message: string; statusCode?: string | number }): boolean {
  return String(error.statusCode) === "409" || /already exists/i.test(error.message);
}

/**
 * Uploads the photos to the member's cookbook folder. A file that is already there counts as
 * uploaded, so repeating a half-finished save does not fail on the files that made it.
 */
export async function uploadPhotos(
  cookbookId: string,
  recipeId: string,
  photos: UploadablePhoto[],
): Promise<boolean> {
  const storage = createBrowserSupabase().storage.from(PHOTO_BUCKET);
  for (const photo of photos) {
    const { error } = await storage.upload(photoPath(cookbookId, recipeId, photo.id), photo.blob, {
      contentType: "image/jpeg",
      upsert: false,
    });
    if (error && !alreadyExists(error as { message: string; statusCode?: string })) return false;
  }
  return true;
}
