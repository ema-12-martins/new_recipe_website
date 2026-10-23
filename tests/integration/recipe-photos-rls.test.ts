import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PHOTO_BUCKET } from "@/lib/photos/limits";
import { photoPath } from "@/lib/photos/paths";

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
const REMOVED = "removed@example.com";

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);

let cookbookId: string;
let recipeId: string;

const upload = (client: SupabaseClient, path: string, contentType = "image/jpeg") =>
  client.storage.from(PHOTO_BUCKET).upload(path, JPEG, { contentType, upsert: false });

function photoRow(recipe: string, photoId: string, position: number) {
  return {
    id: photoId,
    recipe_id: recipe,
    cookbook_id: cookbookId,
    position,
    object_path: photoPath(cookbookId, recipe, photoId),
  };
}

describe("recipe photos data boundary (hosted DEV project)", () => {
  beforeAll(async () => {
    await resetDatabase();
    await createTestUser({ email: OWNER, password: PASSWORD, role: "owner" });
    await createTestUser({ email: MEMBER, password: PASSWORD, role: "member" });
    await createTestUser({ email: OUTSIDER, password: PASSWORD, role: "none" });
    await createTestUser({ email: REMOVED, password: PASSWORD, role: "member" });

    const { data, error } = await adminClient().from("cookbooks").select("id").single();
    if (error) throw error;
    cookbookId = data.id;

    recipeId = randomUUID();
    const member = await userClient(MEMBER, PASSWORD);
    const { error: recipeError } = await member
      .from("recipes")
      .insert({
        id: recipeId,
        cookbook_id: cookbookId,
        title: "Com fotografias",
        ingredients: ["2 ovos"],
        steps: ["Bater."],
      });
    if (recipeError) throw recipeError;
  });

  afterAll(async () => {
    await resetDatabase();
  });

  it("a member can upload a photo and record it, but cannot read the bucket directly", async () => {
    const member = await userClient(MEMBER, PASSWORD);
    const photoId = randomUUID();
    const path = photoPath(cookbookId, recipeId, photoId);

    const stored = await upload(member, path);
    expect(stored.error).toBeNull();

    // Files are read by the application after it has checked membership (see the photo route).
    const listed = await adminClient().storage.from(PHOTO_BUCKET).list(`${cookbookId}/${recipeId}`);
    expect(listed.data?.map((file) => file.name)).toContain(`${photoId}.jpg`);
    expect((await member.storage.from(PHOTO_BUCKET).download(path)).error).not.toBeNull();
    const direct = await member.storage.from(PHOTO_BUCKET).list(`${cookbookId}/${recipeId}`);
    expect(direct.data ?? []).toEqual([]);

    const row = await member.from("recipe_photos").insert(photoRow(recipeId, photoId, 1));
    expect(row.error).toBeNull();
    const read = await member.from("recipe_photos").select("id").eq("recipe_id", recipeId);
    expect(read.data).toEqual([{ id: photoId }]);
  });

  it("anon clients cannot list, download, upload or read photo rows", async () => {
    const anon = anonClient();
    const [file] = (
      await adminClient().storage.from(PHOTO_BUCKET).list(`${cookbookId}/${recipeId}`)
    ).data!;
    const path = `${cookbookId}/${recipeId}/${file.name}`;

    const listed = await anon.storage.from(PHOTO_BUCKET).list(`${cookbookId}/${recipeId}`);
    expect(listed.data ?? []).toEqual([]);
    expect((await anon.storage.from(PHOTO_BUCKET).download(path)).error).not.toBeNull();
    expect((await upload(anon, photoPath(cookbookId, recipeId, randomUUID()))).error).not.toBeNull();
    expect((await anon.from("recipe_photos").select("id")).data ?? []).toEqual([]);
  });

  it("a signed-in non-member cannot list, download, upload or read photo rows", async () => {
    const outsider = await userClient(OUTSIDER, PASSWORD);
    const [file] = (
      await adminClient().storage.from(PHOTO_BUCKET).list(`${cookbookId}/${recipeId}`)
    ).data!;

    const listed = await outsider.storage.from(PHOTO_BUCKET).list(`${cookbookId}/${recipeId}`);
    expect(listed.data ?? []).toEqual([]);
    const downloaded = await outsider.storage
      .from(PHOTO_BUCKET)
      .download(`${cookbookId}/${recipeId}/${file.name}`);
    expect(downloaded.error).not.toBeNull();
    expect(
      (await upload(outsider, photoPath(cookbookId, recipeId, randomUUID()))).error,
    ).not.toBeNull();
    expect((await outsider.from("recipe_photos").select("id")).data).toEqual([]);
  });

  it("a member cannot upload into another cookbook's folder or with another content type", async () => {
    const member = await userClient(MEMBER, PASSWORD);
    const foreign = await upload(member, photoPath(randomUUID(), recipeId, randomUUID()));
    expect(foreign.error).not.toBeNull();

    const wrongType = await upload(
      member,
      photoPath(cookbookId, recipeId, randomUUID()),
      "text/plain",
    );
    expect(wrongType.error).not.toBeNull();
  });

  it("rejects a photo row whose path does not match its ids", async () => {
    const member = await userClient(MEMBER, PASSWORD);
    const photoId = randomUUID();
    const { error } = await member
      .from("recipe_photos")
      .insert({ ...photoRow(recipeId, photoId, 2), object_path: `${cookbookId}/${recipeId}/other.jpg` });
    expect(error).not.toBeNull();
  });

  it("rejects a seventh photo for one recipe", async () => {
    const member = await userClient(MEMBER, PASSWORD);
    const rows = Array.from({ length: 5 }, (_, i) => photoRow(recipeId, randomUUID(), i + 2));
    expect((await member.from("recipe_photos").insert(rows)).error).toBeNull();

    const seventh = await member.from("recipe_photos").insert(photoRow(recipeId, randomUUID(), 6));
    expect(seventh.error?.message).toContain("recipe_photo_limit");
  });

  it("a removed member can no longer upload or read photo rows, and never read the files directly", async () => {
    const removed = await userClient(REMOVED, PASSWORD);
    const photoId = randomUUID();
    const path = photoPath(cookbookId, recipeId, photoId);
    expect((await upload(removed, path)).error).toBeNull();
    // A direct read stays closed even right after an upload (a stale session must not read).
    expect((await removed.storage.from(PHOTO_BUCKET).download(path)).error).not.toBeNull();

    const { data: user } = await adminClient()
      .from("memberships")
      .select("user_id")
      .eq("email", REMOVED)
      .single();
    const { error } = await adminClient().from("memberships").delete().eq("user_id", user!.user_id);
    expect(error).toBeNull();

    expect((await removed.storage.from(PHOTO_BUCKET).download(path)).error).not.toBeNull();
    expect((await upload(removed, photoPath(cookbookId, recipeId, randomUUID()))).error).not.toBeNull();
    expect((await removed.from("recipe_photos").select("id")).data ?? []).toEqual([]);
  });
});
