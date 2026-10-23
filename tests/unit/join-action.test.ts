import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthSessionMissingError } from "@supabase/supabase-js";

import { joinAction } from "@/app/[locale]/join/[token]/actions";
import en from "@/i18n/messages/en.json";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  signInWithPassword: vi.fn(),
  redeemInvite: vi.fn(),
  setCookie: vi.fn(),
  redirect: vi.fn((path: string): never => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("next/headers", () => ({ cookies: async () => ({ set: mocks.setCookie }) }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/invites/redeem", () => ({ redeemInvite: mocks.redeemInvite }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser, signInWithPassword: mocks.signInWithPassword },
  }),
}));

function formData() {
  const form = new FormData();
  form.set("locale", "en");
  form.set("token", "a".repeat(43));
  form.set("email", " relative@example.com ");
  form.set("password", "Family-Recipes-2026");
  return form;
}

describe("invited account creation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    mocks.redeemInvite.mockResolvedValue({ ok: true, userId: "new-member" });
    mocks.signInWithPassword.mockResolvedValue({ error: null });
  });

  it("creates an invited account without replacing the current session", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "owner", email: "owner@example.com" } },
      error: null,
    });
    expect(await joinAction({}, formData())).toEqual({
      created: true,
      email: "relative@example.com",
    });
    expect(mocks.redeemInvite).toHaveBeenCalledOnce();
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
    expect(mocks.setCookie).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("still signs in a signed-out invitee and opens the cookbook", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthSessionMissingError(),
    });
    await expect(joinAction({}, formData())).rejects.toThrow("redirect:/en/recipes");
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: "relative@example.com",
      password: "Family-Recipes-2026",
    });
    expect(mocks.setCookie).toHaveBeenCalledOnce();
  });

  it("does not change the session or report success when redemption fails", async () => {
    mocks.redeemInvite.mockResolvedValue({ ok: false, reason: "invalid_invite" });
    expect(await joinAction({}, formData())).toEqual({
      error: en.members.join.errors.invalid_invite,
      email: " relative@example.com ",
    });
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
    expect(mocks.setCookie).not.toHaveBeenCalled();
  });

  it("blocks account creation when the existing session cannot be checked", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { name: "AuthRetryableFetchError", status: 503 },
    });
    expect(await joinAction({}, formData())).toEqual({
      error: en.members.join.errors.error,
      email: " relative@example.com ",
    });
    expect(mocks.redeemInvite).not.toHaveBeenCalled();
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });
});
