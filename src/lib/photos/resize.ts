import { JPEG_QUALITY, LONG_EDGE } from "./limits";

/** Scales down so the longer side is at most `max`; never enlarges and keeps the aspect ratio. */
export function fitWithin(width: number, height: number, max: number) {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };
  const scale = max / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export type PrepareResult =
  | { ok: true; blob: Blob }
  | { ok: false; reason: "unsupported" | "failed" };

/**
 * Decodes a chosen image (honouring its EXIF orientation), resizes it and re-encodes it as
 * JPEG in the browser, so uploads stay small and every photo has the same type (D-03).
 */
export async function prepareJpeg(file: File): Promise<PrepareResult> {
  if (!file.type.startsWith("image/")) return { ok: false, reason: "unsupported" };

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Browsers that cannot decode the format (for example HEIC outside Safari) end up here.
    return { ok: false, reason: "unsupported" };
  }

  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height, LONG_EDGE);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return { ok: false, reason: "failed" };
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    return blob ? { ok: true, blob } : { ok: false, reason: "failed" };
  } catch {
    return { ok: false, reason: "failed" };
  } finally {
    bitmap.close();
  }
}
