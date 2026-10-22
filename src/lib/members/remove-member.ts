import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getMembershipStatus } from "@/lib/auth/membership";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type RemoveMemberFailure =
  | "not_owner"
  | "cannot_remove_self"
  | "already_removed"
  | "cleanup_failed"
  | "error";

export type RemoveMemberResult =
  | { ok: true; deletedRecipes: number }
  | { ok: false; reason: RemoveMemberFailure };

export type RemoveMemberDeps = {
  /** User-scoped client whose own session identifies the caller. Defaults to the request's. */
  client?: SupabaseClient;
  /** Service-role client factory, used only for the final account deletion. */
  createAdmin?: () => SupabaseClient;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const fail = (reason: RemoveMemberFailure): RemoveMemberResult => ({ ok: false, reason });

/**
 * Owner removes a member's access (AUTH-02, D-10): deletes the reviewed recipes marked
 * remove, then deletes the member's account. Deleting the account drops the membership,
 * anonymizes the creator of every kept recipe (D-17) and frees the email for a re-invite.
 *
 * Safe to repeat: once the membership is gone it reports already_removed, and a retry
 * after cleanup_failed only deletes recipes that still exist and were marked remove.
 */
export async function removeMember(
  input: { memberId: string; removeRecipeIds: string[] },
  deps: RemoveMemberDeps = {},
): Promise<RemoveMemberResult> {
  const client = deps.client ?? (await createClient());
  const createAdmin = deps.createAdmin ?? createAdminClient;

  const caller = await getMembershipStatus(client);
  if (caller.status === "unavailable") return fail("error");
  if (caller.status !== "member" || caller.membership.role !== "owner") return fail("not_owner");

  const { memberId } = input;
  if (!UUID.test(memberId)) return fail("error");
  if (memberId === caller.membership.userId) return fail("cannot_remove_self");

  const { data: target, error: targetError } = await client
    .from("memberships")
    .select("user_id")
    .eq("user_id", memberId)
    .maybeSingle();
  if (targetError) return fail("error");
  if (!target) return fail("already_removed");

  const recipeIds = [...new Set(input.removeRecipeIds.filter((id) => UUID.test(id)))];
  const { data: deleted, error: rpcError } = await client.rpc("delete_member_recipes", {
    p_member: memberId,
    p_recipe_ids: recipeIds,
  });
  if (rpcError) {
    if (rpcError.message.includes("not_owner")) return fail("not_owner");
    if (rpcError.message.includes("cannot_remove_self")) return fail("cannot_remove_self");
    if (rpcError.message.includes("not_a_member")) return fail("already_removed");
    return fail("error");
  }

  const { error: deleteError } = await createAdmin().auth.admin.deleteUser(memberId);
  // A concurrent removal may have deleted the account first; the outcome is the same.
  if (deleteError && deleteError.status !== 404) return fail("cleanup_failed");

  return { ok: true, deletedRecipes: typeof deleted === "number" ? deleted : 0 };
}
