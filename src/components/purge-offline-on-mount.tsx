"use client";

import { useEffect, useState } from "react";

import { purgeOfflineData } from "@/lib/offline/store";

export function PurgeOfflineOnMount({ errorMessage }: { errorMessage: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    void purgeOfflineData().catch((error: unknown) => {
      console.error("Could not clear offline data on the sign-in page.", error);
      if (active) setFailed(true);
    });
    return () => {
      active = false;
    };
  }, []);

  return failed ? (
    <p role="alert" className="text-sm text-destructive">
      {errorMessage}
    </p>
  ) : null;
}
