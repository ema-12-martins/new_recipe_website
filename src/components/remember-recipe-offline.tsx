"use client";

import { useEffect } from "react";

import type { RecipeRecord } from "@/lib/recipes/schema";
import { saveOpenedRecipe } from "@/lib/offline/store";

export function RememberRecipeOffline({
  userId,
  recipe,
}: {
  userId: string;
  recipe: RecipeRecord;
}) {
  useEffect(() => {
    void saveOpenedRecipe(userId, recipe).catch((error: unknown) => {
      console.error("Could not save the opened recipe for offline reading.", error);
    });
  }, [userId, recipe]);

  return null;
}
