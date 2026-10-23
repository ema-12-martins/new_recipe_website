import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { applyPhotoChanges } from "@/lib/photos/apply-changes";
import { PHOTO_BUCKET } from "@/lib/photos/limits";
import { photoPath } from "@/lib/photos/paths";
import { createRecipeWithPhotos } from "@/lib/recipes/create-recipe";

import { adminClient, createTestUser, resetDatabase, userClient } from "../helpers/supabase-admin";

const PASSWORD = "Receitas-2026";
const OWNER = "owner@example.com";
const MEMBER = "member@example.com";
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);

let cookbookId: string;
// Signing in is rate limited by Supabase Auth, so each test user signs in once.
const clients: Record<string, SupabaseClient> = {};

async function upload(recipeId: string, id: string) {
  const { error } = await clients[MEMBER].storage
    .from(PHOTO_BUCKET)
    .upload(photoPath(cookbookId, recipeId, id), JPEG, { contentType: "image/jpeg" });
  expect(error).toBeNull();
}

/** A recipe written by the member with the given photos already saved. */
async function recipeWithPhotos(count: number) {
  const recipeId = randomUUID();
  const ids = Array.from({ length: count }, () => randomUUID());
  for (const id of ids) await upload(recipeId, id);
  const created = await createRecipeWithPhotos(
    clients[MEMBER],
    cookbookId,
    { id: recipeId, title: "Receita", ingredients: ["2 ovos"], steps: ["Bater."] },
    ids,
    adminClient(),
  );
  expect(created.ok).toBe(true);
  return { recipeId, ids };
}

async function apply(email: string, recipeId: string, order: string[]) {
  return applyPhotoChanges({
    client: clients[email],
    admin: adminClient(),
    cookbookId,
    recipeId,
    order,
  });
}

async function stored(recipeId: string) {
  const { data } = await adminClient()
    .from("recipe_photos")
    .select("id, position")
    .eq("recipe_id", recipeId)
    .order("position");
  return data ?? [];
}

async function files(recipeId: string) {
  const { data } = await adminClient().storage.from(PHOTO_BUCKET).list(`${cookbookId}/${recipeId}`);
  return (data ?? []).map((file) => file.name).sort();
}

describe("editing a recipe's photos (hosted DEV project)", () => {
  beforeAll(async () => {
    await resetDatabase();
    await createTestUser({ email: OWNER, password: PASSWORD, role: "owner" });
    await createTestUser({ email: MEMBER, password: PASSWORD, role: "member" });
    const { data, error } = await adminClient().from("cookbooks").select("id").single();
    if (error) throw error;
    cookbookId = data.id;
    clients[OWNER] = await userClient(OWNER, PASSWORD);
    clients[MEMBER] = await userClient(MEMBER, PASSWORD);
  });

  afterAll(async () => {
    await resetDatabase();
  });

  it("reorders photos", async () => {
    const { recipeId, ids } = await recipeWithPhotos(3);
    expect((await apply(MEMBER, recipeId, [ids[2], ids[0], ids[1]])).ok).toBe(true);
    expect(await stored(recipeId)).toEqual([
      { id: ids[2], position: 1 },
      { id: ids[0], position: 2 },
      { id: ids[1], position: 3 },
    ]);
  });

  it("adds an uploaded photo at the front and renumbers", async () => {
    const { recipeId, ids } = await recipeWithPhotos(2);
    const added = randomUUID();
    await upload(recipeId, added);
    expect((await apply(MEMBER, recipeId, [added, ...ids])).ok).toBe(true);
    expect(await stored(recipeId)).toEqual([
      { id: added, position: 1 },
      { id: ids[0], position: 2 },
      { id: ids[1], position: 3 },
    ]);
  });

  it("removes a photo's row and its file", async () => {
    const { recipeId, ids } = await recipeWithPhotos(3);
    expect((await apply(MEMBER, recipeId, [ids[0], ids[2]])).ok).toBe(true);
    expect(await stored(recipeId)).toEqual([
      { id: ids[0], position: 1 },
      { id: ids[2], position: 2 },
    ]);
    expect(await files(recipeId)).toEqual([`${ids[0]}.jpg`, `${ids[2]}.jpg`].sort());
  });

  it("can remove every photo and keep the recipe", async () => {
    const { recipeId } = await recipeWithPhotos(2);
    expect((await apply(MEMBER, recipeId, [])).ok).toBe(true);
    expect(await stored(recipeId)).toEqual([]);
    const { data } = await adminClient().from("recipes").select("id").eq("id", recipeId);
    expect(data).toHaveLength(1);
  });

  it("lets another member edit the photos of a recipe they did not write", async () => {
    const { recipeId, ids } = await recipeWithPhotos(2);
    expect((await apply(OWNER, recipeId, [ids[1], ids[0]])).ok).toBe(true);
    expect((await stored(recipeId)).map((row) => row.id)).toEqual([ids[1], ids[0]]);
  });

  it("converges when the same change is applied twice", async () => {
    const { recipeId, ids } = await recipeWithPhotos(2);
    const added = randomUUID();
    await upload(recipeId, added);
    const order = [ids[1], added, ids[0]];
    expect((await apply(MEMBER, recipeId, order)).ok).toBe(true);
    expect((await apply(MEMBER, recipeId, order)).ok).toBe(true);
    expect((await stored(recipeId)).map((row) => row.id)).toEqual(order);
  });

  it("rejects a seventh photo and repeated ids", async () => {
    const { recipeId, ids } = await recipeWithPhotos(6);
    const extra = randomUUID();
    await upload(recipeId, extra);
    expect(await apply(MEMBER, recipeId, [...ids, extra])).toEqual({ ok: false, reason: "invalid" });
    expect(await apply(MEMBER, recipeId, [ids[0], ids[0]])).toEqual({ ok: false, reason: "invalid" });
    expect(await stored(recipeId)).toHaveLength(6);
  });

  it("does not take a photo that belongs to another recipe", async () => {
    const first = await recipeWithPhotos(1);
    const second = await recipeWithPhotos(1);
    const result = await apply(MEMBER, second.recipeId, [second.ids[0], first.ids[0]]);
    expect(result).toEqual({ ok: false, reason: "photos_missing" });
    expect(await stored(first.recipeId)).toEqual([{ id: first.ids[0], position: 1 }]);
    expect(await stored(second.recipeId)).toEqual([{ id: second.ids[0], position: 1 }]);
  });

  it("writes nothing when a new photo's file was never uploaded", async () => {
    const { recipeId, ids } = await recipeWithPhotos(1);
    const result = await apply(MEMBER, recipeId, [ids[0], randomUUID()]);
    expect(result).toEqual({ ok: false, reason: "photos_missing" });
    expect(await stored(recipeId)).toHaveLength(1);
  });
});
