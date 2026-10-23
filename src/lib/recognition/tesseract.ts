import "server-only";

import { join } from "node:path";

import { createWorker, type Worker } from "tesseract.js";

import { draftFromText } from "./parse-text";
import type { RecognitionProvider } from "./types";

// Bundled with the deployment (next.config.ts outputFileTracingIncludes); nothing is downloaded.
const LANG_PATH = join(process.cwd(), "src/lib/recognition/tessdata");
// A worker that cannot start never reports an error, so give up instead of waiting a minute.
const START_TIMEOUT_MS = 20_000;

let workerPromise: Promise<Worker> | null = null;

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    const starting = createWorker(["por", "eng"], 1, { langPath: LANG_PATH, cacheMethod: "none" });
    let timer: ReturnType<typeof setTimeout> | undefined;
    workerPromise = Promise.race([
      starting,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Tesseract did not start")), START_TIMEOUT_MS);
      }),
    ])
      .finally(() => clearTimeout(timer))
      .catch((error: unknown) => {
        workerPromise = null;
        void starting.then((worker) => worker.terminate()).catch(() => {});
        throw error;
      });
  }
  return workerPromise;
}

/** Stops a running read; the next request starts a fresh worker. */
async function resetWorker() {
  const pending = workerPromise;
  workerPromise = null;
  if (pending) await pending.then((worker) => worker.terminate()).catch(() => {});
}

function abortable<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(signal.reason);
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
    work.then(resolve, reject).finally(() => signal.removeEventListener("abort", onAbort));
  });
}

/**
 * Tesseract running inside this function: the photos never leave it, and nothing is stored
 * (02-PROVIDER-DECISION.md, D-17).
 */
export const tesseractProvider: RecognitionProvider = {
  name: "tesseract",
  async recognize({ images, signal }) {
    const read = async () => {
      const worker = await getWorker();
      const texts: string[] = [];
      let confidenceSum = 0;
      for (const image of images) {
        signal.throwIfAborted();
        const { data } = await worker.recognize(Buffer.from(image));
        texts.push(data.text);
        confidenceSum += data.confidence;
      }
      return {
        draft: draftFromText(texts.join("\n")),
        confidence: images.length > 0 ? confidenceSum / images.length : null,
      };
    };

    try {
      return await abortable(read(), signal);
    } catch (error) {
      if (signal.aborted) await resetWorker();
      throw error;
    }
  },
};
