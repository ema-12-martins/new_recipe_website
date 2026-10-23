import { notFound, redirect } from "next/navigation";

import { LanguageSwitcher } from "@/components/language-switcher";
import { PurgeOfflineOnMount } from "@/components/purge-offline-on-mount";
import { SignInForm } from "@/components/sign-in-form";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentMembership } from "@/lib/auth/membership";
import { safeNextPath } from "@/lib/auth/safe-next";

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string | string[]; reason?: string | string[] }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  if (await getCurrentMembership()) redirect(`/${locale}/recipes`);

  const { next, reason } = await searchParams;
  const rawNext = typeof next === "string" ? next : null;
  // Only forward a next value that would actually be honoured.
  const safeNext = rawNext && safeNextPath(rawNext, locale) === rawNext ? rawNext : undefined;

  const { common, auth, offline } = getDictionary(locale);

  return (
    <main className="space-y-6">
      <PurgeOfflineOnMount errorMessage={offline.clearFailed} />
      <div className="flex justify-end">
        <LanguageSwitcher locale={locale} labels={common.languageSwitcher} />
      </div>

      <div className="space-y-1 pt-2 text-center">
        <p className="font-display text-3xl font-bold">{common.appName}</p>
        <p className="font-hand text-xl leading-tight text-muted-foreground">{common.tagline}</p>
      </div>

      <div className="paper-panel space-y-6">
        <h1 className="text-3xl font-bold">{auth.signIn.heading}</h1>

        {reason === "no-access" ? (
          <p role="status" className="text-sm text-destructive">
            {auth.signIn.errors.noAccess}
          </p>
        ) : null}

        <SignInForm
          locale={locale}
          next={safeNext}
          labels={{
            email: auth.signIn.email,
            password: auth.signIn.password,
            submit: auth.signIn.submit,
          }}
        />

        <p className="text-sm text-muted-foreground">{auth.signIn.forgotHelp}</p>
      </div>
    </main>
  );
}
