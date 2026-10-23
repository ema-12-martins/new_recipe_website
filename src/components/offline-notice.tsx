"use client";

import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { useOnlineStatus } from "@/lib/offline/use-online-status";

export function OfflineNotice({ locale }: { locale: Locale }) {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="mx-auto w-full max-w-5xl rounded-md border border-border bg-secondary px-4 py-3 text-sm text-secondary-foreground"
    >
      {getDictionary(locale).offline.notice}
    </div>
  );
}
