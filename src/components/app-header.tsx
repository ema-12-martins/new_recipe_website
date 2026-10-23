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
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-start justify-between gap-x-4 gap-y-1 px-4 pt-2 pb-4 sm:px-6 sm:pt-4">
        {/* The cookbook name and tagline lead every member page; on phones the controls sit
            above them so the name never has to squeeze next to them. */}
        <Link
          href={`/${locale}/recipes`}
          className="order-2 w-full min-w-0 rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:order-1 sm:w-auto sm:flex-1"
        >
          <span className="block font-display text-3xl leading-tight font-bold break-words">
            {displayCookbookName(membership.cookbookName, common.appName)}
          </span>
          <span className="mt-1 block font-hand text-xl leading-tight text-muted-foreground">
            {common.tagline}
          </span>
        </Link>
        <div className="order-1 -mr-2 flex w-full shrink-0 items-center justify-end gap-2 sm:order-2 sm:mr-0 sm:w-auto">
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
