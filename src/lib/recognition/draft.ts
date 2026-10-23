import { normalizeLines, RECIPE_LIMITS } from "@/lib/recipes/schema";

import type { DraftRecipe } from "./types";

const codePoints = (value: string) => Array.from(value).length;

/**
 * Drops blank lines and checks the recipe limits without changing any wording, so the draft
 * can always be saved as shown. Returns null when it would break a limit.
 */
export function sanitiseDraft(draft: DraftRecipe): DraftRecipe | null {
  const title = draft.title.trim() === "" ? "" : draft.title;
  const ingredients = normalizeLines(draft.ingredients);
  const steps = normalizeLines(draft.steps);

  if (codePoints(title) > RECIPE_LIMITS.titleMax) return null;
  if (ingredients.length > RECIPE_LIMITS.ingredientsMax) return null;
  if (steps.length > RECIPE_LIMITS.stepsMax) return null;
  if (ingredients.some((line) => codePoints(line) > RECIPE_LIMITS.ingredientMax)) return null;
  if (steps.some((step) => codePoints(step) > RECIPE_LIMITS.stepMax)) return null;

  return { title, ingredients, steps };
}
