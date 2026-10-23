import type { RecipeFormValues } from "./schema";

export type RecipePart = "title" | "ingredients" | "steps";

const hasText = (text: string) => text.trim() !== "";

/**
 * The parts a recipe still needs before it can be saved: a title, at least one ingredient and at
 * least one step, each with visible text. Kept free of zod so the form can run it in the browser.
 */
export function missingParts({ title, ingredients, steps }: RecipeFormValues): RecipePart[] {
  const missing: RecipePart[] = [];
  if (!hasText(title)) missing.push("title");
  if (!ingredients.some(hasText)) missing.push("ingredients");
  if (!steps.some(hasText)) missing.push("steps");
  return missing;
}
