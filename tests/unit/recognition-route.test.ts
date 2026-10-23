import { readFileSync } from "node:fs";

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RecognitionProvider } from "@/lib/recognition/types";

const mocks = vi.hoisted(() => ({
  membership: vi.fn(),
  provider: vi.fn(),
}));

vi.mock("@/lib/auth/membership", () => ({ getMembershipStatus: mocks.membership }));
vi.mock("@/lib/recognition/index", () => ({ getProvider: mocks.provider }));

const { POST } = await import("@/app/api/recipes/read/route");

const draft = {
  title: "Bolo de laranja",
  ingredients: ["1/2 chávena de açúcar", " "],
  steps: ["Levar ao forno a 180 °C."],
};

function provider(recognize: RecognitionProvider["recognize"]): RecognitionProvider {
  return { name: "test", recognize };
}

function request(files: File[], init: { headers?: Record<string, string>; signal?: AbortSignal } = {}) {
  const body = new FormData();
  body.set("language", "pt");
  for (const file of files) body.append("photos", file);
  return new Request("http://localhost/api/recipes/read", { method: "POST", body, ...init });
}

const jpeg = (name = "p.jpg") => new File([new Uint8Array([0xff, 0xd8, 0xff])], name, { type: "image/jpeg" });

describe("POST /api/recipes/read", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.membership.mockResolvedValue({ status: "member", membership: {} });
    mocks.provider.mockReturnValue(provider(async () => ({ draft, confidence: 80 })));
  });

  it("refuses visitors without a membership", async () => {
    mocks.membership.mockResolvedValue({ status: "none" });
    const response = await POST(request([jpeg()]));
    expect(response.status).toBe(401);
  });

  it("reports an outage as unavailable", async () => {
    mocks.membership.mockResolvedValue({ status: "unavailable" });
    expect(await (await POST(request([jpeg()]))).json()).toEqual({ failure: "unavailable" });
  });

  it("rejects a declared body over the budget before reading it", async () => {
    const response = await POST(request([jpeg()], { headers: { "content-length": "5000000" } }));
    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ failure: "too_large" });
  });

  it("rejects non-JPEG files and more than six photos", async () => {
    const png = new File([new Uint8Array([1])], "p.png", { type: "image/png" });
    expect((await POST(request([png]))).status).toBe(400);
    expect((await POST(request(Array.from({ length: 7 }, () => jpeg())))).status).toBe(400);
    expect((await POST(request([]))).status).toBe(400);
  });

  it("returns the sanitised draft without storing anything", async () => {
    const response = await POST(request([jpeg(), jpeg("p2.jpg")]));
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      draft: { title: "Bolo de laranja", ingredients: ["1/2 chávena de açúcar"], steps: ["Levar ao forno a 180 °C."] },
    });
  });

  it("maps a low-confidence read to low_quality and an empty read to empty", async () => {
    mocks.provider.mockReturnValue(provider(async () => ({ draft, confidence: 20 })));
    expect(await (await POST(request([jpeg()]))).json()).toEqual({ failure: "low_quality" });
    mocks.provider.mockReturnValue(
      provider(async () => ({ draft: { title: "", ingredients: [], steps: [] }, confidence: 0 })),
    );
    expect(await (await POST(request([jpeg()]))).json()).toEqual({ failure: "empty" });
  });

  it("maps a provider error to unavailable and an abort to timeout", async () => {
    mocks.provider.mockReturnValue(
      provider(async () => {
        throw new Error("boom");
      }),
    );
    expect(await (await POST(request([jpeg()]))).json()).toEqual({ failure: "unavailable" });

    const controller = new AbortController();
    mocks.provider.mockReturnValue(
      provider(
        ({ signal }) =>
          new Promise((_, reject) => {
            signal.addEventListener("abort", () => reject(signal.reason));
            controller.abort();
          }),
      ),
    );
    const response = await POST(request([jpeg()], { signal: controller.signal }));
    expect(await response.json()).toEqual({ failure: "timeout" });
  });

  it("is hidden when no provider is configured", async () => {
    mocks.provider.mockReturnValue(null);
    expect((await POST(request([jpeg()]))).status).toBe(503);
  });

  it("never writes to the database or Storage", () => {
    const source = readFileSync("src/app/api/recipes/read/route.ts", "utf8");
    expect(source).not.toMatch(/\.insert\(|\.upload\(|\.update\(|\.from\(/);
  });
});
