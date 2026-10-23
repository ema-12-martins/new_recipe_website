// TEMPORARY diagnostic for the Vercel runtime; delete after the read endpoint works in production.
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

import { createWorker } from "tesseract.js";

import { getMembershipStatus } from "@/lib/auth/membership";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const within = <T,>(work: Promise<T>, ms: number, label: string) =>
  Promise.race([
    work,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms} ms`)), ms),
    ),
  ]);

export async function GET(): Promise<Response> {
  if ((await getMembershipStatus()).status !== "member") return new Response(null, { status: 401 });

  const started = Date.now();
  const log: string[] = [];
  const note = (message: string) => log.push(`${Date.now() - started}ms ${message}`);
  const langPath = join(process.cwd(), "src/lib/recognition/tessdata");
  note(`cwd=${process.cwd()} node=${process.version}`);
  for (const lang of ["por", "eng"]) {
    const file = join(langPath, `${lang}.traineddata.gz`);
    note(`${lang}: ${existsSync(file) ? `${statSync(file).size} bytes` : "MISSING"}`);
  }

  let lastStatus = "";
  try {
    const worker = await within(
      createWorker(["por", "eng"], 1, {
        langPath,
        cacheMethod: "none",
        logger: (m: { status: string }) => {
          if (m.status !== lastStatus) {
            lastStatus = m.status;
            note(`status: ${m.status}`);
          }
        },
        errorHandler: (error: unknown) => note(`worker error: ${String(error)}`),
      }),
      30_000,
      "createWorker",
    );
    note("worker ready");
    await worker.terminate();
    note("terminated");
  } catch (error) {
    note(`failed: ${String(error)}`);
  }
  return Response.json({ log }, { headers: { "Cache-Control": "no-store" } });
}
