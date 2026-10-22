import { notFound, redirect } from "next/navigation";

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

  const { common, auth } = getDictionary(locale);

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <p className="text-base text-muted-foreground">{common.appName}</p>
        <h1 className="text-2xl font-semibold">{auth.signIn.heading}</h1>
      </div>

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
    </main>
  );
}
