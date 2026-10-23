import Link from "next/link";
import { Camera } from "lucide-react";
import { notFound } from "next/navigation";

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

  // European Portuguese plural rules: "0 passos", "1 passo".
  const plurals = new Intl.PluralRules(locale === "pt" ? "pt-PT" : locale);
  const count = (forms: { one: string; other: string }, n: number) =>
    (plurals.select(n) === "one" ? forms.one : forms.other).replace("{n}", String(n));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold break-words">
            {displayCookbookName(membership.cookbookName, common.appName)}
          </h1>
          <p className="mt-1 font-hand text-xl leading-tight text-muted-foreground">
            {common.tagline}
          </p>
        </div>
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
        <div className="paper-panel space-y-2 text-center">
          <p className="font-hand text-2xl leading-tight">{recipes.empty}</p>
          <p className="text-base text-muted-foreground">{recipes.emptyHint}</p>
        </div>
      ) : (
        <ul role="list" className="space-y-3">
          {list.map((recipe) => {
            const counts = [
              recipe.ingredientCount > 0 ? count(recipes.card.ingredients, recipe.ingredientCount) : null,
              recipe.stepCount > 0 ? count(recipes.card.steps, recipe.stepCount) : null,
            ].filter(Boolean);
            return (
              <li key={recipe.id}>
                {/* The title link stretches over the card; the counts stay outside the link text. */}
                <div className="index-card">
                  <Link
                    href={`/${locale}/recipes/${recipe.id}`}
                    className="index-card-title index-card-link break-words"
                  >
                    {recipe.title}
                  </Link>
                  <p className="index-card-meta">
                    {counts.length > 0 ? <span>{counts.join(" · ")}</span> : null}
                    {recipe.photoCount > 0 ? (
                      <>
                        <span className="inline-flex items-center gap-1">
                          <Camera aria-hidden className="size-4" />
                          <span aria-hidden>{recipe.photoCount}</span>
                          <span className="sr-only">
                            {count(recipes.card.photos, recipe.photoCount)}
                          </span>
                        </span>
                        <span aria-hidden className="paper-stamp">
                          {recipes.card.withPhotos}
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
