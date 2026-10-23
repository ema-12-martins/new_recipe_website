import { randomUUID } from "node:crypto";

import Link from "next/link";
import { notFound } from "next/navigation";

import { CaptureFlow } from "@/components/capture-flow";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { requireMembership } from "@/lib/auth/require-membership";

export default async function CaptureRecipePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const membership = await requireMembership(locale);

  const { recipes, capture } = getDictionary(locale);
  // Issued per render, like the manual form, so a repeated save is recognised as the same recipe
  // and the photo files can be named before the recipe row exists.
  const recipeId = randomUUID();

  return (
    <>
      <Link
        href={`/${locale}/recipes`}
        className="inline-block py-3 text-sm font-bold underline underline-offset-4"
      >
        {recipes.backToCookbook}
      </Link>
      <CaptureFlow
        locale={locale}
        cookbookId={membership.cookbookId}
        recipeId={recipeId}
        recipes={recipes}
        capture={capture}
      />
    </>
  );
}
