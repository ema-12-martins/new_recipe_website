"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { signOutAction } from "@/app/[locale]/sign-in/actions";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import { purgeOfflineData } from "@/lib/offline/store";

function SubmitButton({
  label,
  purging,
  onSignOut,
}: {
  label: string;
  purging: boolean;
  onSignOut: () => void;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending || purging}
      className="h-11"
      onClick={onSignOut}
    >
      {label}
    </Button>
  );
}

export function SignOutButton({
  locale,
  label,
  errorMessage,
}: {
  locale: Locale;
  label: string;
  errorMessage: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [purging, setPurging] = useState(false);
  const [purgeFailed, setPurgeFailed] = useState(false);

  async function handleSignOut() {
    setPurgeFailed(false);
    setPurging(true);
    try {
      await purgeOfflineData();
      const form = formRef.current;
      if (!form) throw new Error("The sign-out form is not available.");
      form.requestSubmit();
    } catch (error) {
      console.error("Could not clear offline data before signing out.", error);
      setPurgeFailed(true);
    }
    setPurging(false);
  }

  return (
    <form ref={formRef} action={signOutAction.bind(null, locale)}>
      {purgeFailed ? (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}
      <SubmitButton label={label} purging={purging} onSignOut={() => void handleSignOut()} />
    </form>
  );
}
