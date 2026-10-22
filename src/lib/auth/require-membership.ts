import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { Locale } from "@/i18n/config";
import { getMembershipStatus, type Membership } from "@/lib/auth/membership";

/** Supabase stores the session as sb-<project>-auth-token, split into .0/.1 chunks when large. */
function hasAuthCookie(all: { name: string; value: string }[]): boolean {
  return all.some(
    ({ name, value }) => name.startsWith("sb-") && name.includes("-auth-token") && value !== "",
  );
}

/**
 * Page-level guard for the member area. The (app) layout and every (app) page call it, because a
 * soft navigation re-renders only the page, not the shared layout.
 */
export async function requireMembership(locale: Locale): Promise<Membership> {
  const result = await getMembershipStatus();
  if (result.status === "member") return result.membership;

  if (result.status === "none") {
    // A session that is still presented but has no membership means access was taken away.
    if (hasAuthCookie((await cookies()).getAll())) redirect(`/${locale}/sign-in?reason=no-access`);
    redirect(`/${locale}/sign-in`);
  }

  throw new Error("Supabase is unreachable");
}
