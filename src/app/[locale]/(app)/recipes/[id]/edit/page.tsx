import { notFound } from "next/navigation";

import { BackLink } from "@/components/back-link";
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
      <div className="paper-panel space-y-6">
        <BackLink href={`/${locale}/recipes/${recipe.id}`}>{recipes.backToRecipe}</BackLink>
        <h1 className="text-3xl font-bold">{recipes.editHeading}</h1>
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
