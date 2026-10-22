import { SignOutButton } from "@/components/sign-out-button";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentMembership } from "@/lib/auth/membership";

/** Shown on every member page: the cookbook name and this device's sign-out. */
export async function AppHeader({ locale }: { locale: Locale }) {
  const membership = await getCurrentMembership();
  if (!membership) return null;

  const { auth } = getDictionary(locale);

  return (
    <header className="mb-6 flex items-center justify-between gap-3 border-b pb-4">
      <p className="min-w-0 truncate text-base font-medium">{membership.cookbookName}</p>
      <div className="flex shrink-0 items-center gap-2">
        <SignOutButton locale={locale} label={auth.signOut} />
      </div>
    </header>
  );
}
