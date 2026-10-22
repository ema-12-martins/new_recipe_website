"use client";

import { useActionState, useSyncExternalStore } from "react";

import {
  createInviteAction,
  type CreateInviteState,
} from "@/app/[locale]/(app)/members/actions";
import { InviteLinkPanel, type InviteLinkPanelLabels } from "@/components/invite-link-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/i18n/config";

export type CreateInviteLabels = {
  labelField: string;
  labelHint: string;
  createLink: string;
  panel: InviteLinkPanelLabels;
};

const noopSubscribe = () => () => {};

export function CreateInviteForm({ locale, labels }: { locale: Locale; labels: CreateInviteLabels }) {
  const [state, formAction, pending] = useActionState<CreateInviteState, FormData>(
    createInviteAction,
    {},
  );
  // Inert until hydrated, so text typed early is never reset by React.
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4" noValidate>
        <fieldset disabled={!hydrated} className="min-w-0 space-y-4">
          <input type="hidden" name="locale" value={locale} />

          <div className="space-y-2">
            <Label htmlFor="invite-label">{labels.labelField}</Label>
            <Input
              id="invite-label"
              name="label"
              type="text"
              autoComplete="off"
              maxLength={80}
              defaultValue={state.label}
              aria-describedby="invite-label-hint"
            />
            <p id="invite-label-hint" className="text-sm text-muted-foreground">
              {labels.labelHint}
            </p>
          </div>

          {state.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <Button type="submit" disabled={pending} className="h-11 w-full sm:w-auto">
            {labels.createLink}
          </Button>
        </fieldset>
      </form>

      {state.link ? <InviteLinkPanel key={state.link} link={state.link} labels={labels.panel} /> : null}
    </div>
  );
}
