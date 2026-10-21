import { notFound, redirect } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentMembership } from "@/lib/auth/membership";

export default async function RecipesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Layouts and pages render in parallel, so the page checks membership too.
  const membership = await getCurrentMembership();
  if (!membership) redirect(`/${locale}/sign-in`);

  const { recipes } = getDictionary(locale);

  return (
    <>
      <h1 className="text-2xl font-semibold break-words">{membership.cookbookName}</h1>
      <p className="text-base text-muted-foreground">{recipes.empty}</p>
    </>
  );
}
