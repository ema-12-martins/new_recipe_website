"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import { ensureOfflineOwner, purgeOfflineData } from "@/lib/offline/store";

export function OfflineSession({
  userId,
  locale,
  unavailableText,
  retryText,
  clearFailedText,
}: {
  userId: string;
  locale: Locale;
  unavailableText: string;
  retryText: string;
  clearFailedText: string;
}) {
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);

  const reauthorize = useCallback(async () => {
    try {
      const response = await fetch("/api/session", { cache: "no-store" });
      if (response.status === 401) {
        try {
          await purgeOfflineData();
        } catch (error) {
          console.error("Could not clear offline data after access was denied.", error);
        }
        router.replace(`/${locale}/sign-in?reason=no-access`);
        return;
      }
      if (response.status === 503) {
        setNotice(unavailableText);
        return;
      }
      if (!response.ok) {
        throw new Error(`Session reauthorization returned HTTP ${response.status}.`);
      }

      const body: unknown = await response.json();
      if (
        typeof body !== "object" ||
        body === null ||
        !("userId" in body) ||
        typeof body.userId !== "string" ||
        !body.userId
      ) {
        throw new Error("Session reauthorization returned an invalid response.");
      }
      if (body.userId !== userId) await ensureOfflineOwner(body.userId);

      setNotice(null);
      router.refresh();
    } catch (error) {
      console.error("Could not reauthorize the offline session.", error);
      setNotice(unavailableText);
    }
  }, [locale, router, unavailableText, userId]);

  useEffect(() => {
    let active = true;
    void ensureOfflineOwner(userId).catch((error: unknown) => {
      console.error("Could not confirm offline account ownership.", error);
      if (active) setNotice(clearFailedText);
    });
    return () => {
      active = false;
    };
  }, [clearFailedText, userId]);

  useEffect(() => {
    const handleOnline = () => {
      void reauthorize();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [reauthorize]);

  if (!notice) return null;
  return (
    <div role="status" className="mx-auto w-full max-w-5xl space-y-2 rounded-md border p-4 text-sm">
      <p>{notice}</p>
      <Button type="button" variant="outline" className="h-11" onClick={() => void reauthorize()}>
        {retryText}
      </Button>
    </div>
  );
}
