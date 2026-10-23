import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { groqProvider } from "@/lib/recognition/groq";

const page = (n: number) => new Uint8Array([0xff, 0xd8, n]);

function reply(draft: object, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(draft) } }] }), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function rateLimited(message = "Please try again in 0.01s.", headers: Record<string, string> = {}) {
  return new Response(JSON.stringify({ error: { message } }), { status: 429, headers });
}

describe("groq provider", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubEnv("GROQ_API_KEY", "gsk_test_key");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const read = (images: Uint8Array[], signal = new AbortController().signal) =>
    groqProvider.recognize({ images, language: "pt", signal });

  it("sends the pages in order as base64 JPEG with JSON mode and the server-side key", async () => {
    fetchMock.mockResolvedValueOnce(reply({ title: "Bolo", ingredients: ["2 ovos"], steps: ["Bater."] }));
    const output = await read([page(1), page(2)]);

    expect(output).toEqual({
      draft: { title: "Bolo", ingredients: ["2 ovos"], steps: ["Bater."] },
      confidence: null,
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(init.headers.Authorization).toBe("Bearer gsk_test_key");
    const body = JSON.parse(init.body);
    expect(body.model).toBe("qwen/qwen3.8-27b");
    expect(body.response_format).toEqual({ type: "json_object" });
    const images = body.messages[0].content.filter((part: { type: string }) => part.type === "image_url");
    expect(images.map((part: { image_url: { url: string } }) => part.image_url.url)).toEqual([
      `data:image/jpeg;base64,${Buffer.from(page(1)).toString("base64")}`,
      `data:image/jpeg;base64,${Buffer.from(page(2)).toString("base64")}`,
    ]);
  });

  it("reads more than three pages in chunks and merges them in order", async () => {
    fetchMock
      .mockResolvedValueOnce(reply({ title: "Bolo", ingredients: ["a"], steps: ["1"] }))
      .mockResolvedValueOnce(reply({ title: "Cobertura", ingredients: ["b"], steps: ["2"] }));
    const output = await read([page(1), page(2), page(3), page(4)]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(output.draft).toEqual({ title: "Bolo", ingredients: ["a", "b"], steps: ["1", "2"] });
  });

  it("waits once when Groq asks, then retries the same pages", async () => {
    fetchMock
      .mockResolvedValueOnce(rateLimited())
      .mockResolvedValueOnce(reply({ title: "Bolo", ingredients: ["a"], steps: [] }));
    const output = await read([page(1)]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(output.draft.title).toBe("Bolo");
  });

  it("keeps waiting while Groq still reports the per-minute limit", async () => {
    fetchMock
      .mockResolvedValueOnce(rateLimited())
      .mockResolvedValueOnce(rateLimited())
      .mockResolvedValueOnce(reply({ title: "Bolo", ingredients: ["a"], steps: [] }));
    const output = await read([page(1)]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(output.draft.title).toBe("Bolo");
  });

  it("gives up when the wait would outlast the read", async () => {
    fetchMock.mockResolvedValue(rateLimited("Please try again in 60s.", { "retry-after": "60" }));
    const controller = new AbortController();
    const pending = read([page(1)], controller.signal);
    setTimeout(() => controller.abort(new Error("timeout")), 20);
    await expect(pending).rejects.toThrow();
  });

  it("rejects errors, malformed JSON and a missing key", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 500 }));
    await expect(read([page(1)])).rejects.toThrow("500");

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ choices: [{ message: { content: "not json" } }] }), { status: 200 }),
    );
    await expect(read([page(1)])).rejects.toThrow();

    fetchMock.mockResolvedValueOnce(reply({ title: "Bolo", ingredients: "ovos", steps: [] }));
    await expect(read([page(1)])).rejects.toThrow("unexpected shape");

    vi.stubEnv("GROQ_API_KEY", "");
    await expect(read([page(1)])).rejects.toThrow("GROQ_API_KEY");
  });
});
