"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { defaultLocale, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentMembership } from "@/lib/auth/membership";
import { createInviteSchema } from "@/lib/invites/schemas";
import { generateInviteToken, hashInviteToken } from "@/lib/invites/token";
import { createClient } from "@/lib/supabase/server";

export type CreateInviteState = { link?: string; error?: string; label?: string };

async function siteOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost";
  const forwardedProto = headerList.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const isLocal = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  const proto = forwardedProto === "http" || forwardedProto === "https" ? forwardedProto : null;
  return `${proto ?? (isLocal ? "http" : "https")}://${host}`;
}

/**
 * Owner only. Stores the hash of a fresh token and returns the full link once, in the
 * action state; the plain token is never stored or logged.
 */
export async function createInviteAction(
  _prevState: CreateInviteState,
  formData: FormData,
): Promise<CreateInviteState> {
  const rawLocale = formData.get("locale");
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const { members } = getDictionary(locale);
  const rawLabel = String(formData.get("label") ?? "");

  const membership = await getCurrentMembership();
  if (!membership || membership.role !== "owner") return { error: members.errors.create };

  const parsed = createInviteSchema.safeParse({ label: rawLabel });
  if (!parsed.success) return { error: members.errors.label, label: rawLabel };

  const token = generateInviteToken();
  const supabase = await createClient();
  const { error } = await supabase.from("invites").insert({
    cookbook_id: membership.cookbookId,
    token_hash: hashInviteToken(token),
    label: parsed.data.label,
  });
  if (error) return { error: members.errors.create, label: rawLabel };

  revalidatePath(`/${locale}/members`);
  return { link: `${await siteOrigin()}/${locale}/join/${token}` };
}
