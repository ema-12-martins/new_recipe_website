import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentMembership } from "@/lib/auth/membership";
import { getRecipe } from "@/lib/recipes/queries";

export default async function RecipePage({
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

  // Recipe text is rendered as plain React text exactly as stored (D-11); no creator info.
  return (
    <article className="space-y-6">
      <Link
        href={`/${locale}/recipes`}
        className="inline-block py-2 text-sm font-medium underline underline-offset-4"
      >
        {recipes.backToCookbook}
      </Link>

      <h1 className="text-2xl font-semibold break-words whitespace-pre-wrap">{recipe.title}</h1>

      {recipe.ingredients.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-lg font-medium">{recipes.ingredientsHeading}</h2>
          <ul className="list-disc space-y-1 pl-6">
            {recipe.ingredients.map((line, index) => (
              <li key={index} className="break-words whitespace-pre-wrap">
                {line}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {recipe.steps.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-lg font-medium">{recipes.stepsHeading}</h2>
          <ol className="list-decimal space-y-3 pl-6">
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
    </article>
  );
}
