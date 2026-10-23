import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { PhotoGallery } from "@/components/photo-gallery";
import { RecipeChecklist } from "@/components/recipe-checklist";
import { RememberRecipeOffline } from "@/components/remember-recipe-offline";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { requireMembership } from "@/lib/auth/require-membership";
import { listRecipePhotos } from "@/lib/photos/queries";
import { getRecipe } from "@/lib/recipes/queries";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const membership = await requireMembership(locale);

  const recipe = await getRecipe(id);
  if (!recipe) notFound();

  const { recipes, photos: photoLabels } = getDictionary(locale);
  const photos = await listRecipePhotos(recipe.id);

  // Recipe text is rendered as plain React text exactly as stored (D-11); no creator info.
  return (
    <article className="space-y-6">
      <RememberRecipeOffline
        userId={membership.userId}
        recipe={recipe}
        photoIds={photos.map((photo) => photo.id)}
      />
      <Link
        href={`/${locale}/recipes`}
        className="inline-block py-3 text-sm font-bold underline underline-offset-4"
      >
        {recipes.backToCookbook}
      </Link>

      <div className="recipe-sheet space-y-6">
        <h1 className="text-3xl font-bold break-words whitespace-pre-wrap">{recipe.title}</h1>

        <RecipeChecklist
          ingredients={recipe.ingredients}
          steps={recipe.steps}
          labels={{
            ingredientsHeading: recipes.ingredientsHeading,
            stepsHeading: recipes.stepsHeading,
            tickHint: recipes.tickHint,
            stepHint: recipes.stepHint,
            currentStep: recipes.currentStep,
          }}
        />

        <Link
          href={`/${locale}/recipes/${recipe.id}/edit`}
          className={buttonVariants({ variant: "outline", className: "h-11" })}
        >
          {recipes.edit}
        </Link>

        {photos.length > 0 ? (
          <PhotoGallery
            recipeId={recipe.id}
            photoIds={photos.map((photo) => photo.id)}
            labels={photoLabels}
          />
        ) : null}
      </div>
    </article>
  );
}
