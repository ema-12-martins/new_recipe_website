import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PHOTO_BUCKET } from "@/lib/photos/limits";
import { photoPath } from "@/lib/photos/paths";
import { createRecipeWithPhotos } from "@/lib/recipes/create-recipe";

import { adminClient, createTestUser, resetDatabase, userClient } from "../helpers/supabase-admin";

const PASSWORD = "Receitas-2026";
const MEMBER = "member@example.com";
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);

let cookbookId: string;

async function member() {
  return userClient(MEMBER, PASSWORD);
}

async function uploadAll(recipeId: string, photoIds: string[]) {
  const client = await member();
  for (const id of photoIds) {
    const { error } = await client.storage
      .from(PHOTO_BUCKET)
      .upload(photoPath(cookbookId, recipeId, id), JPEG, { contentType: "image/jpeg" });
    expect(error).toBeNull();
  }
}

async function counts(recipeId: string) {
  const admin = adminClient();
  const recipes = await admin.from("recipes").select("id", { count: "exact", head: true }).eq("id", recipeId);
  const photos = await admin
    .from("recipe_photos")
    .select("id", { count: "exact", head: true })
    .eq("recipe_id", recipeId);
  return { recipes: recipes.count, photos: photos.count };
}

const input = (id: string) => ({
  id,
  title: "Bolo de laranja",
  ingredients: ["1/2 chÃ¡vena de aÃ§Ãºcar"],
  steps: ["Assar a 180 Â°C."],
});

describe("saving a recipe with photos (hosted DEV project)", () => {
  beforeAll(async () => {
    await resetDatabase();
    await createTestUser({ email: "owner@example.com", password: PASSWORD, role: "owner" });
    await createTestUser({ email: MEMBER, password: PASSWORD, role: "member" });
    const { data, error } = await adminClient().from("cookbooks").select("id").single();
    if (error) throw error;
    cookbookId = data.id;
  });

  afterAll(async () => {
    await resetDatabase();
  });

  it("saves the recipe and one row per photo, in order", async () => {
    const recipeId = randomUUID();
    const photoIds = [randomUUID(), randomUUID()];
    await uploadAll(recipeId, photoIds);

    const result = await createRecipeWithPhotos(await member(), cookbookId, input(recipeId), photoIds, adminClient());
    expect(result).toMatchObject({ ok: true, created: true });

    const { data } = await adminClient()
      .from("recipe_photos")
      .select("id, position")
      .eq("recipe_id", recipeId)
      .order("position");
    expect(data).toEqual([
      { id: photoIds[0], position: 1 },
      { id: photoIds[1], position: 2 },
    ]);
  });

  it("repeating the same save, as a retry would, leaves one recipe and one row per photo", async () => {
    const recipeId = randomUUID();
    const photoIds = Array.from({ length: 6 }, () => randomUUID());
    await uploadAll(recipeId, photoIds);

    const first = await createRecipeWithPhotos(await member(), cookbookId, input(recipeId), photoIds, adminClient());
    const second = await createRecipeWithPhotos(await member(), cookbookId, input(recipeId), photoIds, adminClient());
    expect(first).toMatchObject({ ok: true, created: true });
    expect(second).toMatchObject({ ok: true, created: false });
    expect(await counts(recipeId)).toEqual({ recipes: 1, photos: 6 });
  });

  it("a retry after a partial failure adds only the rows that are missing", async () => {
    const recipeId = randomUUID();
    const photoIds = [randomUUID(), randomUUID(), randomUUID()];
    await uploadAll(recipeId, photoIds);

    await createRecipeWithPhotos(await member(), cookbookId, input(recipeId), photoIds, adminClient());
    await adminClient().from("recipe_photos").delete().eq("id", photoIds[2]);

    const retry = await createRecipeWithPhotos(await member(), cookbookId, input(recipeId), photoIds, adminClient());
    expect(retry.ok).toBe(true);
    expect(await counts(recipeId)).toEqual({ recipes: 1, photos: 3 });
  });

  it("writes nothing when a photo file is missing from storage", async () => {
    const recipeId = randomUUID();
    const photoIds = [randomUUID(), randomUUID()];
    await uploadAll(recipeId, [photoIds[0]]);

    const result = await createRecipeWithPhotos(await member(), cookbookId, input(recipeId), photoIds, adminClient());
    expect(result).toEqual({ ok: false, reason: "photos_missing" });
    expect(await counts(recipeId)).toEqual({ recipes: 0, photos: 0 });
  });

  it("a recipe without photos saves exactly as before", async () => {
    const recipeId = randomUUID();
    const result = await createRecipeWithPhotos(await member(), cookbookId, input(recipeId), [], adminClient());
    expect(result).toMatchObject({ ok: true, created: true });
    expect(await counts(recipeId)).toEqual({ recipes: 1, photos: 0 });
  });
});
