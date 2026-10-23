import { randomUUID } from "node:crypto";

import Link from "next/link";
import { notFound } from "next/navigation";

import { RecipeForm } from "@/components/recipe-form";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { requireMembership } from "@/lib/auth/require-membership";

export default async function NewRecipePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireMembership(locale);

  const { recipes } = getDictionary(locale);
  // Issued per render so every resubmit of this form carries the same id (idempotent create).
  const recipeId = randomUUID();

  return (
    <>
      <Link
        href={`/${locale}/recipes`}
        className="inline-block py-2 text-sm font-medium underline underline-offset-4"
      >
        {recipes.backToCookbook}
      </Link>
      <h1 className="text-3xl font-bold">{recipes.newHeading}</h1>
      <div className="paper-panel">
        <RecipeForm
          mode="create"
          recipeId={recipeId}
          initial={{ title: "", ingredients: [], steps: [] }}
          locale={locale}
          labels={recipes}
        />
      </div>
    </>
  );
}
