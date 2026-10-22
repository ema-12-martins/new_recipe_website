"use client";

import { useFormStatus } from "react-dom";

import { signOutAction } from "@/app/[locale]/sign-in/actions";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" disabled={pending} className="h-11">
      {label}
    </Button>
  );
}

export function SignOutButton({ locale, label }: { locale: Locale; label: string }) {
  return (
    <form action={signOutAction.bind(null, locale)}>
      <SubmitButton label={label} />
    </form>
  );
}
