import { describe, expect, it } from "vitest";

import { generateInviteToken, hashInviteToken, isInviteTokenFormat } from "@/lib/invites/token";

describe("invite tokens", () => {
  it("are 43 characters long", () => {
    expect(generateInviteToken()).toHaveLength(43);
  });

  it("use only the URL-safe base64 alphabet", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateInviteToken()).toMatch(/^[A-Za-z0-9_-]{43}$/);
    }
  });

  it("differ from one another", () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateInviteToken()));
    expect(tokens.size).toBe(100);
  });

  it("hash deterministically to 64 hex characters", () => {
    const token = generateInviteToken();
    const hash = hashInviteToken(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashInviteToken(token)).toBe(hash);
    expect(hashInviteToken(generateInviteToken())).not.toBe(hash);
  });

  it("recognise only the token format", () => {
    expect(isInviteTokenFormat(generateInviteToken())).toBe(true);
    expect(isInviteTokenFormat("short")).toBe(false);
    expect(isInviteTokenFormat(`${"a".repeat(42)}/`)).toBe(false);
    expect(isInviteTokenFormat(undefined)).toBe(false);
  });
});
