"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { defaultLocale, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/** Shown for notFound(), for example a recipe that does not exist or is no longer visible. */
export default function LocaleNotFound() {
  const params = useParams<{ locale?: string }>();
  const locale = isLocale(params?.locale) ? params.locale : defaultLocale;
  const { notFound: copy } = getDictionary(locale).common;

  return (
    <main className="space-y-6 pt-2">
      <div className="paper-panel space-y-4">
        <h1 className="text-3xl font-bold">{copy.title}</h1>
        <p className="text-base">{copy.body}</p>
        <Link
          href={`/${locale}/recipes`}
          className={buttonVariants({ className: "h-11 w-full sm:w-auto" })}
        >
          {copy.home}
        </Link>
      </div>
    </main>
  );
}
