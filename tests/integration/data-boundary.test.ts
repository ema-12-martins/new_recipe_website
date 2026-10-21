import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  adminClient,
  anonClient,
  createTestUser,
  listAllUsers,
  requireEnv,
  resetDatabase,
  userClient,
} from "../helpers/supabase-admin";

const PASSWORD = "Correct-Horse-42";
const OWNER = { email: "owner@example.com", password: PASSWORD };
const OUTSIDER = { email: "outsider@example.com", password: PASSWORD };

async function authSettings() {
  const response = await fetch(`${requireEnv("NEXT_PUBLIC_SUPABASE_URL")}/auth/v1/settings`, {
    headers: { apikey: requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") },
  });
  expect(response.ok).toBe(true);
  return (await response.json()) as { disable_signup: boolean; mailer_autoconfirm: boolean };
}

describe("data boundary (hosted DEV project)", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
  });

  it("has public sign-ups and email confirmation turned off in Auth settings", async () => {
    const settings = await authSettings();
    expect(settings.disable_signup).toBe(true);
    expect(settings.mailer_autoconfirm).toBe(true);
  });

  it("refuses a public sign-up and creates no account", async () => {
    // Guard: never attempt a sign-up that could create an account or send an email.
    expect((await authSettings()).disable_signup).toBe(true);

    // Real-looking domain: hosted Auth rejects reserved domains (example.com) before the sign-up gate.
    const email = `signup-probe-${Date.now()}@gmail.com`;
    const { data, error } = await anonClient().auth.signUp({
      email,
      password: "Abcdefgh1234",
    });

    const created = (await listAllUsers()).find((u) => u.email === email);
    if (created) {
      await adminClient().auth.admin.deleteUser(created.id);
    }

    console.info(`sign-up rejection: code=${error?.code} status=${error?.status}`);
    expect(error).not.toBeNull();
    expect(error?.code).toBe("signup_disabled");
    expect(data.user).toBeNull();
    expect(created).toBeUndefined();
  });

  it("reports no cookbook on an empty database without signing in", async () => {
    const { data, error } = await anonClient().rpc("cookbook_exists");
    expect(error).toBeNull();
    expect(data).toBe(false);
  });

  it("hides the cookbook and memberships from anonymous and non-member users", async () => {
    await createTestUser({ ...OWNER, role: "owner" });
    await createTestUser({ ...OUTSIDER, role: "none" });

    const anon = anonClient();
    const { data: exists, error: existsError } = await anon.rpc("cookbook_exists");
    expect(existsError).toBeNull();
    expect(exists).toBe(true);

    const outsider = await userClient(OUTSIDER.email, OUTSIDER.password);
    for (const client of [anon, outsider]) {
      for (const table of ["cookbooks", "memberships"]) {
        const { data, error } = await client.from(table).select("*");
        expect(error).toBeNull();
        expect(data).toEqual([]);
      }
    }
  });

  it("denies claim_owner to anonymous and non-member users", async () => {
    const outsider = await userClient(OUTSIDER.email, OUTSIDER.password);
    const {
      data: { user },
    } = await outsider.auth.getUser();

    for (const client of [anonClient(), outsider]) {
      const { data, error } = await client.rpc("claim_owner", {
        p_user_id: user!.id,
        p_email: OUTSIDER.email,
        p_locale: "pt",
      });
      expect(data).toBeNull();
      expect(error?.code).toBe("42501");
    }
  });

  it("lets the owner read exactly the cookbook and their own membership", async () => {
    const owner = await userClient(OWNER.email, OWNER.password);

    const { data: cookbooks, error: cookbooksError } = await owner.from("cookbooks").select("id");
    expect(cookbooksError).toBeNull();
    expect(cookbooks).toHaveLength(1);

    const { data: memberships, error: membershipsError } = await owner
      .from("memberships")
      .select("email, role, cookbook_id");
    expect(membershipsError).toBeNull();
    expect(memberships).toEqual([
      { email: OWNER.email, role: "owner", cookbook_id: cookbooks![0].id },
    ]);
  });
});
