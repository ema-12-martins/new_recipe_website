import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/**
 * Shown when Supabase cannot be reached or is paused (D-34). It makes no Supabase call and
 * purges nothing: an outage is not lost access.
 */
export default async function UnavailablePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const { common } = getDictionary(locale);

  return (
    <main className="space-y-6">
      <p className="pt-2 text-center font-display text-2xl font-bold">{common.appName}</p>
      <div className="paper-panel space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold break-words">{common.unavailable.title}</h1>
          <p className="text-base break-words">{common.unavailable.body}</p>
        </div>
        <Link
          href={`/${locale}/recipes`}
          className={buttonVariants({ className: "h-11 w-full sm:w-auto" })}
        >
          {common.unavailable.retry}
        </Link>
      </div>
    </main>
  );
}
