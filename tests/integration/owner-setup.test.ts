import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { setupOwner } from "@/lib/auth/setup-owner";

import { adminClient, listAllUsers, requireEnv, resetDatabase } from "../helpers/supabase-admin";

const PASSWORD = "Receitas-2026";

function input(email: string, setupCode = requireEnv("OWNER_SETUP_CODE")) {
  return { email, password: PASSWORD, setupCode, locale: "pt" as const };
}

async function counts() {
  const admin = adminClient();
  const { count: cookbooks } = await admin
    .from("cookbooks")
    .select("*", { count: "exact", head: true });
  const { count: owners } = await admin
    .from("memberships")
    .select("*", { count: "exact", head: true })
    .eq("role", "owner");
  return { cookbooks, owners, users: (await listAllUsers(admin)).length };
}

describe("setupOwner (hosted DEV project)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
  });

  it("rejects a wrong setup code without creating an account", async () => {
    const result = await setupOwner(input("owner@example.com", "wrong-code"));
    expect(result).toEqual({ ok: false, reason: "invalid_code" });
    expect(await counts()).toEqual({ cookbooks: 0, owners: 0, users: 0 });
  });

  it("rejects invalid input without creating an account", async () => {
    const result = await setupOwner({ ...input("owner@example.com"), password: "short" });
    expect(result).toEqual({ ok: false, reason: "invalid_input" });
    expect(await counts()).toEqual({ cookbooks: 0, owners: 0, users: 0 });
  });

  it("creates exactly one owner, and a repeat creates nothing more", async () => {
    const first = await setupOwner(input("owner@example.com"));
    expect(first.ok).toBe(true);
    expect(await counts()).toEqual({ cookbooks: 1, owners: 1, users: 1 });

    const second = await setupOwner(input("second@example.com"));
    expect(second).toEqual({ ok: false, reason: "already_set_up" });
    expect(await counts()).toEqual({ cookbooks: 1, owners: 1, users: 1 });
  });

  it("lets exactly one of two concurrent setups win and frees the loser's email", async () => {
    const emails = ["racer-a@example.com", "racer-b@example.com"];
    const results = await Promise.all(emails.map((email) => setupOwner(input(email))));

    const winners = results.filter((r) => r.ok);
    const losers = results.filter((r) => !r.ok);
    expect(winners).toHaveLength(1);
    expect(losers).toEqual([{ ok: false, reason: "already_set_up" }]);
    expect(await counts()).toEqual({ cookbooks: 1, owners: 1, users: 1 });

    const loserEmail = emails[results.findIndex((r) => !r.ok)];
    const remaining = (await listAllUsers()).map((u) => u.email);
    expect(remaining).not.toContain(loserEmail);
  });

  it("reports email_taken for an existing account and creates no cookbook", async () => {
    const { error } = await adminClient().auth.admin.createUser({
      email: "taken@example.com",
      password: PASSWORD,
      email_confirm: true,
    });
    expect(error).toBeNull();

    const result = await setupOwner(input("taken@example.com"));
    expect(result).toEqual({ ok: false, reason: "email_taken" });
    expect(await counts()).toEqual({ cookbooks: 0, owners: 0, users: 1 });
  });
});
