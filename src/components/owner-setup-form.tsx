"use client";

import { useActionState } from "react";

import { setupOwnerAction, type OwnerSetupState } from "@/app/[locale]/setup/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/i18n/config";

export type OwnerSetupLabels = {
  code: string;
  email: string;
  password: string;
  submit: string;
};

export function OwnerSetupForm({ locale, labels }: { locale: Locale; labels: OwnerSetupLabels }) {
  const [state, formAction, pending] = useActionState<OwnerSetupState, FormData>(
    setupOwnerAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="locale" value={locale} />

      <div className="space-y-2">
        <Label htmlFor="setupCode">{labels.code}</Label>
        <Input id="setupCode" name="setupCode" type="password" autoComplete="off" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{labels.email}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
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

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {labels.submit}
      </Button>
    </form>
  );
}
