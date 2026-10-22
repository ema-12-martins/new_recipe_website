import { notFound } from "next/navigation";

import { JoinForm } from "@/components/join-form";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getInviteState } from "@/lib/invites/redeem";
import { createClient } from "@/lib/supabase/server";

import { signOutForInviteAction } from "./actions";

/** Guided join through a one-time invite link (D-07, D-29). */
export default async function JoinPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  if (!isLocale(locale)) notFound();

  const { common, auth, members } = getDictionary(locale);
  const join = members.join;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let body: React.ReactNode;
  if (user) {
    body = (
      <div className="space-y-4">
        <p role="status" className="text-base">
          {join.signedInAs.replace("{email}", user.email ?? "")}
        </p>
        <form action={signOutForInviteAction.bind(null, locale, token)}>
          <Button type="submit" variant="outline" className="h-11">
            {auth.signOut}
          </Button>
        </form>
      </div>
    );
  } else if ((await getInviteState(token)) === "invalid") {
    body = (
      <p role="status" className="text-base">
        {join.invalid}
      </p>
    );
  } else {
    body = (
      <>
        <p className="text-base text-muted-foreground">{join.intro}</p>
        <JoinForm
          locale={locale}
          token={token}
          labels={{
            email: join.email,
            emailNote: join.emailNote,
            password: join.password,
            submit: join.submit,
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

      <div className="space-y-2">
        <p className="text-base text-muted-foreground">{common.appName}</p>
        <h1 className="text-2xl font-semibold">{join.heading}</h1>
      </div>

      {body}
    </main>
  );
}
