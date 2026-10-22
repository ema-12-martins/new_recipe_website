import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentMembership } from "@/lib/auth/membership";
import { listRecipes } from "@/lib/recipes/queries";

export default async function RecipesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Layouts and pages render in parallel, so the page checks membership too.
  const membership = await getCurrentMembership();
  if (!membership) redirect(`/${locale}/sign-in`);

  const { recipes } = getDictionary(locale);
  const list = await listRecipes(locale);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold break-words">{membership.cookbookName}</h1>
        <Link
          href={`/${locale}/recipes/new`}
          className={buttonVariants({ className: "h-11 w-full sm:w-auto" })}
        >
          {recipes.newRecipe}
        </Link>
      </div>

      {list.length === 0 ? (
        <p className="text-base text-muted-foreground">{recipes.empty}</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {list.map((recipe) => (
            <li key={recipe.id}>
              <Link
                href={`/${locale}/recipes/${recipe.id}`}
                className="block px-4 py-3 text-base break-words hover:bg-accent"
              >
                {recipe.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
