"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LOCALE_COOKIE, defaultLocale, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { redeemInvite } from "@/lib/invites/redeem";
import { isInviteTokenFormat } from "@/lib/invites/token";
import { createClient } from "@/lib/supabase/server";

export type JoinState = { error?: string; email?: string };

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Creates the invitee's account, joins it to the cookbook and signs it in on this device. */
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
  } = await supabase.auth.getUser();
  // Never join while another account is signed in on this device.
  if (user) return { error: errors.signed_in, email };

  const result = await redeemInvite({ token: formData.get("token"), email, password, locale });
  if (!result.ok) return { error: errors[result.reason], email };

  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  // The account exists and has joined; the person can still sign in normally.
  if (error) redirect(`/${locale}/sign-in`);

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, { path: "/", sameSite: "lax", maxAge: ONE_YEAR_SECONDS });

  redirect(`/${locale}/recipes`);
}

/** Signs out on this device only and returns to the same invite link. */
export async function signOutForInviteAction(locale: string, token: string): Promise<void> {
  const target = isLocale(locale) ? locale : defaultLocale;
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect(isInviteTokenFormat(token) ? `/${target}/join/${token}` : `/${target}/sign-in`);
}
