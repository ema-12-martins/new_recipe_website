"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type InviteLinkPanelLabels = {
  linkReady: string;
  linkField: string;
  linkNote: string;
  copy: string;
  copied: string;
  copyFailed: string;
};

/** Shows a freshly created invite link once, with a copy button. */
export function InviteLinkPanel({ link, labels }: { link: string; labels: InviteLinkPanelLabels }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  return (
    <section aria-labelledby="invite-link-heading" className="space-y-3 rounded-md border p-4">
      <h3 id="invite-link-heading" className="font-display text-lg font-bold">
        {labels.linkReady}
      </h3>
      <div className="space-y-2">
        <Label htmlFor="invite-link">{labels.linkField}</Label>
        <Input
          id="invite-link"
          type="text"
          readOnly
          value={link}
          onFocus={(event) => event.currentTarget.select()}
          className="font-mono text-sm"
        />
      </div>
      <p className="text-sm text-muted-foreground">{labels.linkNote}</p>
      <Button type="button" variant="secondary" onClick={copy} className="h-11 w-full sm:w-auto">
        {labels.copy}
      </Button>
      <p role="status" className="text-sm text-muted-foreground">
        {copyStatus === "copied" ? labels.copied : copyStatus === "failed" ? labels.copyFailed : ""}
      </p>
    </section>
  );
}
