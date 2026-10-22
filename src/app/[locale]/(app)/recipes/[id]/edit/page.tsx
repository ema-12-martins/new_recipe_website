import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { RecipeForm } from "@/components/recipe-form";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentMembership } from "@/lib/auth/membership";
import { getRecipe } from "@/lib/recipes/queries";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const membership = await getCurrentMembership();
  if (!membership) redirect(`/${locale}/sign-in`);

  const recipe = await getRecipe(id);
  if (!recipe) notFound();

  const { recipes } = getDictionary(locale);

  return (
    <>
      <Link
        href={`/${locale}/recipes/${recipe.id}`}
        className="inline-block py-2 text-sm font-medium underline underline-offset-4"
      >
        {recipe.title}
      </Link>
      <h1 className="text-2xl font-semibold">{recipes.editHeading}</h1>
      {/* Keyed by version so opening the latest version after a conflict starts a fresh form. */}
      <RecipeForm
        key={`${recipe.id}:${recipe.version}`}
        mode="edit"
        recipeId={recipe.id}
        version={recipe.version}
        initial={{ title: recipe.title, ingredients: recipe.ingredients, steps: recipe.steps }}
        locale={locale}
        labels={recipes}
      />
    </>
  );
}
