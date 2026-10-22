import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { joinSchema } from "./schemas";
import { hashInviteToken, isInviteTokenFormat } from "./token";

export type RedeemInviteFailure = "invalid_input" | "invalid_invite" | "email_taken" | "error";

export type RedeemInviteResult =
  | { ok: true; userId: string }
  | { ok: false; reason: RedeemInviteFailure };

const fail = (reason: RedeemInviteFailure): RedeemInviteResult => ({ ok: false, reason });

async function isUsable(tokenHash: string): Promise<boolean | null> {
  const { data, error } = await createAdminClient()
    .from("invites")
    .select("id")
    .eq("token_hash", tokenHash)
    .is("used_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) return null;
  return data !== null;
}

/** Whether an invite link can still be used. The redeem_invite function stays the authority. */
export async function getInviteState(token: string): Promise<"valid" | "invalid"> {
  if (!isInviteTokenFormat(token)) return "invalid";
  return (await isUsable(hashInviteToken(token))) ? "valid" : "invalid";
}

/**
 * Creates the invitee's account and joins it to the cookbook through a one-time invite.
 * Safe to repeat or race: the database lets exactly one redemption use the invite, and a
 * losing attempt deletes the account it just created so its email stays free.
 * No email is ever sent (D-29, D-30).
 */
export async function redeemInvite(input: {
  token: unknown;
  email: unknown;
  password: unknown;
  locale: unknown;
}): Promise<RedeemInviteResult> {
  const parsed = joinSchema.safeParse(input);
  if (!parsed.success) return fail("invalid_input");
  const { email, password, locale } = parsed.data;

  if (!isInviteTokenFormat(input.token)) return fail("invalid_invite");
  const tokenHash = hashInviteToken(input.token);

  // Checked before creating an account so a dead link never leaves an orphaned user.
  const usable = await isUsable(tokenHash);
  if (usable === null) return fail("error");
  if (!usable) return fail("invalid_invite");

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    if (createError?.code === "email_exists" || createError?.code === "user_already_exists") {
      return fail("email_taken");
    }
    if (createError?.code === "weak_password" || createError?.code === "validation_failed") {
      return fail("invalid_input");
    }
    return fail("error");
  }
  const userId = created.user.id;

  const { error: redeemError } = await admin.rpc("redeem_invite", {
    p_token_hash: tokenHash,
    p_user_id: userId,
    p_email: email,
    p_locale: locale,
  });
  if (redeemError) {
    await admin.auth.admin.deleteUser(userId);
    return fail(redeemError.message.includes("invite_invalid") ? "invalid_invite" : "error");
  }

  return { ok: true, userId };
}
