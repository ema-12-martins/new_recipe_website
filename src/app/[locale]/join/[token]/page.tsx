import { notFound } from "next/navigation";
import Link from "next/link";

import { JoinForm } from "@/components/join-form";
import { LanguageSwitcher } from "@/components/language-switcher";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getInviteState } from "@/lib/invites/redeem";
import { createClient } from "@/lib/supabase/server";

/** Guided join through a one-time invite link (D-07, D-29). */
export default async function JoinPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  if (!isLocale(locale)) notFound();

  const { common, members } = getDictionary(locale);
  const join = members.join;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const inviteState = await getInviteState(token);
  let body: React.ReactNode;
  if (inviteState === "unavailable") {
    body = (
      <div className="space-y-4">
        <p role="alert">{join.unavailable}</p>
        <a href={`/${locale}/join/${token}`} className="font-medium underline underline-offset-4">
          {join.retry}
        </a>
      </div>
    );
  } else if (inviteState === "invalid") {
    body = (
      <p role="status" className="text-base">
        {join.invalid}
      </p>
    );
  } else {
    body = (
      <>
        <p className="text-base text-muted-foreground">{join.intro}</p>
        {user ? (
          <p role="status" className="text-sm text-muted-foreground">
            {join.signedInAs.replace("{email}", user.email ?? "")}
          </p>
        ) : null}
        <JoinForm
          locale={locale}
          token={token}
          labels={{
            email: join.email,
            emailNote: join.emailNote,
            password: join.password,
            submit: join.submit,
            created: join.created,
          }}
        />
      </>
    );
  }

  return (
    <main className="space-y-6">
      <div className="flex justify-end">
        <LanguageSwitcher locale={locale} labels={common.languageSwitcher} />
      </div>

      <p className="pt-2 text-center font-display text-2xl font-bold">{common.appName}</p>

      <div className="paper-panel space-y-6">
        <h1 className="text-3xl font-bold">{join.heading}</h1>

        {body}
        {user ? (
          <Link href={`/${locale}/recipes`} className="inline-block underline underline-offset-4">
            {join.returnToCookbook}
          </Link>
        ) : null}
      </div>
    </main>
  );
}
