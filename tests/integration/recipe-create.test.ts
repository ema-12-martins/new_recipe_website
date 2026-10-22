import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createRecipe } from "@/lib/recipes/create-recipe";
import type { RecipeInput } from "@/lib/recipes/schema";

import { adminClient, createTestUser, resetDatabase, userClient } from "../helpers/supabase-admin";

const PASSWORD = "Receitas-2026";

let cookbookId: string;

function input(id: string, title: string): RecipeInput {
  return {
    id,
    title,
    ingredients: ["½ chávena de açúcar", "1 1/2 cups flour"],
    steps: ["Pré-aquecer o forno a 180 °C."],
  };
}

async function rowsWithId(id: string) {
  const { data, error } = await adminClient().from("recipes").select("id, title").eq("id", id);
  if (error) throw error;
  return data;
}

describe("createRecipe (hosted DEV project)", () => {
  beforeAll(async () => {
    await resetDatabase();
    await createTestUser({ email: "owner@example.com", password: PASSWORD, role: "owner" });
    await createTestUser({ email: "member@example.com", password: PASSWORD, role: "member" });
    const { data, error } = await adminClient().from("cookbooks").select("id").single();
    if (error) throw error;
    cookbookId = data.id;
  });

  afterAll(async () => {
    await resetDatabase();
  });

  it("submitting the same form id twice creates exactly one recipe", async () => {
    const member = await userClient("member@example.com", PASSWORD);
    const id = randomUUID();

    const first = await createRecipe(member, cookbookId, input(id, "Arroz doce"));
    expect(first).toEqual({ ok: true, id, created: true });

    const second = await createRecipe(member, cookbookId, input(id, "Arroz doce"));
    expect(second).toEqual({ ok: true, id, created: false });

    expect(await rowsWithId(id)).toEqual([{ id, title: "Arroz doce" }]);
  });

  it("two concurrent submits with the same id create exactly one recipe", async () => {
    const member = await userClient("member@example.com", PASSWORD);
    const id = randomUUID();

    const results = await Promise.all([
      createRecipe(member, cookbookId, input(id, "Leite creme")),
      createRecipe(member, cookbookId, input(id, "Leite creme")),
    ]);

    expect(results.every((result) => result.ok)).toBe(true);
    expect(results.filter((result) => result.ok && result.created)).toHaveLength(1);
    expect(await rowsWithId(id)).toHaveLength(1);
  });
});
