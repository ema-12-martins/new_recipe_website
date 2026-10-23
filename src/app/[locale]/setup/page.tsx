import Link from "next/link";
import { notFound } from "next/navigation";

import { OwnerSetupForm } from "@/components/owner-setup-form";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";

export default async function SetupPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const { common, auth } = getDictionary(locale);
  const supabase = await createClient();
  const { data: cookbookExists, error } = await supabase.rpc("cookbook_exists");
  // If the state cannot be read, do not offer setup; the server re-checks on submit anyway.
  const alreadySetUp = error ? true : cookbookExists === true;

  return (
    <main className="space-y-6">
      <div className="space-y-1 pt-2 text-center">
        <h1 className="text-3xl font-bold">{common.appName}</h1>
        <p className="font-hand text-xl leading-tight text-muted-foreground">{common.tagline}</p>
      </div>

      <div className="paper-panel space-y-6">
        {alreadySetUp ? null : <p className="text-base text-muted-foreground">{auth.setup.intro}</p>}

        {alreadySetUp ? (
          <div className="space-y-2">
            <p>{auth.setup.alreadySetUp}</p>
            <Link href={`/${locale}/sign-in`} className="font-medium underline underline-offset-4">
              {auth.setup.signInLink}
            </Link>
          </div>
        ) : (
          <OwnerSetupForm
            locale={locale}
            labels={{
              code: auth.setup.code,
              email: auth.setup.email,
              password: auth.setup.password,
              submit: auth.setup.submit,
            }}
          />
        )}
      </div>
    </main>
  );
}
