"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LOCALE_COOKIE, defaultLocale, isLocale } from "@/i18n/config";
import { safeNextPath, withLocale } from "@/lib/auth/safe-next";
import { createClient } from "@/lib/supabase/server";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Switches the interface language: remembers it in this browser (cookie) and, for a
 * signed-in member, on their membership so other devices follow (D-26).
 */
export async function setLocaleAction(targetLocale: string, pathname: string): Promise<void> {
  const locale = isLocale(targetLocale) ? targetLocale : defaultLocale;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, { path: "/", sameSite: "lax", maxAge: ONE_YEAR_SECONDS });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    // A failure here only loses the cross-device memory; this browser still switches.
    const { error } = await supabase.rpc("set_my_locale", { p_locale: locale });
    if (error) console.error("set_my_locale failed", error.code);
  }

  const path = typeof pathname === "string" ? pathname : "";
  redirect(safeNextPath(path, locale) === path ? withLocale(path, locale) : `/${locale}`);
}
