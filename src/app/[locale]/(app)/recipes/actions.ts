"use server";

import { redirect } from "next/navigation";

import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentMembership } from "@/lib/auth/membership";
import { createRecipe } from "@/lib/recipes/create-recipe";
import { readRecipeForm, recipeInputSchema, type RecipeFormValues } from "@/lib/recipes/schema";
import { createClient } from "@/lib/supabase/server";

export type RecipeFormErrors = {
  title?: string;
  ingredients?: string;
  steps?: string;
  form?: string;
};

export type RecipeFormState = {
  status?: "invalid" | "error" | "conflict";
  errors?: RecipeFormErrors;
  values?: RecipeFormValues;
};

function localeOf(formData: FormData): Locale {
  const raw = formData.get("locale");
  return isLocale(raw) ? raw : defaultLocale;
}

/** Validates the submitted form; on failure returns localized field errors and the typed values. */
function validate(formData: FormData, locale: Locale) {
  const raw = readRecipeForm(formData);
  const values: RecipeFormValues = {
    title: raw.title,
    ingredients: raw.ingredients,
    steps: raw.steps,
  };
  const parsed = recipeInputSchema.safeParse(raw);
  if (parsed.success) return { ok: true as const, input: parsed.data, values };

  const { errors: messages } = getDictionary(locale).recipes;
  const errors: RecipeFormErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if (field === "title" || field === "ingredients" || field === "steps") {
      errors[field] = messages[field];
    } else {
      errors.form = messages.error;
    }
  }
  return { ok: false as const, state: { status: "invalid" as const, errors, values } };
}

export async function createRecipeAction(
  _prevState: RecipeFormState,
  formData: FormData,
): Promise<RecipeFormState> {
  const locale = localeOf(formData);
  const membership = await getCurrentMembership();
  if (!membership) redirect(`/${locale}/sign-in`);

  const result = validate(formData, locale);
  if (!result.ok) return result.state;

  const created = await createRecipe(await createClient(), membership.cookbookId, result.input);
  if (!created.ok) {
    return {
      status: "error",
      errors: { form: getDictionary(locale).recipes.errors.error },
      values: result.values,
    };
  }

  redirect(`/${locale}/recipes/${created.id}`);
}
