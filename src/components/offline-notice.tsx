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
      className="mx-auto w-full max-w-5xl rounded-md border border-amber-500/50 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      {getDictionary(locale).offline.notice}
    </div>
  );
}
