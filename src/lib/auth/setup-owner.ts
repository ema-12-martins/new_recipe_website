import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

import { ownerSetupSchema } from "./schemas";

export type SetupOwnerFailure =
  | "invalid_input"
  | "invalid_code"
  | "already_set_up"
  | "email_taken"
  | "error";

export type SetupOwnerResult = { ok: true; userId: string } | { ok: false; reason: SetupOwnerFailure };

const fail = (reason: SetupOwnerFailure): SetupOwnerResult => ({ ok: false, reason });

function setupCodeMatches(given: string): boolean {
  const expected = process.env.OWNER_SETUP_CODE;
  if (!expected) return false;
  // Equal-length digests let timingSafeEqual compare codes of any length.
  const givenDigest = createHash("sha256").update(given).digest();
  const expectedDigest = createHash("sha256").update(expected).digest();
  return timingSafeEqual(givenDigest, expectedDigest);
}

/**
 * Creates the first account and makes it the single owner of the family cookbook.
 * Safe to repeat or race: the database allows one cookbook and one owner, and a
 * losing attempt deletes the account it just created so its email stays free.
 * No email is ever sent (D-29, D-30).
 */
export async function setupOwner(input: unknown): Promise<SetupOwnerResult> {
  const parsed = ownerSetupSchema.safeParse(input);
  if (!parsed.success) return fail("invalid_input");
  const { email, password, setupCode, locale } = parsed.data;

  if (!setupCodeMatches(setupCode)) return fail("invalid_code");

  const admin = createAdminClient();

  const { data: exists, error: existsError } = await admin.rpc("cookbook_exists");
  if (existsError) return fail("error");
  if (exists) return fail("already_set_up");

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

  const { error: claimError } = await admin.rpc("claim_owner", {
    p_user_id: userId,
    p_email: email,
    p_locale: locale,
  });
  if (claimError) {
    await admin.auth.admin.deleteUser(userId);
    return fail(claimError.message.includes("cookbook_already_claimed") ? "already_set_up" : "error");
  }

  return { ok: true, userId };
}
