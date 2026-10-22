import Link from "next/link";

import { LanguageSwitcher } from "@/components/language-switcher";
import { SignOutButton } from "@/components/sign-out-button";
import { buttonVariants } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentMembership } from "@/lib/auth/membership";

/**
 * Shown on every member page: the cookbook name, the owner's Members link, the language
 * switcher and this device's sign-out.
 */
export async function AppHeader({ locale }: { locale: Locale }) {
  const membership = await getCurrentMembership();
  if (!membership) return null;

  const { auth, common, members, offline } = getDictionary(locale);

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
      <p className="min-w-0 flex-1 truncate text-base font-medium">{membership.cookbookName}</p>
      <div className="flex shrink-0 items-center gap-2">
        {membership.role === "owner" ? (
          <Link
            href={`/${locale}/members`}
            className={buttonVariants({ variant: "ghost", className: "h-11 px-3" })}
          >
            {members.navLink}
          </Link>
        ) : null}
        <LanguageSwitcher locale={locale} labels={common.languageSwitcher} />
        <SignOutButton
          locale={locale}
          label={auth.signOut}
          errorMessage={offline.clearFailed}
        />
      </div>
    </header>
  );
}
