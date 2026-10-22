"use client";

import Link from "next/link";
import { useActionState, useState, useSyncExternalStore } from "react";

import {
  removeMemberAction,
  type RemoveMemberState,
} from "@/app/[locale]/(app)/members/[userId]/remove/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";

export type MemberRemovalLabels = {
  keep: string;
  remove: string;
  noRecipes: string;
  confirmNote: string;
  confirm: string;
  cancel: string;
};

type Decision = "keep" | "remove";

const noopSubscribe = () => () => {};

/** One keep/remove choice per recipe the member created (keep preselected), then removal. */
export function MemberRemovalForm({
  locale,
  memberId,
  recipes,
  labels,
}: {
  locale: Locale;
  memberId: string;
  recipes: { id: string; title: string }[];
  labels: MemberRemovalLabels;
}) {
  const [state, formAction, pending] = useActionState<RemoveMemberState, FormData>(
    removeMemberAction,
    {},
  );
  // Controlled, so a failed attempt keeps the owner's choices for the retry.
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <fieldset disabled={!hydrated || pending} className="min-w-0 space-y-6">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="memberId" value={memberId} />

        {recipes.length === 0 ? (
          <p className="text-base text-muted-foreground">{labels.noRecipes}</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {recipes.map((recipe) => {
              const name = `decision:${recipe.id}`;
              const value = decisions[recipe.id] ?? "keep";
              return (
                <li key={recipe.id} className="px-4 py-3">
                  <fieldset className="min-w-0 space-y-1">
                    <legend className="text-base font-medium break-words whitespace-pre-wrap">
                      {recipe.title}
                    </legend>
                    {(["keep", "remove"] as const).map((option) => (
                      <label key={option} className="flex min-h-11 items-center gap-3 text-base">
                        <input
                          type="radio"
                          name={name}
                          value={option}
                          checked={value === option}
                          onChange={() =>
                            setDecisions((current) => ({ ...current, [recipe.id]: option }))
                          }
                          className="size-5 accent-primary"
                        />
                        {labels[option]}
                      </label>
                    ))}
                  </fieldset>
                </li>
              );
            })}
          </ul>
        )}

        <p className="text-base">{labels.confirmNote}</p>

        {state.error ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" variant="destructive" className="h-11">
            {labels.confirm}
          </Button>
          <Link
            href={`/${locale}/members`}
            className={buttonVariants({ variant: "outline", className: "h-11" })}
          >
            {labels.cancel}
          </Link>
        </div>
      </fieldset>
    </form>
  );
}
