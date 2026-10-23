import { randomUUID } from "node:crypto";

import { notFound } from "next/navigation";

import { BackLink } from "@/components/back-link";
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
      <div className="paper-panel space-y-6">
        <BackLink href={`/${locale}/recipes`}>{recipes.backToCookbook}</BackLink>
        <h1 className="text-3xl font-bold">{recipes.newHeading}</h1>
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
