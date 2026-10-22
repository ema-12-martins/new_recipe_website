import {
  AuthApiError,
  AuthRetryableFetchError,
  AuthSessionMissingError,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { getMembershipStatus } from "@/lib/auth/membership";

const USER = { id: "8b0f5d0e-3a43-4c39-9a52-6f1c8c1d2b7e" };

type Scripted = {
  user?: typeof USER | null;
  userError?: unknown;
  row?: unknown;
  rowError?: unknown;
};

/** A stand-in for the user-scoped client: getUser plus the memberships select chain. */
function fakeClient({ user = USER, userError = null, row = null, rowError = null }: Scripted) {
  return {
    auth: {
      getUser: async () => ({ data: { user: userError ? null : user }, error: userError }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: row, error: rowError }) }),
      }),
    }),
  } as unknown as SupabaseClient;
}

describe("getMembershipStatus classification (D-34)", () => {
  it("treats a network failure on Auth as unavailable", async () => {
    const userError = new AuthRetryableFetchError("fetch failed", 0);
    expect(await getMembershipStatus(fakeClient({ userError }))).toEqual({
      status: "unavailable",
    });
  });

  it("treats an Auth 503 as unavailable", async () => {
    const userError = new AuthApiError("Service Unavailable", 503, undefined);
    expect(await getMembershipStatus(fakeClient({ userError }))).toEqual({
      status: "unavailable",
    });
  });

  it("treats a missing session as no access", async () => {
    const userError = new AuthSessionMissingError();
    expect(await getMembershipStatus(fakeClient({ userError }))).toEqual({ status: "none" });
  });

  it("treats the session of a deleted user as no access", async () => {
    const userError = new AuthApiError(
      "User from sub claim in JWT does not exist",
      403,
      "user_not_found",
    );
    expect(await getMembershipStatus(fakeClient({ userError }))).toEqual({ status: "none" });
  });

  it("treats a failed membership query as unavailable", async () => {
    const rowError = { message: "TypeError: fetch failed", details: "", hint: "", code: "" };
    expect(await getMembershipStatus(fakeClient({ rowError }))).toEqual({
      status: "unavailable",
    });
  });

  it("treats a signed-in user without a membership row as no access", async () => {
    expect(await getMembershipStatus(fakeClient({ row: null }))).toEqual({ status: "none" });
  });

  it("returns the membership for a member", async () => {
    const row = {
      role: "member",
      locale: "en",
      cookbook_id: "c6a1f9a4-0d6e-4f53-8f8e-2f4b9a3e1c55",
      cookbooks: { name: "Receitas da Avó" },
    };
    expect(await getMembershipStatus(fakeClient({ row }))).toEqual({
      status: "member",
      membership: {
        userId: USER.id,
        role: "member",
        locale: "en",
        cookbookId: row.cookbook_id,
        cookbookName: "Receitas da Avó",
      },
    });
  });
});
