import "server-only";

import type { DraftRecipe, RecognitionProvider } from "./types";

const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "qwen/qwen3.8-27b";
/** Each page costs about 1.9 K input tokens; the free tier allows 7 K per minute. */
const PAGES_PER_REQUEST = 3;
/** Rate-limit waits per chunk; the read's deadline usually stops it first. */
const MAX_RATE_LIMIT_WAITS = 8;

const PROMPT = [
  "You are reading photos of a handwritten family recipe; the images are its pages in order.",
  "Transcribe it exactly as written: keep the original language, wording, accents, abbreviations, quantities and units.",
  "Do not translate, correct spelling, convert units or invent anything. If a word is unreadable, write your best reading.",
  'Return only JSON: {"title": string, "ingredients": string[], "steps": string[]}.',
  "title: the recipe name. ingredients: one entry per ingredient line. steps: the method in order, one entry per instruction, without numbering.",
  "If the page has a second part (for example a topping), keep its ingredients and steps in the same lists, in page order.",
].join(" ");

class RateLimited extends Error {
  constructor(readonly waitMs: number) {
    super("Groq rate limit");
  }
}

const strings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

function parseDraft(content: unknown): DraftRecipe {
  const data = JSON.parse(typeof content === "string" ? content : "") as Record<string, unknown>;
  const title = typeof data.title === "string" ? data.title : "";
  if (!strings(data.ingredients ?? []) || !strings(data.steps ?? [])) {
    throw new Error("Groq returned an unexpected shape");
  }
  return {
    title,
    ingredients: (data.ingredients as string[] | undefined) ?? [],
    steps: (data.steps as string[] | undefined) ?? [],
  };
}

/** Seconds to wait from the retry-after header, or from "try again in 17.02s" in the message. */
function waitFor(response: Response, message: string): number {
  const header = Number(response.headers.get("retry-after"));
  if (Number.isFinite(header) && header > 0) return header * 1000;
  const match = /try again in ([\d.]+)s/i.exec(message);
  return match ? Number(match[1]) * 1000 : 30_000;
}

async function readChunk(images: Uint8Array[], key: string, signal: AbortSignal): Promise<DraftRecipe> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    signal,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      reasoning_format: "hidden",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            ...images.map((image) => ({
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${Buffer.from(image).toString("base64")}` },
            })),
          ],
        },
      ],
    }),
  });
  const body = (await response.json().catch(() => null)) as {
    choices?: { message?: { content?: unknown } }[];
    error?: { message?: string };
  } | null;
  if (response.status === 429) throw new RateLimited(waitFor(response, body?.error?.message ?? ""));
  if (!response.ok) throw new Error(`Groq answered ${response.status}`);
  return parseDraft(body?.choices?.[0]?.message?.content);
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => (clearTimeout(timer), reject(signal.reason)), { once: true });
  });
}

/**
 * The free tier counts input tokens over a rolling minute, so a retry can be refused again:
 * keep waiting as Groq asks until the read's own deadline aborts the signal.
 */
async function readChunkWithWaits(
  images: Uint8Array[],
  key: string,
  signal: AbortSignal,
): Promise<DraftRecipe> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await readChunk(images, key, signal);
    } catch (error) {
      if (!(error instanceof RateLimited) || attempt >= MAX_RATE_LIMIT_WAITS) throw error;
      await sleep(error.waitMs + 500, signal);
    }
  }
}

/**
 * Groq vision (qwen3.8-27b) reads the pages and returns the draft as JSON. The key stays on
 * the server; Groq keeps no inference data by default (02-PROVIDER-DECISION.md).
 */
export const groqProvider: RecognitionProvider = {
  name: "groq",
  async recognize({ images, signal }) {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("GROQ_API_KEY is not set");

    const merged: DraftRecipe = { title: "", ingredients: [], steps: [] };
    for (let start = 0; start < images.length; start += PAGES_PER_REQUEST) {
      const chunk = images.slice(start, start + PAGES_PER_REQUEST);
      const draft = await readChunkWithWaits(chunk, key, signal);
      merged.title ||= draft.title;
      merged.ingredients.push(...draft.ingredients);
      merged.steps.push(...draft.steps);
    }
    return { draft: merged, confidence: null };
  },
};
