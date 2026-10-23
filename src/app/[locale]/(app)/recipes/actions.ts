"use server";

import { notFound, redirect } from "next/navigation";

import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentMembership } from "@/lib/auth/membership";
import { createRecipeWithPhotos } from "@/lib/recipes/create-recipe";
import { applyPhotoChanges, discardUnrecordedUploads } from "@/lib/photos/apply-changes";
import { photoIdsSchema } from "@/lib/photos/schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRecipe } from "@/lib/recipes/queries";
import { missingParts, type RecipePart } from "@/lib/recipes/missing";
import { readRecipeForm, recipeInputSchema, type RecipeFormValues } from "@/lib/recipes/schema";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type RecipeFormErrors = {
  title?: string;
  ingredients?: string;
  steps?: string;
  form?: string;
};

export type RecipeFormState = {
  status?: "invalid" | "error" | "conflict";
  errors?: RecipeFormErrors;
  /** Parts the recipe still needs; the form lists them next to the save button. */
  missing?: RecipePart[];
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
  const missing = missingParts(values);
  const errors: RecipeFormErrors = {};
  for (const part of missing) errors[part] = messages[`${part}Required`];
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if (field === "title" || field === "ingredients" || field === "steps") {
      errors[field] ??= messages[field];
    } else {
      errors.form = messages.error;
    }
  }
  return { ok: false as const, state: { status: "invalid" as const, errors, missing, values } };
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

  const photoIds = photoIdsSchema.safeParse(
    formData.getAll("photoIds").filter((value): value is string => typeof value === "string"),
  );
  if (!photoIds.success) {
    return {
      status: "error",
      errors: { form: getDictionary(locale).recipes.errors.error },
      values: result.values,
    };
  }

  const created = await createRecipeWithPhotos(
    await createClient(),
    membership.cookbookId,
    result.input,
    photoIds.data,
    createAdminClient(),
  );
  if (!created.ok) {
    const { errors } = getDictionary(locale).recipes;
    return {
      status: "error",
      errors: { form: created.reason === "photos_missing" ? errors.photosMissing : errors.error },
      values: result.values,
    };
  }

  redirect(`/${locale}/recipes/${created.id}`);
}

/**
 * Saves an edit only if the recipe is still at the version the form was loaded with. Title,
 * ingredients and steps change in one row update, so a save is applied whole or not at all.
 */
export async function updateRecipeAction(
  _prevState: RecipeFormState,
  formData: FormData,
): Promise<RecipeFormState> {
  const locale = localeOf(formData);
  const membership = await getCurrentMembership();
  if (!membership) redirect(`/${locale}/sign-in`);

  const result = validate(formData, locale);
  if (!result.ok) return result.state;

  const { id, title, ingredients, steps, version } = result.input;
  const failed: RecipeFormState = {
    status: "error",
    errors: { form: getDictionary(locale).recipes.errors.error },
    values: result.values,
  };
  if (version === undefined) return failed;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipes")
    .update({ title, ingredients, steps })
    .eq("id", id)
    .eq("version", version)
    .select("id, version");
  if (error) return failed;

  if (data.length === 0) {
    // Nothing matched: either someone saved first (version moved on) or the recipe is gone.
    if (await getRecipe(id)) {
      if (formData.get("photoChanges") === "1") {
        await discardUnrecordedUploads({
          client: supabase,
          admin: createAdminClient(),
          cookbookId: membership.cookbookId,
          recipeId: id,
          ids: formData
            .getAll("photoOrder")
            .filter((value): value is string => typeof value === "string" && UUID.test(value)),
        });
      }
      return { status: "conflict", values: result.values };
    }
    notFound();
  }

  // Photo changes ride on the same save, applied only after the versioned text update matched.
  if (formData.get("photoChanges") === "1") {
    const order = photoIdsSchema.safeParse(
      formData.getAll("photoOrder").filter((value): value is string => typeof value === "string"),
    );
    const applied = order.success
      ? await applyPhotoChanges({
          client: supabase,
          admin: createAdminClient(),
          cookbookId: membership.cookbookId,
          recipeId: id,
          order: order.data,
        })
      : ({ ok: false, reason: "invalid" } as const);
    if (!applied.ok) {
      const { errors } = getDictionary(locale).recipes;
      return {
        status: "error",
        errors: { form: applied.reason === "photos_missing" ? errors.photosMissing : errors.error },
        values: result.values,
      };
    }
  }

  redirect(`/${locale}/recipes/${id}`);
}
