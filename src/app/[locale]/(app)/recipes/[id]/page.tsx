import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { PhotoGallery } from "@/components/photo-gallery";
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
        className="inline-block py-2 text-sm font-medium underline underline-offset-4"
      >
        {recipes.backToCookbook}
      </Link>

      <div className="recipe-sheet space-y-6">
        <h1 className="text-3xl font-bold break-words whitespace-pre-wrap">{recipe.title}</h1>

        {recipe.ingredients.length > 0 ? (
          <section className="space-y-2">
            <h2 className="text-xl font-bold text-primary">{recipes.ingredientsHeading}</h2>
            <ul role="list" className="recipe-ingredients">
              {recipe.ingredients.map((line, index) => (
                <li key={index} className="break-words whitespace-pre-wrap">
                  {line}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {recipe.steps.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-primary">{recipes.stepsHeading}</h2>
            <ol role="list" className="recipe-steps space-y-4">
              {recipe.steps.map((step, index) => (
                <li key={index} className="break-words whitespace-pre-wrap">
                  {step}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

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
