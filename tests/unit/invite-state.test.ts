import { beforeEach, describe, expect, it, vi } from "vitest";

import { getInviteState } from "@/lib/invites/redeem";
import { generateInviteToken, hashInviteToken } from "@/lib/invites/token";

const mocks = vi.hoisted(() => ({
  maybeSingle: vi.fn(),
  eq: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: mocks.eq,
      }),
    }),
  }),
}));

describe("invite availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.eq.mockReturnValue({
      is: () => ({
        is: () => ({
          gt: () => ({ maybeSingle: mocks.maybeSingle }),
        }),
      }),
    });
  });

  it("accepts an unused, unrevoked, unexpired invite by its token hash", async () => {
    const token = generateInviteToken();
    mocks.maybeSingle.mockResolvedValue({ data: { id: "invite" }, error: null });
    expect(await getInviteState(token)).toBe("valid");
    expect(mocks.eq).toHaveBeenCalledWith("token_hash", hashInviteToken(token));
  });

  it("rejects an absent invite", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await getInviteState(generateInviteToken())).toBe("invalid");
  });

  it("rejects malformed links without a database query", async () => {
    expect(await getInviteState("not-a-token")).toBe("invalid");
    expect(mocks.eq).not.toHaveBeenCalled();
  });

  it("reports a lookup failure as unavailable, not an invalid invite", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      mocks.maybeSingle.mockResolvedValue({
        data: null,
        error: { code: "42501", message: "permission denied" },
        status: 403,
      });
      expect(await getInviteState(generateInviteToken())).toBe("unavailable");
      expect(log).toHaveBeenCalledWith("Invite availability lookup failed.", {
        code: "42501",
        status: 403,
      });
    } finally {
      log.mockRestore();
    }
  });
});
