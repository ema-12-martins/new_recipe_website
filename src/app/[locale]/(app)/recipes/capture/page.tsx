import { randomUUID } from "node:crypto";

import { notFound } from "next/navigation";

import { BackLink } from "@/components/back-link";
import { CaptureFlow } from "@/components/capture-flow";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { requireMembership } from "@/lib/auth/require-membership";
import { isRecognitionEnabled } from "@/lib/recognition/provider-approved";

export default async function CaptureRecipePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const membership = await requireMembership(locale);

  const { recipes, capture, recognition } = getDictionary(locale);
  // Issued per render, like the manual form, so a repeated save is recognised as the same recipe
  // and the photo files can be named before the recipe row exists.
  const recipeId = randomUUID();

  return (
    <>
      <CaptureFlow
        back={<BackLink href={`/${locale}/recipes`}>{recipes.backToCookbook}</BackLink>}
        locale={locale}
        cookbookId={membership.cookbookId}
        recipeId={recipeId}
        recipes={recipes}
        capture={capture}
        recognition={recognition}
        recognitionEnabled={isRecognitionEnabled()}
      />
    </>
  );
}
