import { getMembershipStatus } from "@/lib/auth/membership";
import { MAX_PHOTOS } from "@/lib/photos/limits";
import { sanitiseDraft } from "@/lib/recognition/draft";
import { getProvider } from "@/lib/recognition/index";
import { READ_BODY_BUDGET, READ_SERVER_TIMEOUT_MS } from "@/lib/recognition/limits";
import { draftProblem } from "@/lib/recognition/quality";
import type { ReadResponse } from "@/lib/recognition/types";

export const dynamic = "force-dynamic";
// Vercel Hobby allows up to 300 s; long recipes may wait for the Groq per-minute limit.
export const maxDuration = 120;

function respond(body: ReadResponse | { failure: "unauthorised" }, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * Reads recipe photos into a draft. It writes nothing: no database row, no stored file; the
 * images live only in this request (CAPT-03, D-09, D-17).
 */
export async function POST(request: Request): Promise<Response> {
  const membership = await getMembershipStatus();
  if (membership.status === "none") return respond({ failure: "unauthorised" }, 401);
  if (membership.status === "unavailable") return respond({ failure: "unavailable" }, 503);

  const provider = getProvider();
  if (!provider) return respond({ failure: "unavailable" }, 503);

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > READ_BODY_BUDGET) return respond({ failure: "too_large" }, 413);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return respond({ failure: "invalid" }, 400);
  }

  const files = form.getAll("photos");
  const language = form.get("language") === "en" ? "en" : "pt";
  if (files.length < 1 || files.length > MAX_PHOTOS) return respond({ failure: "invalid" }, 400);
  if (!files.every((file): file is File => file instanceof File && file.type === "image/jpeg")) {
    return respond({ failure: "invalid" }, 400);
  }
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > READ_BODY_BUDGET) return respond({ failure: "too_large" }, 413);

  const images = await Promise.all(
    files.map(async (file) => new Uint8Array(await file.arrayBuffer())),
  );
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(READ_SERVER_TIMEOUT_MS)]);

  let output;
  try {
    output = await provider.recognize({ images, language, signal });
  } catch {
    return respond({ failure: signal.aborted ? "timeout" : "unavailable" });
  }

  const draft = sanitiseDraft(output.draft);
  if (!draft) return respond({ failure: "invalid" });
  const problem = draftProblem(draft, output.confidence);
  if (problem) return respond({ failure: problem });
  return respond({ draft });
}
