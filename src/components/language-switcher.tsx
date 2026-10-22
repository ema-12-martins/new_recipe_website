"use client";

import { usePathname } from "next/navigation";

import { setLocaleAction } from "@/app/[locale]/locale-actions";
import { Button } from "@/components/ui/button";
import { locales, type Locale } from "@/i18n/config";

export type LanguageSwitcherLabels = { label: string } & Record<Locale, string>;

/** Two-option PT/EN toggle; keeps the rest of the current path. */
export function LanguageSwitcher({
  locale,
  labels,
}: {
  locale: Locale;
  labels: LanguageSwitcherLabels;
}) {
  const pathname = usePathname();

  return (
    <div role="group" aria-label={labels.label} className="flex items-center gap-1">
      {locales.map((option) => {
        const active = option === locale;
        return (
          <form key={option} action={setLocaleAction.bind(null, option, pathname)}>
            <Button
              type="submit"
              variant={active ? "secondary" : "ghost"}
              aria-pressed={active}
              aria-label={labels[option]}
              lang={option}
              className="h-11 min-w-11 px-2 text-sm font-semibold"
            >
              {option.toUpperCase()}
            </Button>
          </form>
        );
      })}
    </div>
  );
}
