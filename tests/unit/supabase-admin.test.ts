import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createAdminClient } from "@/lib/supabase/admin";

const mocks = vi.hoisted(() => ({ createClient: vi.fn(() => ({})) }));

vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }));

const url = "https://example.supabase.co";
const secret = "sb_secret_example0123456789";

describe("admin client configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", url);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the secret key as configured", () => {
    vi.stubEnv("SUPABASE_SECRET_KEY", secret);
    createAdminClient();
    expect(mocks.createClient).toHaveBeenCalledWith(url, secret, expect.any(Object));
  });

  it.each([
    ["double quotes", `"${secret}"`],
    ["single quotes", `'${secret}'`],
    ["surrounding whitespace", `  ${secret}\n`],
    ["quotes and whitespace", ` "${secret}" `],
  ])("accepts a secret key pasted with %s", (_label, configured) => {
    vi.stubEnv("SUPABASE_SECRET_KEY", configured);
    createAdminClient();
    expect(mocks.createClient).toHaveBeenCalledWith(url, secret, expect.any(Object));
  });

  it("still refuses to start without a secret key", () => {
    vi.stubEnv("SUPABASE_SECRET_KEY", ' "" ');
    expect(() => createAdminClient()).toThrow("Supabase admin client is not configured");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});
