import { randomUUID } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { getMembershipStatus } from "@/lib/auth/membership";
import { redeemInvite } from "@/lib/invites/redeem";
import { generateInviteToken, hashInviteToken } from "@/lib/invites/token";
import { removeMember } from "@/lib/members/remove-member";

import {
  adminClient,
  anonClient,
  createTestUser,
  listAllUsers,
  requireEnv,
  resetDatabase,
  userClient,
} from "../helpers/supabase-admin";

const PASSWORD = "Receitas-Remocao-2026";
const OWNER = "owner@example.com";
const MEMBER = "member@example.com";
const OTHER = "other@example.com";

let cookbookId: string;
let ownerId: string;
let memberId: string;
let owner: SupabaseClient;
let member: SupabaseClient;

async function insertRecipe(client: SupabaseClient, title: string): Promise<string> {
  const id = randomUUID();
  const { error } = await client
    .from("recipes")
    .insert({ id, cookbook_id: cookbookId, title, ingredients: ["1 ovo"], steps: ["Bater."] });
  if (error) throw error;
  return id;
}

async function existingRecipeIds(): Promise<string[]> {
  const { data, error } = await adminClient().from("recipes").select("id");
  if (error) throw error;
  return data.map((row) => row.id as string).sort();
}

async function creatorOf(recipeId: string): Promise<string | null> {
  const { data, error } = await adminClient()
    .from("recipe_creators")
    .select("created_by")
    .eq("recipe_id", recipeId)
    .single();
  if (error) throw error;
  return data.created_by as string | null;
}

async function hasMembership(userId: string): Promise<boolean> {
  const { data, error } = await adminClient()
    .from("memberships")
    .select("user_id")
    .eq("user_id", userId);
  if (error) throw error;
  return data.length === 1;
}

/** A service-role factory whose account deletion always fails, to exercise the retry path. */
const failingAdmin = () =>
  ({
    auth: {
      admin: {
        deleteUser: async () => ({
          data: { user: null },
          error: { name: "AuthApiError", message: "simulated failure", status: 500 },
        }),
      },
    },
  }) as unknown as SupabaseClient;

describe("member removal (hosted DEV project)", () => {
  let memberKeep: string;
  let memberRemove: string;
  let ownerRecipe: string;

  beforeEach(async () => {
    await resetDatabase();
    ownerId = (await createTestUser({ email: OWNER, password: PASSWORD, role: "owner" })).id;
    memberId = (await createTestUser({ email: MEMBER, password: PASSWORD, role: "member" })).id;
    const { data, error } = await adminClient().from("cookbooks").select("id").single();
    if (error) throw error;
    cookbookId = data.id;

    owner = await userClient(OWNER, PASSWORD);
    member = await userClient(MEMBER, PASSWORD);
    memberKeep = await insertRecipe(member, "Bolo do membro");
    memberRemove = await insertRecipe(member, "Sopa do membro");
    ownerRecipe = await insertRecipe(owner, "Arroz da dona");
  });

  afterAll(async () => {
    await resetDatabase();
  });

  it("a member calling delete_member_recipes on another member gets not_owner and deletes nothing", async () => {
    const other = await createTestUser({ email: OTHER, password: PASSWORD, role: "member" });
    const otherRecipe = await insertRecipe(await userClient(OTHER, PASSWORD), "Pão do outro");
    const before = await existingRecipeIds();

    const { error } = await member.rpc("delete_member_recipes", {
      p_member: other.id,
      p_recipe_ids: [otherRecipe],
    });

    expect(error?.message).toContain("not_owner");
    expect(await existingRecipeIds()).toEqual(before);
  });

  it("the owner calling delete_member_recipes on themself gets cannot_remove_self", async () => {
    const { error } = await owner.rpc("delete_member_recipes", {
      p_member: ownerId,
      p_recipe_ids: [ownerRecipe],
    });

    expect(error?.message).toContain("cannot_remove_self");
    expect(await existingRecipeIds()).toContain(ownerRecipe);
  });

  it("ids of recipes the member did not create are ignored", async () => {
    const { data, error } = await owner.rpc("delete_member_recipes", {
      p_member: memberId,
      p_recipe_ids: [memberRemove, ownerRecipe],
    });

    expect(error).toBeNull();
    expect(data).toBe(1);
    expect(await existingRecipeIds()).toEqual([memberKeep, ownerRecipe].sort());
  });

  it("removeMember with a member's own client returns not_owner and changes nothing", async () => {
    const other = await createTestUser({ email: OTHER, password: PASSWORD, role: "member" });
    const before = await existingRecipeIds();

    const result = await removeMember(
      { memberId: other.id, removeRecipeIds: before },
      { client: member },
    );

    expect(result).toEqual({ ok: false, reason: "not_owner" });
    expect(await existingRecipeIds()).toEqual(before);
    expect(await hasMembership(other.id)).toBe(true);
  });

  it("the owner cannot remove themself through removeMember", async () => {
    const result = await removeMember(
      { memberId: ownerId, removeRecipeIds: [ownerRecipe] },
      { client: owner },
    );

    expect(result).toEqual({ ok: false, reason: "cannot_remove_self" });
    expect(await hasMembership(ownerId)).toBe(true);
  });

  it("removal deletes marked recipes, anonymizes kept ones and ends the member's access at once", async () => {
    const result = await removeMember(
      { memberId, removeRecipeIds: [memberRemove] },
      { client: owner },
    );

    expect(result).toEqual({ ok: true, deletedRecipes: 1 });
    expect(await existingRecipeIds()).toEqual([memberKeep, ownerRecipe].sort());
    expect(await creatorOf(memberKeep)).toBeNull();
    expect(await creatorOf(ownerRecipe)).toBe(ownerId);
    expect(await hasMembership(memberId)).toBe(false);
    expect((await listAllUsers()).some((user) => user.id === memberId)).toBe(false);

    // The removed member's still-held session reads nothing.
    const { data, error } = await member.from("recipes").select("id");
    expect(error).toBeNull();
    expect(data).toEqual([]);
    expect(await getMembershipStatus(member)).toEqual({ status: "none" });
  });

  it("repeating a removal returns already_removed and deletes nothing more", async () => {
    await removeMember({ memberId, removeRecipeIds: [memberRemove] }, { client: owner });
    const after = await existingRecipeIds();

    const again = await removeMember(
      { memberId, removeRecipeIds: [memberRemove, memberKeep] },
      { client: owner },
    );

    expect(again).toEqual({ ok: false, reason: "already_removed" });
    expect(await existingRecipeIds()).toEqual(after);
  });

  it("a failed account deletion returns cleanup_failed and a retry completes without extra deletions", async () => {
    const failed = await removeMember(
      { memberId, removeRecipeIds: [memberRemove] },
      { client: owner, createAdmin: failingAdmin },
    );

    expect(failed).toEqual({ ok: false, reason: "cleanup_failed" });
    expect(await hasMembership(memberId)).toBe(true);
    expect(await existingRecipeIds()).toEqual([memberKeep, ownerRecipe].sort());

    const retried = await removeMember(
      { memberId, removeRecipeIds: [memberRemove] },
      { client: owner },
    );

    expect(retried).toEqual({ ok: true, deletedRecipes: 0 });
    expect(await hasMembership(memberId)).toBe(false);
    expect(await existingRecipeIds()).toEqual([memberKeep, ownerRecipe].sort());
    expect(await creatorOf(memberKeep)).toBeNull();
  });

  it("after removal the same email can join again through a new invite", async () => {
    await removeMember({ memberId, removeRecipeIds: [] }, { client: owner });

    const token = generateInviteToken();
    const { error } = await owner
      .from("invites")
      .insert({ cookbook_id: cookbookId, token_hash: hashInviteToken(token), label: "Regresso" });
    if (error) throw error;

    const joined = await redeemInvite({ token, email: MEMBER, password: PASSWORD, locale: "pt" });
    expect(joined.ok).toBe(true);

    const rejoined = await userClient(MEMBER, PASSWORD);
    const status = await getMembershipStatus(rejoined);
    expect(status.status).toBe("member");
    // The kept recipe is shared with the returning member but no longer attributed to anyone.
    const { data } = await rejoined.from("recipes").select("id").eq("id", memberKeep);
    expect(data).toEqual([{ id: memberKeep }]);
    expect(await creatorOf(memberKeep)).toBeNull();
  });
});

describe("getMembershipStatus (D-34)", () => {
  beforeEach(async () => {
    await resetDatabase();
    await createTestUser({ email: OWNER, password: PASSWORD, role: "owner" });
    await createTestUser({ email: OTHER, password: PASSWORD, role: "none" });
  });

  afterAll(async () => {
    await resetDatabase();
  });

  it("reports member, none for a signed-out or membership-less caller, and unavailable when Supabase cannot answer", async () => {
    const asOwner = await getMembershipStatus(await userClient(OWNER, PASSWORD));
    expect(asOwner.status).toBe("member");
    expect(asOwner.status === "member" && asOwner.membership.role).toBe("owner");

    expect(await getMembershipStatus(anonClient())).toEqual({ status: "none" });
    expect(await getMembershipStatus(await userClient(OTHER, PASSWORD))).toEqual({
      status: "none",
    });

    // Signed in, then Supabase stops answering: an outage, never lost access.
    let outage: "none" | "network" | "auth5xx" | "rest" = "none";
    const flakyFetch: typeof fetch = (input, init) => {
      const url = String(input instanceof Request ? input.url : input);
      if (outage === "network") return Promise.reject(new TypeError("fetch failed"));
      if (outage === "auth5xx" && url.includes("/auth/v1/")) {
        return Promise.resolve(new Response("{}", { status: 500 }));
      }
      if (outage === "rest" && url.includes("/rest/v1/")) {
        return Promise.reject(new TypeError("fetch failed"));
      }
      return fetch(input, init);
    };
    const flaky = createClient(
      requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: flakyFetch } },
    );
    const { error } = await flaky.auth.signInWithPassword({ email: OWNER, password: PASSWORD });
    if (error) throw error;
    expect((await getMembershipStatus(flaky)).status).toBe("member");

    for (const kind of ["network", "auth5xx", "rest"] as const) {
      outage = kind;
      expect(await getMembershipStatus(flaky), kind).toEqual({ status: "unavailable" });
    }
  });
});
