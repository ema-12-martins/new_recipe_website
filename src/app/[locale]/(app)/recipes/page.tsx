import Link from "next/link";
import { Camera } from "lucide-react";
import { notFound } from "next/navigation";

import { RecipeList } from "@/components/recipe-list";
import { buttonVariants } from "@/components/ui/button";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { requireMembership } from "@/lib/auth/require-membership";
import { displayCookbookName } from "@/lib/cookbook-name";
import { listRecipes } from "@/lib/recipes/queries";

export default async function RecipesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Layouts and pages render in parallel, and soft navigations skip the layout,
  // so the page checks membership too.
  const membership = await requireMembership(locale);

  const { recipes, common } = getDictionary(locale);
  const list = await listRecipes(locale);

  return (
    <>
      {/* The visible name and tagline are in the header; the page keeps its heading for
          screen readers. */}
      <h1 className="sr-only">{displayCookbookName(membership.cookbookName, common.appName)}</h1>
      <RecipeList locale={locale} items={list} labels={recipes}>
        <div className="flex w-full flex-wrap gap-2 sm:justify-end">
          <Link
            href={`/${locale}/recipes/capture`}
            className={buttonVariants({ variant: "outline", className: "h-11 w-full sm:w-auto" })}
          >
            <Camera aria-hidden />
            {recipes.addFromPhotos}
          </Link>
          <Link
            href={`/${locale}/recipes/new`}
            className={buttonVariants({ className: "h-11 w-full sm:w-auto" })}
          >
            {recipes.newRecipe}
          </Link>
        </div>
      </RecipeList>
    </>
  );
}
