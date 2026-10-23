import { afterEach, describe, expect, it, vi } from "vitest";

import { configuredProvider } from "@/lib/recognition/config";
import { getProvider } from "@/lib/recognition/index";
import { isRecognitionEnabled } from "@/lib/recognition/provider-approved";

describe("recognition provider selection", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    [undefined, "tesseract"],
    ["", "tesseract"],
    ["tesseract", "tesseract"],
    ["stub", "stub"],
    ["off", null],
    ["document-ai", null],
  ])("RECOGNITION_PROVIDER=%s selects %s", (value, expected) => {
    if (value === undefined) vi.stubEnv("RECOGNITION_PROVIDER", undefined as unknown as string);
    else vi.stubEnv("RECOGNITION_PROVIDER", value);
    expect(configuredProvider()).toBe(expected);
    expect(getProvider()?.name ?? null).toBe(expected);
    expect(isRecognitionEnabled()).toBe(expected !== null);
  });

  it("the stub returns a fixed Portuguese draft", async () => {
    vi.stubEnv("RECOGNITION_PROVIDER", "stub");
    const output = await getProvider()!.recognize({
      images: [],
      language: "pt",
      signal: new AbortController().signal,
    });
    expect(output.draft.title).toBe("Bolo de laranja");
    expect(output.draft.ingredients).toContain("1/2 chávena de açúcar");
  });
});
