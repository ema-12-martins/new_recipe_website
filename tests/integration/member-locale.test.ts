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
const OWNER = "owner-locale@example.com";
const MEMBER = "member-locale@example.com";

let ownerId: string;
let memberId: string;
let member: SupabaseClient;

async function storedLocale(userId: string): Promise<string> {
  const { data, error } = await adminClient()
    .from("memberships")
    .select("locale")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data.locale;
}

describe("set_my_locale (hosted DEV project)", () => {
  beforeAll(async () => {
    await resetDatabase();
    ownerId = (await createTestUser({ email: OWNER, password: PASSWORD, role: "owner" })).id;
    memberId = (await createTestUser({ email: MEMBER, password: PASSWORD, role: "member" })).id;
    member = await userClient(MEMBER, PASSWORD);
  });

  afterAll(async () => {
    await resetDatabase();
  });

  it("updates only the calling member's locale", async () => {
    const { error } = await member.rpc("set_my_locale", { p_locale: "en" });
    expect(error).toBeNull();
    expect(await storedLocale(memberId)).toBe("en");
    expect(await storedLocale(ownerId)).toBe("pt");

    const back = await member.rpc("set_my_locale", { p_locale: "pt" });
    expect(back.error).toBeNull();
    expect(await storedLocale(memberId)).toBe("pt");
  });

  it("rejects an unsupported locale and leaves the stored one unchanged", async () => {
    const { error } = await member.rpc("set_my_locale", { p_locale: "fr" });
    expect(error).not.toBeNull();
    expect(await storedLocale(memberId)).toBe("pt");
  });

  it("cannot be executed by anonymous visitors", async () => {
    const { error } = await anonClient().rpc("set_my_locale", { p_locale: "en" });
    expect(error).not.toBeNull();
    expect(await storedLocale(memberId)).toBe("pt");
    expect(await storedLocale(ownerId)).toBe("pt");
  });

  it("is the only client write path: a direct membership update changes nothing", async () => {
    await member.from("memberships").update({ locale: "en", role: "owner" }).eq("user_id", memberId);
    expect(await storedLocale(memberId)).toBe("pt");
    const { data, error } = await adminClient()
      .from("memberships")
      .select("role")
      .eq("user_id", memberId)
      .single();
    if (error) throw error;
    expect(data.role).toBe("member");
  });
});
