import { z } from "zod";

// Limits mirror the CHECK constraints in supabase/migrations/20261021120100_recipes.sql.
export const RECIPE_LIMITS = {
  titleMax: 300,
  ingredientMax: 500,
  ingredientsMax: 200,
  stepMax: 4000,
  stepsMax: 100,
} as const;

// Postgres char_length counts code points; String.length counts UTF-16 units.
const codePoints = (value: string) => Array.from(value).length;

/**
 * Drops lines that are entirely blank and returns every other line unchanged — no
 * trimming, Unicode normalization, or case change (D-11).
 */
export function normalizeLines(lines: string[]): string[] {
  return lines.filter((line) => line.trim() !== "");
}

// A saved recipe needs at least one non-blank line; the database enforces the same minimum
// (supabase/migrations/20261023130000_recipe_required_lines.sql).
const lines = (maxLength: number, maxCount: number) =>
  z
    .array(z.string())
    .transform(normalizeLines)
    .pipe(
      z
        .array(z.string().refine((line) => codePoints(line) <= maxLength))
        .min(1)
        .max(maxCount),
    );

export const recipeInputSchema = z.object({
  id: z.uuid(),
  // Stored exactly as typed; only the trimmed form must be non-empty.
  title: z
    .string()
    .refine((title) => title.trim() !== "" && codePoints(title) <= RECIPE_LIMITS.titleMax),
  ingredients: lines(RECIPE_LIMITS.ingredientMax, RECIPE_LIMITS.ingredientsMax),
  steps: lines(RECIPE_LIMITS.stepMax, RECIPE_LIMITS.stepsMax),
  version: z.number().int().positive().optional(),
});

export type RecipeInput = z.infer<typeof recipeInputSchema>;

export type RecipeRecord = {
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  version: number;
  updatedAt: string;
};

const recipeRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  ingredients: z.array(z.string()),
  steps: z.array(z.string()),
  version: z.number().int(),
  updated_at: z.string(),
});

export function parseRecipeRow(row: unknown): RecipeRecord {
  const parsed = recipeRowSchema.parse(row);
  return {
    id: parsed.id,
    title: parsed.title,
    ingredients: parsed.ingredients,
    steps: parsed.steps,
    version: parsed.version,
    updatedAt: parsed.updated_at,
  };
}

export type RecipeFormValues = { title: string; ingredients: string[]; steps: string[] };

/** Reads the recipe form: repeated ingredients[] and steps[] fields arrive in DOM order. */
export function readRecipeForm(formData: FormData): RecipeFormValues & {
  id: string;
  version?: number;
} {
  const strings = (name: string) =>
    formData.getAll(name).filter((value): value is string => typeof value === "string");
  const rawVersion = formData.get("version");
  return {
    id: String(formData.get("id") ?? ""),
    title: String(formData.get("title") ?? ""),
    ingredients: strings("ingredients[]"),
    steps: strings("steps[]"),
    version:
      typeof rawVersion === "string" && rawVersion !== "" ? Number(rawVersion) : undefined,
  };
}
