"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isAuthSessionMissingError } from "@supabase/supabase-js";

import { LOCALE_COOKIE, defaultLocale, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { redeemInvite } from "@/lib/invites/redeem";
import { createClient } from "@/lib/supabase/server";

export type JoinState = { error?: string; email?: string; created?: boolean };

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Creates the invitee's account without replacing an existing browser session. */
export async function joinAction(_prevState: JoinState, formData: FormData): Promise<JoinState> {
  const rawLocale = formData.get("locale");
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const { members } = getDictionary(locale);
  const errors = members.join.errors;

  const supabase = await createClient();
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser();
  if (sessionError && !isAuthSessionMissingError(sessionError)) {
    return { error: errors.error, email };
  }

  const result = await redeemInvite({ token: formData.get("token"), email, password, locale });
  if (!result.ok) return { error: errors[result.reason], email };

  if (user) return { created: true, email: email.trim() };

  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  // The account exists and has joined; the person can still sign in normally.
  if (error) redirect(`/${locale}/sign-in`);

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, { path: "/", sameSite: "lax", maxAge: ONE_YEAR_SECONDS });

  redirect(`/${locale}/recipes`);
}
