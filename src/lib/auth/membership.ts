import "server-only";

import { cache } from "react";

import { isLocale, type Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

export type Membership = {
  userId: string;
  role: "owner" | "member";
  locale: Locale;
  cookbookId: string;
  cookbookName: string;
};

/** The signed-in user's membership, read under RLS; null when signed out or not a member. */
export const getCurrentMembership = cache(async (): Promise<Membership | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("memberships")
    .select("role, locale, cookbook_id, cookbooks(name)")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) return null;

  const cookbook = data.cookbooks as unknown as { name: string } | null;
  if (!cookbook) return null;

  return {
    userId: user.id,
    role: data.role as Membership["role"],
    locale: isLocale(data.locale) ? data.locale : "pt",
    cookbookId: data.cookbook_id,
    cookbookName: cookbook.name,
  };
});
