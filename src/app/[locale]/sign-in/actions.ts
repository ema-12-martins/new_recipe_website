"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { LOCALE_COOKIE, defaultLocale, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentMembership } from "@/lib/auth/membership";
import { safeNextPath, withLocale } from "@/lib/auth/safe-next";
import { createClient } from "@/lib/supabase/server";

export type SignInState = { error?: string; email?: string };

const signInSchema = z.object({
  email: z.string().trim().max(254).pipe(z.email()),
  // Passwords are used exactly as typed (no trimming).
  password: z.string().min(8).max(128),
});

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function signInAction(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const rawLocale = formData.get("locale");
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const email = String(formData.get("email") ?? "");
  const { auth } = getDictionary(locale);

  const parsed = signInSchema.safeParse({ email, password: formData.get("password") ?? "" });
  // One generic message for every credential problem, so it never reveals whether an email exists.
  if (!parsed.success) return { error: auth.signIn.errors.invalid, email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const isCredentialError = error.status === 400 || error.code === "invalid_credentials";
    return { error: isCredentialError ? auth.signIn.errors.invalid : auth.signIn.errors.error, email };
  }

  const membership = await getCurrentMembership();
  if (!membership) {
    await supabase.auth.signOut({ scope: "local" });
    return { error: auth.signIn.errors.noAccess, email };
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, membership.locale, {
    path: "/",
    sameSite: "lax",
    maxAge: ONE_YEAR_SECONDS,
  });

  const rawNext = formData.get("next");
  const next = safeNextPath(typeof rawNext === "string" ? rawNext : null, membership.locale);
  redirect(withLocale(next, membership.locale));
}

/** Ends the session on this device only; the member stays signed in elsewhere. */
export async function signOutAction(locale: string): Promise<void> {
  const target = isLocale(locale) ? locale : defaultLocale;
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect(`/${target}/sign-in`);
}
