"use server";

import { redirect } from "next/navigation";

import { defaultLocale, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { setupOwner } from "@/lib/auth/setup-owner";
import { createClient } from "@/lib/supabase/server";

export type OwnerSetupState = { error?: string; email?: string };

export async function setupOwnerAction(
  _prevState: OwnerSetupState,
  formData: FormData,
): Promise<OwnerSetupState> {
  const rawLocale = formData.get("locale");
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const { auth } = getDictionary(locale);

  const result = await setupOwner({
    email,
    password,
    setupCode: String(formData.get("setupCode") ?? ""),
    locale,
  });
  if (!result.ok) {
    return { error: auth.setup.errors[result.reason], email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) {
    return { error: auth.setup.errors.error, email };
  }

  redirect(`/${locale}/recipes`);
}
