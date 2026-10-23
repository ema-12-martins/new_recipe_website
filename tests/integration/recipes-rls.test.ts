import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  adminClient,
  anonClient,
  createTestUser,
  resetDatabase,
  userClient,
} from "../helpers/supabase-admin";

const PASSWORD = "Receitas-2026";
const OWNER = "owner@example.com";
const MEMBER = "member@example.com";
const OUTSIDER = "outsider@example.com";

let cookbookId: string;
let memberId: string;
let ownerRecipeId: string;
let memberRecipeId: string;

async function insertRecipe(client: SupabaseClient, title: string) {
  const id = randomUUID();
  const result = await client
    .from("recipes")
    .insert({ id, cookbook_id: cookbookId, title, ingredients: ["1 ovo"], steps: ["Bater."] });
  return { id, ...result };
}

async function recipeExists(id: string) {
  const { data, error } = await adminClient().from("recipes").select("id").eq("id", id);
  if (error) throw error;
  return data.length === 1;
}

describe("recipes data boundary (hosted DEV project)", () => {
  beforeAll(async () => {
    await resetDatabase();
    await createTestUser({ email: OWNER, password: PASSWORD, role: "owner" });
    memberId = (await createTestUser({ email: MEMBER, password: PASSWORD, role: "member" })).id;
    await createTestUser({ email: OUTSIDER, password: PASSWORD, role: "none" });

    const { data, error } = await adminClient().from("cookbooks").select("id").single();
    if (error) throw error;
    cookbookId = data.id;

    const owner = await insertRecipe(await userClient(OWNER, PASSWORD), "Receita da dona");
    expect(owner.error).toBeNull();
    ownerRecipeId = owner.id;
    const member = await insertRecipe(await userClient(MEMBER, PASSWORD), "Receita do membro");
    expect(member.error).toBeNull();
    memberRecipeId = member.id;
  });

  afterAll(async () => {
    await resetDatabase();
  });

  it("a member cannot store a recipe without an ingredient or a step", async () => {
    const member = await userClient(MEMBER, PASSWORD);
    for (const lines of [
      { ingredients: [], steps: ["Bater."] },
      { ingredients: ["1 ovo"], steps: [] },
      { ingredients: [" \t"], steps: ["Bater."] },
    ]) {
      const id = randomUUID();
      const { error } = await member
        .from("recipes")
        .insert({ id, cookbook_id: cookbookId, title: "Incompleta", ...lines });
      expect(error?.code).toBe("23514");
      expect(await recipeExists(id)).toBe(false);
    }

    const { error } = await member.from("recipes").update({ steps: [] }).eq("id", memberRecipeId);
    expect(error?.code).toBe("23514");
  });

  it("anon clients read zero recipes and cannot insert", async () => {
    const anon = anonClient();
    const { data, error } = await anon.from("recipes").select("id");
    expect(error).toBeNull();
    expect(data).toEqual([]);

    const insert = await insertRecipe(anon, "Anónima");
    expect(insert.error).not.toBeNull();
    expect(await recipeExists(insert.id)).toBe(false);
  });

  it("a signed-in non-member reads zero recipes and is refused by RLS on insert", async () => {
    const outsider = await userClient(OUTSIDER, PASSWORD);
    const { data, error } = await outsider.from("recipes").select("id");
    expect(error).toBeNull();
    expect(data).toEqual([]);

    const insert = await insertRecipe(outsider, "De fora");
    expect(insert.error?.code).toBe("42501");
    expect(await recipeExists(insert.id)).toBe(false);
  });

  it("a member reads every cookbook recipe, adds one, and edits another member's recipe", async () => {
    const member = await userClient(MEMBER, PASSWORD);

    const { data: visible, error } = await member.from("recipes").select("id");
    expect(error).toBeNull();
    expect(visible?.map((r) => r.id).sort()).toEqual([ownerRecipeId, memberRecipeId].sort());

    const added = await insertRecipe(member, "Mais uma");
    expect(added.error).toBeNull();
    expect(await recipeExists(added.id)).toBe(true);

    const { data: updated, error: updateError } = await member
      .from("recipes")
      .update({ title: "Receita da dona (editada)", steps: ["Bater bem."] })
      .eq("id", ownerRecipeId)
      .select("title, steps, version");
    expect(updateError).toBeNull();
    expect(updated).toEqual([
      { title: "Receita da dona (editada)", steps: ["Bater bem."], version: 2 },
    ]);
  });

  it("delete by a member or the owner affects 0 rows and the recipe remains", async () => {
    for (const email of [MEMBER, OWNER]) {
      const client = await userClient(email, PASSWORD);
      const { error, count } = await client
        .from("recipes")
        .delete({ count: "exact" })
        .eq("id", memberRecipeId);
      expect(error).toBeNull();
      expect(count).toBe(0);
    }
    expect(await recipeExists(memberRecipeId)).toBe(true);
  });

  it("recipe_creators is hidden from members and readable by the owner", async () => {
    const member = await userClient(MEMBER, PASSWORD);
    const { data: memberView, error: memberError } = await member
      .from("recipe_creators")
      .select("recipe_id, created_by");
    expect(memberError).toBeNull();
    expect(memberView).toEqual([]);

    const owner = await userClient(OWNER, PASSWORD);
    const { data: ownerView, error: ownerError } = await owner
      .from("recipe_creators")
      .select("recipe_id, created_by")
      .eq("recipe_id", memberRecipeId);
    expect(ownerError).toBeNull();
    expect(ownerView).toEqual([{ recipe_id: memberRecipeId, created_by: memberId }]);
  });

  it("a member cannot change a recipe's version, cookbook_id or id", async () => {
    const member = await userClient(MEMBER, PASSWORD);
    for (const change of [{ version: 99 }, { cookbook_id: randomUUID() }, { id: randomUUID() }]) {
      const { error } = await member.from("recipes").update(change).eq("id", memberRecipeId);
      expect(error?.code).toBe("42501");
    }
    const { data } = await adminClient()
      .from("recipes")
      .select("id, cookbook_id, version")
      .eq("id", memberRecipeId)
      .single();
    expect(data).toEqual({ id: memberRecipeId, cookbook_id: cookbookId, version: 1 });
  });

  it("operator deletion of a member's account keeps their recipe and anonymizes its creator", async () => {
    const admin = adminClient();
    const { error } = await admin.auth.admin.deleteUser(memberId);
    expect(error).toBeNull();

    expect(await recipeExists(memberRecipeId)).toBe(true);
    const { data: creator } = await admin
      .from("recipe_creators")
      .select("created_by")
      .eq("recipe_id", memberRecipeId)
      .single();
    expect(creator).toEqual({ created_by: null });
  });
});
