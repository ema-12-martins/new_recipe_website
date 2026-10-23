import Link from "next/link";
import { notFound } from "next/navigation";

import { RecipeForm } from "@/components/recipe-form";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { requireMembership } from "@/lib/auth/require-membership";
import { listRecipePhotos } from "@/lib/photos/queries";
import { getRecipe } from "@/lib/recipes/queries";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const membership = await requireMembership(locale);

  const recipe = await getRecipe(id);
  if (!recipe) notFound();

  const { recipes, capture, photos } = getDictionary(locale);
  const photoIds = (await listRecipePhotos(recipe.id)).map((photo) => photo.id);

  return (
    <>
      <Link
        href={`/${locale}/recipes/${recipe.id}`}
        className="inline-block py-2 text-sm font-medium underline underline-offset-4"
      >
        {recipe.title}
      </Link>
      <h1 className="text-3xl font-bold">{recipes.editHeading}</h1>
      <div className="paper-panel">
        {/* Keyed by version so opening the latest version after a conflict starts a fresh form. */}
        <RecipeForm
          key={`${recipe.id}:${recipe.version}`}
          mode="edit"
          recipeId={recipe.id}
          version={recipe.version}
          initial={{ title: recipe.title, ingredients: recipe.ingredients, steps: recipe.steps }}
          locale={locale}
          labels={recipes}
          cookbookId={membership.cookbookId}
          initialPhotoIds={photoIds}
          captureLabels={capture}
          photoLabels={photos}
        />
      </div>
    </>
  );
}
