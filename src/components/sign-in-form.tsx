"use client";

import { useActionState, useSyncExternalStore } from "react";

import { signInAction, type SignInState } from "@/app/[locale]/sign-in/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/i18n/config";

export type SignInLabels = {
  email: string;
  password: string;
  submit: string;
};

const noopSubscribe = () => () => {};

export function SignInForm({
  locale,
  next,
  labels,
}: {
  locale: Locale;
  next?: string;
  labels: SignInLabels;
}) {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(signInAction, {});
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
        {next ? <input type="hidden" name="next" value={next} /> : null}

        <div className="space-y-2">
          <Label htmlFor="email">{labels.email}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            defaultValue={state.email}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{labels.password}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
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
