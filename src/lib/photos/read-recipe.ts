import { READ_BODY_BUDGET, READ_CLIENT_TIMEOUT_MS, READ_JPEG_QUALITY, READ_LONG_EDGE } from "@/lib/recognition/limits";
import type { ReadResponse } from "@/lib/recognition/types";

import { fitWithin } from "./resize";

async function shrink(blob: Blob, longEdge: number, quality: number): Promise<Blob | null> {
  const bitmap = await createImageBitmap(blob);
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height, longEdge);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(bitmap, 0, 0, width, height);
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  } finally {
    bitmap.close();
  }
}

/**
 * Smaller copies of the prepared photos for reading only, so the request stays under the
 * hosting limit; the full photos are kept for saving. Returns null when they cannot fit.
 */
export async function prepareReadingCopies(blobs: Blob[]): Promise<Blob[] | null> {
  for (const [longEdge, quality] of [
    [READ_LONG_EDGE, READ_JPEG_QUALITY],
    [1200, 0.7],
  ] as const) {
    const copies = await Promise.all(blobs.map((blob) => shrink(blob, longEdge, quality)));
    if (copies.some((copy) => copy === null)) return null;
    const ready = copies as Blob[];
    if (ready.reduce((sum, copy) => sum + copy.size, 0) <= READ_BODY_BUDGET) return ready;
  }
  return null;
}

/**
 * Sends the photos to the read endpoint and returns a draft or a failure. Nothing is stored:
 * the endpoint only reads (CAPT-03). Stops after about a minute (D-11) or when `signal` aborts.
 */
export async function readRecipe(
  blobs: Blob[],
  language: "pt" | "en",
  signal: AbortSignal,
): Promise<ReadResponse> {
  if (!navigator.onLine) return { failure: "unavailable" };

  const copies = await prepareReadingCopies(blobs);
  if (!copies) return { failure: "too_large" };
  signal.throwIfAborted();

  const body = new FormData();
  body.set("language", language);
  copies.forEach((copy, index) => body.append("photos", copy, `page-${index + 1}.jpg`));

  const timeout = AbortSignal.timeout(READ_CLIENT_TIMEOUT_MS);
  try {
    const response = await fetch("/api/recipes/read", {
      method: "POST",
      body,
      signal: AbortSignal.any([signal, timeout]),
      cache: "no-store",
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as ReadResponse | null;
      return payload && "failure" in payload && payload.failure === "too_large"
        ? payload
        : { failure: "unavailable" };
    }
    return (await response.json()) as ReadResponse;
  } catch (error) {
    if (signal.aborted) throw error;
    return { failure: timeout.aborted ? "timeout" : "unavailable" };
  }
}
