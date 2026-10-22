import "server-only";

import { cache } from "react";

import { isAuthRetryableFetchError, type SupabaseClient } from "@supabase/supabase-js";

import { isLocale, type Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

export type Membership = {
  userId: string;
  role: "owner" | "member";
  locale: Locale;
  cookbookId: string;
  cookbookName: string;
};

export type MembershipStatus =
  | { status: "member"; membership: Membership }
  | { status: "none" }
  | { status: "unavailable" };

/** Network failures and server errors mean Supabase could not answer, not that access is gone. */
function isOutage(error: unknown): boolean {
  if (isAuthRetryableFetchError(error)) return true;
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === "number" && (status === 0 || status >= 500);
}

async function readMembershipStatus(client: SupabaseClient): Promise<MembershipStatus> {
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();
  if (userError) return isOutage(userError) ? { status: "unavailable" } : { status: "none" };
  if (!user) return { status: "none" };

  const { data, error } = await client
    .from("memberships")
    .select("role, locale, cookbook_id, cookbooks(name)")
    .eq("user_id", user.id)
    .maybeSingle();
  // Any failure here is treated as an outage: a missing row is the only "no access" answer.
  if (error) return { status: "unavailable" };
  if (!data) return { status: "none" };

  const cookbook = data.cookbooks as unknown as { name: string } | null;
  if (!cookbook) return { status: "none" };

  return {
    status: "member",
    membership: {
      userId: user.id,
      role: data.role as Membership["role"],
      locale: isLocale(data.locale) ? data.locale : "pt",
      cookbookId: data.cookbook_id,
      cookbookName: cookbook.name,
    },
  };
}

const getRequestMembershipStatus = cache(async (): Promise<MembershipStatus> =>
  readMembershipStatus(await createClient()),
);

/**
 * The caller's access, read under RLS: member, none (signed out, removed or never a member),
 * or unavailable (Supabase unreachable or paused, D-34). Without a client it uses the
 * request's user-scoped client, cached per request.
 */
export function getMembershipStatus(client?: SupabaseClient): Promise<MembershipStatus> {
  return client ? readMembershipStatus(client) : getRequestMembershipStatus();
}

/** The signed-in user's membership; null when signed out, not a member, or unavailable. */
export const getCurrentMembership = cache(async (): Promise<Membership | null> => {
  const result = await getMembershipStatus();
  return result.status === "member" ? result.membership : null;
});
