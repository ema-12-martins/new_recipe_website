"use client";

import { useActionState, useSyncExternalStore } from "react";

import { joinAction, type JoinState } from "@/app/[locale]/join/[token]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/i18n/config";

export type JoinLabels = {
  email: string;
  emailNote: string;
  password: string;
  submit: string;
};

const noopSubscribe = () => () => {};

export function JoinForm({
  locale,
  token,
  labels,
}: {
  locale: Locale;
  token: string;
  labels: JoinLabels;
}) {
  const [state, formAction, pending] = useActionState<JoinState, FormData>(joinAction, {});
  // Inert until hydrated, so text typed early is never reset by React.
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <fieldset disabled={!hydrated} className="min-w-0 space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="token" value={token} />

        <div className="space-y-2">
          <Label htmlFor="email">{labels.email}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={state.email}
            aria-describedby="email-note"
            required
          />
          <p id="email-note" className="text-sm text-muted-foreground">
            {labels.emailNote}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{labels.password}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
          />
        </div>

        {state.error ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="h-11 w-full sm:w-auto">
          {labels.submit}
        </Button>
      </fieldset>
    </form>
  );
}
