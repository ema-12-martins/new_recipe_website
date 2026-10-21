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
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{common.appName}</h1>
        {alreadySetUp ? null : <p className="text-base text-muted-foreground">{auth.setup.intro}</p>}
      </div>

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
    </main>
  );
}
