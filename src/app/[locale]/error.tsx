"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import { defaultLocale, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/** Shown when a page fails to render, instead of the framework's unstyled English error page. */
export default function LocaleError({ error, retry }: { error: unknown; retry: () => void }) {
  const params = useParams<{ locale?: string }>();
  const locale = isLocale(params?.locale) ? params.locale : defaultLocale;
  const { error: copy } = getDictionary(locale).common;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="space-y-6 pt-2">
      <div className="paper-panel space-y-4">
        <h1 className="text-3xl font-bold">{copy.title}</h1>
        <p role="alert" className="text-base">
          {copy.body}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" className="h-11 w-full sm:w-auto" onClick={() => retry()}>
            {copy.retry}
          </Button>
          {/* A full navigation, so a broken client state cannot carry over. */}
          <a
            href={`/${locale}/recipes`}
            className={buttonVariants({ variant: "outline", className: "h-11 w-full sm:w-auto" })}
          >
            {copy.home}
          </a>
        </div>
      </div>
    </main>
  );
}
