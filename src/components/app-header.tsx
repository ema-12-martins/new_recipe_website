import Link from "next/link";

import { LanguageSwitcher } from "@/components/language-switcher";
import { SignOutButton } from "@/components/sign-out-button";
import { buttonVariants } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentMembership } from "@/lib/auth/membership";
import { displayCookbookName } from "@/lib/cookbook-name";

/**
 * Shown on every member page: the cookbook name, the owner's Members link, the language
 * switcher and this device's sign-out.
 */
export async function AppHeader({ locale }: { locale: Locale }) {
  const membership = await getCurrentMembership();
  if (!membership) return null;

  const { auth, common, members, offline } = getDictionary(locale);

  return (
    // Full-bleed cream label band; it only tucks under the page's top padding when no
    // offline notice is shown above it.
    <header className="paper-label mx-[calc(50%-50vw)] mb-10 first:-mt-6">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-x-3 gap-y-0 px-4 py-2 sm:px-6">
        {/* On phones the name gets its own line instead of being cut off by the controls. */}
        <p className="w-full min-w-0 pt-1 font-display text-lg leading-tight font-bold break-words sm:w-auto sm:flex-1 sm:pt-0">
          {displayCookbookName(membership.cookbookName, common.appName)}
        </p>
        <div className="-ml-2 flex shrink-0 items-center gap-2 sm:ml-0">
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
      </div>
    </header>
  );
}
