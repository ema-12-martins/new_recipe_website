"use client";

import { useEffect } from "react";

import type { RecipeRecord } from "@/lib/recipes/schema";
import { saveOpenedRecipe, saveOpenedRecipePhotos } from "@/lib/offline/store";
import { photoUrl } from "@/lib/photos/paths";

export function RememberRecipeOffline({
  userId,
  recipe,
  photoIds,
}: {
  userId: string;
  recipe: RecipeRecord;
  /** Ordered ids of the recipe's photos. */
  photoIds: string[];
}) {
  const photoKey = photoIds.join(",");

  useEffect(() => {
    const ids = photoKey === "" ? [] : photoKey.split(",");

    void (async () => {
      await saveOpenedRecipe(userId, recipe, ids);

      // Photos are cached only for a recipe that was opened, and replaced as a whole so that
      // photos removed since then disappear. A failed download keeps what is already stored.
      const blobs = await Promise.all(
        ids.map(async (id, index) => {
          const response = await fetch(photoUrl(recipe.id, id), { credentials: "same-origin" });
          if (!response.ok) throw new Error("A photo could not be downloaded.");
          return { id, position: index + 1, blob: await response.blob() };
        }),
      );
      await saveOpenedRecipePhotos(userId, recipe.id, blobs);
    })().catch((error: unknown) => {
      console.error("Could not save the opened recipe for offline reading.", error);
    });
  }, [userId, recipe, photoKey]);

  return null;
}
