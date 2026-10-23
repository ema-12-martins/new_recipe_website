"use client";

import { Camera, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHydrated } from "@/components/use-hydrated";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { RecipeListItem } from "@/lib/recipes/queries";
import { matchesQuery, searchableText } from "@/lib/recipes/search";

type Props = {
  locale: Locale;
  items: RecipeListItem[];
  labels: Dictionary["recipes"];
  /** The page's action buttons, shown between the search bar and the list. */
  children?: React.ReactNode;
};

/** The recipe list with a search bar on top; it filters as the member types. */
export function RecipeList({ locale, items, labels, children }: Props) {
  const [query, setQuery] = useState("");
  const hydrated = useHydrated();

  const searchable = useMemo(() => items.map((item) => searchableText(item)), [items]);
  const shown = useMemo(
    () => items.filter((_, index) => matchesQuery(query, searchable[index])),
    [items, searchable, query],
  );
  const searching = query.trim() !== "";

  // European Portuguese plural rules: "0 passos", "1 passo".
  const plurals = new Intl.PluralRules(locale === "pt" ? "pt-PT" : locale);
  const count = (forms: { one: string; other: string }, n: number) =>
    (plurals.select(n) === "one" ? forms.one : forms.other).replace("{n}", String(n));

  const { search } = labels;

  return (
    <>
      {items.length > 0 ? (
        <div role="search" className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setQuery("");
            }}
            disabled={!hydrated}
            placeholder={search.placeholder}
            aria-label={search.label}
            autoComplete="off"
            enterKeyHint="search"
            className="h-12 pr-12 pl-10 text-base [&::-webkit-search-cancel-button]:appearance-none"
          />
          {searching ? (
            <Button
              type="button"
              variant="ghost"
              className="absolute top-1/2 right-1 size-11 -translate-y-1/2"
              aria-label={search.clear}
              onClick={() => setQuery("")}
            >
              <X aria-hidden />
            </Button>
          ) : null}
        </div>
      ) : null}

      {children}

      {items.length === 0 ? (
        <div className="paper-panel space-y-2 text-center">
          <p className="font-hand text-2xl leading-tight">{labels.empty}</p>
          <p className="text-base text-muted-foreground">{labels.emptyHint}</p>
        </div>
      ) : (
        <>
          {searching ? (
            <p role="status" className="text-base text-muted-foreground">
              {shown.length > 0
                ? count(search.found, shown.length)
                : search.none.replace("{query}", query.trim())}
            </p>
          ) : null}
          <ul role="list" className="space-y-3">
            {shown.map((recipe) => {
              const counts = [
                recipe.ingredientCount > 0
                  ? count(labels.card.ingredients, recipe.ingredientCount)
                  : null,
                recipe.stepCount > 0 ? count(labels.card.steps, recipe.stepCount) : null,
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
                              {count(labels.card.photos, recipe.photoCount)}
                            </span>
                          </span>
                          <span aria-hidden className="paper-stamp">
                            {labels.card.withPhotos}
                          </span>
                        </>
                      ) : null}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
