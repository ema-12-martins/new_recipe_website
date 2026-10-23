import Link from "next/link";
import { Camera } from "lucide-react";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { requireMembership } from "@/lib/auth/require-membership";
import { listRecipes } from "@/lib/recipes/queries";

export default async function RecipesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Layouts and pages render in parallel, and soft navigations skip the layout,
  // so the page checks membership too.
  const membership = await requireMembership(locale);

  const { recipes } = getDictionary(locale);
  const list = await listRecipes(locale);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold break-words">{membership.cookbookName}</h1>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
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
