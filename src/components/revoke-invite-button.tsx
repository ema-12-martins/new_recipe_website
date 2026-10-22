"use client";

import { useActionState, useSyncExternalStore } from "react";

import {
  revokeInviteAction,
  type RevokeInviteState,
} from "@/app/[locale]/(app)/members/actions";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";

export type RevokeInviteLabels = { revoke: string; revokeLabel: string; revokeConfirm: string };

const noopSubscribe = () => () => {};

/** Revokes one active invite after the owner confirms. */
export function RevokeInviteButton({
  inviteId,
  locale,
  labels,
}: {
  inviteId: string;
  locale: Locale;
  labels: RevokeInviteLabels;
}) {
  const [state, formAction, pending] = useActionState<RevokeInviteState, FormData>(
    () => revokeInviteAction(inviteId, locale),
    {},
  );
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(labels.revokeConfirm)) event.preventDefault();
      }}
      className="flex flex-col items-end gap-1"
    >
      <Button
        type="submit"
        variant="outline"
        disabled={!hydrated || pending}
        aria-label={labels.revokeLabel}
        className="h-11"
      >
        {labels.revoke}
      </Button>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
