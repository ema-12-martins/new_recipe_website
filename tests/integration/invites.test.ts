import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { redeemInvite } from "@/lib/invites/redeem";
import { generateInviteToken, hashInviteToken } from "@/lib/invites/token";

import {
  adminClient,
  anonClient,
  createTestUser,
  listAllUsers,
  resetDatabase,
  userClient,
} from "../helpers/supabase-admin";

const PASSWORD = "Receitas-Convite-2026";
const OWNER = "owner@example.com";

async function cookbookId(): Promise<string> {
  const { data, error } = await adminClient().from("cookbooks").select("id").single();
  if (error) throw error;
  return data.id;
}

/** Creates an invite through the owner's own client (owner RLS) and returns its id and token. */
async function ownerCreatesInvite(owner: SupabaseClient, label: string | null = null) {
  const token = generateInviteToken();
  const { data, error } = await owner
    .from("invites")
    .insert({ cookbook_id: await cookbookId(), token_hash: hashInviteToken(token), label })
    .select("id")
    .single();
  if (error) throw error;
  return { id: data.id as string, token };
}

async function inviteRow(id: string) {
  const { data, error } = await adminClient()
    .from("invites")
    .select("used_at, used_by, revoked_at")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

async function memberCount(): Promise<number> {
  const { count, error } = await adminClient()
    .from("memberships")
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

const join = (token: string, email: string) =>
  redeemInvite({ token, email, password: PASSWORD, locale: "en" });

describe("invites (hosted DEV project)", () => {
  let owner: SupabaseClient;

  beforeEach(async () => {
    await resetDatabase();
    await createTestUser({ email: OWNER, password: PASSWORD, role: "owner" });
    owner = await userClient(OWNER, PASSWORD);
  });

  afterAll(async () => {
    await resetDatabase();
  });

  it("redeems an invite once; using it twice creates no second account", async () => {
    const { id, token } = await ownerCreatesInvite(owner, "Tia Rosa");
    const usersBefore = (await listAllUsers()).length;

    const first = await join(token, "tia@example.com");
    expect(first.ok).toBe(true);
    const second = await join(token, "primo@example.com");
    expect(second).toEqual({ ok: false, reason: "invalid_invite" });

    expect((await listAllUsers()).length).toBe(usersBefore + 1);
    const { data: membership } = await adminClient()
      .from("memberships")
      .select("role, email, locale")
      .eq("user_id", first.ok ? first.userId : "")
      .single();
    expect(membership).toEqual({ role: "member", email: "tia@example.com", locale: "en" });
    expect((await inviteRow(id)).used_by).toBe(first.ok ? first.userId : null);
  });

  it("lets exactly one of two concurrent redemptions win and frees the loser's email", async () => {
    const { token } = await ownerCreatesInvite(owner);
    const membersBefore = await memberCount();
    const emails = ["racer-a@example.com", "racer-b@example.com"];

    const results = await Promise.all(emails.map((email) => join(token, email)));

    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok)).toEqual([{ ok: false, reason: "invalid_invite" }]);
    expect(await memberCount()).toBe(membersBefore + 1);
    const loserEmail = emails[results.findIndex((r) => !r.ok)];
    expect((await listAllUsers()).map((u) => u.email)).not.toContain(loserEmail);
  });

  it("rejects an expired invite and creates no account", async () => {
    const { id, token } = await ownerCreatesInvite(owner);
    const { error } = await adminClient()
      .from("invites")
      .update({ expires_at: new Date(Date.now() - 60_000).toISOString() })
      .eq("id", id);
    expect(error).toBeNull();
    const usersBefore = (await listAllUsers()).length;

    expect(await join(token, "late@example.com")).toEqual({ ok: false, reason: "invalid_invite" });
    expect((await listAllUsers()).length).toBe(usersBefore);
  });

  it("rejects a revoked invite, and revoking it again changes nothing", async () => {
    const { id, token } = await ownerCreatesInvite(owner);

    const { error: revokeError } = await owner.rpc("revoke_invite", { p_invite_id: id });
    expect(revokeError).toBeNull();
    const revokedAt = (await inviteRow(id)).revoked_at;
    expect(revokedAt).not.toBeNull();

    expect(await join(token, "revoked@example.com")).toEqual({
      ok: false,
      reason: "invalid_invite",
    });
    expect((await listAllUsers()).map((u) => u.email)).not.toContain("revoked@example.com");

    const { error: againError } = await owner.rpc("revoke_invite", { p_invite_id: id });
    expect(againError).toBeNull();
    expect((await inviteRow(id)).revoked_at).toBe(revokedAt);
  });

  it("does not revoke an invite that was already used", async () => {
    const { id, token } = await ownerCreatesInvite(owner);
    expect((await join(token, "used@example.com")).ok).toBe(true);

    const { error } = await owner.rpc("revoke_invite", { p_invite_id: id });
    expect(error).toBeNull();
    expect((await inviteRow(id)).revoked_at).toBeNull();
  });

  it("rejects a malformed or unknown token without creating an account", async () => {
    const usersBefore = (await listAllUsers()).length;
    expect(await join("not-a-token", "x@example.com")).toEqual({
      ok: false,
      reason: "invalid_invite",
    });
    expect(await join(generateInviteToken(), "y@example.com")).toEqual({
      ok: false,
      reason: "invalid_invite",
    });
    expect((await listAllUsers()).length).toBe(usersBefore);
  });

  it("reports email_taken for an existing account and leaves the invite unused", async () => {
    const { id, token } = await ownerCreatesInvite(owner);
    expect(await join(token, OWNER)).toEqual({ ok: false, reason: "email_taken" });
    expect((await inviteRow(id)).used_at).toBeNull();
  });

  it.each(["member", "none"] as const)(
    "gives a %s user no invite data and no way to create or revoke invites",
    async (role) => {
      const { id } = await ownerCreatesInvite(owner);
      const email = `${role}@example.com`;
      await createTestUser({ email, password: PASSWORD, role });
      const client = await userClient(email, PASSWORD);

      const { data: rows, error: selectError } = await client.from("invites").select("id");
      expect(selectError).toBeNull();
      expect(rows).toEqual([]);

      const { error: insertError } = await client.from("invites").insert({
        cookbook_id: await cookbookId(),
        token_hash: hashInviteToken(generateInviteToken()),
      });
      expect(insertError).not.toBeNull();

      const { error: revokeError } = await client.rpc("revoke_invite", { p_invite_id: id });
      expect(revokeError).not.toBeNull();
      expect((await inviteRow(id)).revoked_at).toBeNull();
    },
  );

  it("lets only the service role call redeem_invite", async () => {
    const { token } = await ownerCreatesInvite(owner);
    const args = {
      p_token_hash: hashInviteToken(token),
      p_user_id: crypto.randomUUID(),
      p_email: "sneaky@example.com",
      p_locale: "pt",
    };

    const { error: anonError } = await anonClient().rpc("redeem_invite", args);
    expect(anonError).not.toBeNull();
    const { error: ownerError } = await owner.rpc("redeem_invite", args);
    expect(ownerError).not.toBeNull();
  });
});
