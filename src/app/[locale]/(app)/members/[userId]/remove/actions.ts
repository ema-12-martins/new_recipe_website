"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { defaultLocale, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { removeMember } from "@/lib/members/remove-member";

export type RemoveMemberState = { error?: string };

const DECISION_PREFIX = "decision:";

/** Owner only (removeMember checks the caller's own session). Recipes default to keep. */
export async function removeMemberAction(
  _prevState: RemoveMemberState,
  formData: FormData,
): Promise<RemoveMemberState> {
  const rawLocale = formData.get("locale");
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const { members } = getDictionary(locale);

  const removeRecipeIds: string[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith(DECISION_PREFIX) && value === "remove") {
      removeRecipeIds.push(key.slice(DECISION_PREFIX.length));
    }
  }

  const result = await removeMember({
    memberId: String(formData.get("memberId") ?? ""),
    removeRecipeIds,
  });
  if (!result.ok && result.reason !== "already_removed") return { error: members.errors.remove };

  revalidatePath(`/${locale}/members`);
  revalidatePath(`/${locale}/recipes`);
  redirect(`/${locale}/members?removed=1`);
}
